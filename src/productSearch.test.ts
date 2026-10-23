import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProductSearch } from '../sites/kalorie-coach/lib/product-search';

const product = { code: '1234567890123', product_name: 'Tofu', nutriments: { 'energy-kcal_100g': 150, proteins_100g: 15, carbohydrates_100g: 2, fat_100g: 9 } };
const response = (value: unknown, status = 200, headers?: HeadersInit) => Response.json(value, { status, headers });
const setup = (implementation: (...args: Parameters<typeof fetch>) => Promise<Response>, options = {}) => {
  const fetcher = vi.fn(implementation), log = vi.fn();
  return { fetcher, log, search: createProductSearch({ fetch: fetcher, log, ...options }) };
};
afterEach(() => vi.useRealTimers());

describe('serverseitige Produktsuche', () => {
  it('liest Texttreffer als 100-g-Produkte und verwendet den Volltext-Endpunkt', async () => {
    const { search, fetcher, log } = setup(async () => response({ products: [product] }));
    expect(await search('Tofu')).toMatchObject([{ id: 'off-1234567890123', name: 'Tofu', grams: 100, macros: { kcal: 150, protein: 15 } }]);
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.pathname).toBe('/cgi/search.pl'); expect(url.searchParams.get('search_terms')).toBe('Tofu');
    expect(JSON.stringify(log.mock.calls)).not.toContain('Tofu');
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ upstreamStatus: 200, endpoint: 'text-search', outcome: 'success' }));
  });

  it('behandelt Barcode-404 und status=0 als regulär nicht gefunden', async () => {
    const missing = setup(async () => new Response('Not found', { status: 404 }));
    expect(await missing.search('12345678')).toEqual([]);
    const missing200 = setup(async () => response({ status: 0 }));
    expect(await missing200.search('12345678')).toEqual([]);
  });

  it('liest Barcodeprodukte und nutzt den gesuchten Barcode bei fehlendem Produktcode', async () => {
    const { code: _code, ...data } = product;
    const { search, fetcher } = setup(async () => response({ status: 1, product: data }));
    expect(await search('1234567890123')).toMatchObject([{ id: 'off-1234567890123' }]);
    expect(new URL(String(fetcher.mock.calls[0][0])).pathname).toBe('/api/v2/product/1234567890123.json');
  });

  it('meldet 429 mit Retry-After und fragt während der Sperrzeit nicht erneut an', async () => {
    let now = 0;
    const { search, fetcher } = setup(async () => response({}, 429, { 'retry-after': '90' }), { now: () => now });
    await expect(search('Tofu')).rejects.toMatchObject({ status: 429, code: 'PRODUCT_DATABASE_RATE_LIMITED', retryAfter: 90 });
    now = 30_000;
    await expect(search('Skyr')).rejects.toMatchObject({ retryAfter: 60 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([404, 403, 500, 502, 503])('macht aus HTTP %i keinen leeren Texttreffer', async status => {
    const { search, fetcher, log } = setup(async () => response({}, status));
    await expect(search('Tofu')).rejects.toMatchObject({ status: status === 503 ? 503 : 502 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ upstreamStatus: status }));
  });

  it('beachtet Retry-After als HTTP-Datum auch bei 503', async () => {
    const now = Date.parse('2026-10-23T15:00:00Z');
    const { search, fetcher } = setup(async () => response({}, 503, { 'retry-after': 'Fri, 23 Oct 2026 15:02:00 GMT' }), { now: () => now });
    await expect(search('Tofu')).rejects.toMatchObject({ status: 503, retryAfter: 120 });
    await expect(search('Skyr')).rejects.toMatchObject({ status: 503 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('begrenzt die Wartezeit und bricht die Netzwerkanfrage ab', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | null | undefined;
    const { search } = setup(async (_url, options) => { signal = options?.signal; return new Promise<Response>(() => {}); }, { timeoutMs: 50 });
    const check = expect(search('Tofu')).rejects.toMatchObject({ status: 504, code: 'PRODUCT_DATABASE_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(50); await check;
    expect(signal?.aborted).toBe(true);
  });

  it('begrenzt auch die Zeit zum Lesen eines hängenden Antwortkörpers', async () => {
    vi.useFakeTimers();
    const { search } = setup(async () => ({ status: 200, ok: true, json: () => new Promise(() => {}) }) as Response, { timeoutMs: 50 });
    const check = expect(search('Tofu')).rejects.toMatchObject({ status: 504 });
    await vi.advanceTimersByTimeAsync(50); await check;
  });

  it('trennt Netzwerkfehler und ungültige JSON-Antworten', async () => {
    const broken = setup(async () => { throw new TypeError('fetch failed'); });
    await expect(broken.search('Tofu')).rejects.toMatchObject({ status: 502, code: 'PRODUCT_DATABASE_NETWORK_ERROR' });
    const invalid = setup(async () => new Response('<html>Unavailable</html>'));
    await expect(invalid.search('Tofu')).rejects.toMatchObject({ status: 502, code: 'PRODUCT_DATABASE_INVALID_RESPONSE' });
    const missing = setup(async () => response({ error: 'unexpected' }));
    await expect(missing.search('Tofu')).rejects.toMatchObject({ code: 'PRODUCT_DATABASE_INVALID_RESPONSE' });
  });

  it('überspringt unvollständige Nährwerte und verarbeitet kJ', async () => {
    const kjProduct = { ...product, nutriments: { ...product.nutriments, 'energy-kcal_100g': undefined, energy_100g: 418.4 } };
    const { search } = setup(async () => response({ products: [{ ...product, nutriments: {} }, null, { ...product, product_name: 5 }, kjProduct] }));
    const foods = await search('Tofu'); expect(foods).toHaveLength(1); expect(foods[0].macros.kcal).toBeCloseTo(100);
  });

  it('verwendet einen begrenzten TTL-Cache ohne veränderbare Rückgabereferenzen', async () => {
    let now = 0;
    const { search, fetcher } = setup(async () => response({ products: [product] }), { now: () => now, cacheSize: 2, cacheTtlMs: 1000 });
    (await search('Tofu'))[0].name = 'changed';
    expect((await search(' tofu '))[0].name).toBe('Tofu'); expect(fetcher).toHaveBeenCalledTimes(1);
    await search('Skyr'); await search('Brot'); await search('Tofu');
    expect(fetcher).toHaveBeenCalledTimes(4);
    now = 1001; await search('Tofu'); expect(fetcher).toHaveBeenCalledTimes(5);
  });

  it('fasst gleichzeitige gleiche Suchanfragen zusammen und cached keine Fehler', async () => {
    const { search, fetcher } = setup(async () => response({ products: [product] }));
    expect(await Promise.all([search('Tofu'), search('Tofu')])).toHaveLength(2); expect(fetcher).toHaveBeenCalledTimes(1);
    const failed = setup(async () => response({}, 500));
    await expect(failed.search('Tofu')).rejects.toMatchObject({ status: 502 });
    await expect(failed.search('Tofu')).rejects.toMatchObject({ status: 502 });
    expect(failed.fetcher).toHaveBeenCalledTimes(2);
  });

  it('weist ungültige Suchbegriffe ohne Netzwerkanfrage ab', async () => {
    const { search, fetcher } = setup(async () => response({ products: [] }));
    await expect(search('x')).rejects.toMatchObject({ status: 400 });
    await expect(search('x'.repeat(121))).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
