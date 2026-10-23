import { afterEach, describe, expect, it, vi } from 'vitest';
import { createResilientSearch, searchUsda } from '../sites/kalorie-coach/lib/search-fallback';
import { localProductMatches } from '../sites/kalorie-coach/lib/local-product-matches';
import { FOOD_PRESETS } from '../sites/kalorie-coach/lib/food-presets';
import { ProductSearchError } from '../sites/kalorie-coach/lib/product-search';

const unavailable = async () => { throw new ProductSearchError(503, 'PRODUCT_DATABASE_UNAVAILABLE', 'Offline'); };
const usdaProduct = {
  fdcId: 987654, description: 'WHITE ROLL', foodNutrients: [
    { nutrientId: 1008, value: 280 }, { nutrientId: 1003, value: 10 },
    { nutrientId: 1005, value: 54 }, { nutrientId: 1004, value: 1.8 }
  ]
};
afterEach(() => vi.useRealTimers());

describe('stufenweiser Produkt-Fallback', () => {
  it('lässt einen gültigen Open Food Facts Treffer unverändert', async () => {
    const food = FOOD_PRESETS[0];
    const search = createResilientSearch({ primary: async () => [food] });
    expect(await search('Brötchen')).toMatchObject({ source: 'openfoodfacts', degraded: false, foods: [food] });
  });

  it('zeigt bei einem HTTP-503 trotzdem Standardlebensmittel an', async () => {
    const search = createResilientSearch({ primary: unavailable });
    const result = await search('Brötchen');
    expect(result).toMatchObject({ source: 'local', degraded: true });
    expect(result.foods.some(food => food.name.includes('Weizenbrötchen'))).toBe(true);
    expect(result.notice).toContain('Richtwert');
  });

  it('wählt für Barcodes offline ausschließlich exakt passende Produkte', async () => {
    const search = createResilientSearch({ primary: unavailable });
    expect((await search('4056489035381')).foods.map(f => f.id)).toContain('lidl-4056489035381');
    expect((await search('4056489035382')).foods).toHaveLength(0);
    expect(localProductMatches('4056489035382', FOOD_PRESETS)).toEqual([]);
  });

  it('aktiviert USDA nur bei einem serverseitigen Schlüssel und echten Textsuchen', async () => {
    const mock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => Response.json({ foods: [usdaProduct] }));
    const search = createResilientSearch({ primary: unavailable, usdaApiKey: 'test-secret', fetch: mock });
    const result = await search('bread roll');
    expect(result).toMatchObject({ source: 'usda', degraded: true });
    expect(result.foods[0]).toMatchObject({
      id: 'usda-987654', grams: 100, macros: { kcal: 280, protein: 10, carbs: 54, fat: 1.8 }
    });
    const url = new URL(String(mock.mock.calls[0][0]));
    expect(url.hostname).toBe('api.nal.usda.gov');
    expect(url.searchParams.get('api_key')).toBe('test-secret');
    expect(mock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(await searchUsda('1234567890123', 'test-secret', mock)).toEqual([]);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('fällt bei einer gestörten USDA API weiter auf die lokalen Werte zurück', async () => {
    const mock = vi.fn(async () => new Response('', { status: 503 }));
    const search = createResilientSearch({ primary: unavailable, usdaApiKey: 'test-secret', fetch: mock });
    expect((await search('Brötchen')).source).toBe('local');
  });

  it('überspringt USDA ohne Schlüssel und probiert USDA auch nach leeren Primärtreffern', async () => {
    const request = vi.fn(async () => Response.json({ foods: [usdaProduct] }));
    const withoutKey = createResilientSearch({ primary: async () => [], usdaApiKey: ' ', fetch: request });
    expect((await withoutKey('Brötchen')).source).toBe('local');
    expect(request).not.toHaveBeenCalled();
    const withKey = createResilientSearch({ primary: async () => [], usdaApiKey: 'test-secret', fetch: request });
    expect((await withKey('Brötchen')).source).toBe('usda');
  });

  it.each(['request', 'body'])('erreicht den lokalen Fallback bei hängendem USDA %s', async phase => {
    vi.useFakeTimers();
    let signal: AbortSignal | null | undefined;
    const request = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal;
      if (phase === 'request') return new Promise<Response>(() => {});
      return { ok: true, json: () => new Promise(() => {}) } as Response;
    });
    const search = createResilientSearch({ primary: unavailable, usdaApiKey: 'test-secret', fetch: request, usdaTimeoutMs: 50 });
    const check = expect(search('Brötchen')).resolves.toMatchObject({ source: 'local', degraded: true });
    await vi.advanceTimersByTimeAsync(50);
    await check;
    expect(signal?.aborted).toBe(true);
  });

  it('verwirft ungültige USDA-Daten und übernimmt nur vollständige Lebensmittel', async () => {
    const request = vi.fn(async () => Response.json({ foods: [
      null, { ...usdaProduct, fdcId: -1 }, { ...usdaProduct, fdcId: 1.5 },
      { ...usdaProduct, description: ' ' }, { ...usdaProduct, foodNutrients: [] },
      { ...usdaProduct, foodNutrients: usdaProduct.foodNutrients.map(n => ({ ...n, value: -1 })) },
      { ...usdaProduct, foodNutrients: usdaProduct.foodNutrients.map(n => ({ ...n, value: String(n.value) })) },
      usdaProduct,
    ] }));
    expect(await searchUsda('bread', 'test-secret', request)).toMatchObject([{ id: 'usda-987654' }]);
    const malformed = vi.fn(async () => new Response('<html>error</html>'));
    expect(await searchUsda('bread', 'test-secret', malformed)).toEqual([]);
  });

  it('fasst parallele Fallback-Anfragen zusammen und trennt ihre Rückgaben', async () => {
    const primary = vi.fn(unavailable);
    const request = vi.fn(async () => Response.json({ foods: [usdaProduct] }));
    const search = createResilientSearch({ primary, fetch: request, usdaApiKey: 'test-secret' });
    const [first, second] = await Promise.all([search('bread'), search(' BREAD ')]);
    first.foods[0].macros.kcal = 1;
    expect(second.foods[0].macros.kcal).toBe(280);
    expect((await search('bread')).foods[0].macros.kcal).toBe(280);
    expect(primary).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('fragt nach Ablauf des lokalen Caches erneut nach Live-Produkten', async () => {
    vi.useFakeTimers();
    const primary = vi.fn(unavailable);
    const search = createResilientSearch({ primary });
    expect((await search('Brötchen')).source).toBe('local');
    await vi.advanceTimersByTimeAsync(120_001);
    expect((await search('Brötchen')).source).toBe('local');
    expect(primary).toHaveBeenCalledTimes(2);
  });

  it('liefert bei kompletten Ausfällen keine irreführenden erfundenen Lebensmittel', async () => {
    const search = createResilientSearch({ primary: unavailable, localFoods: [] });
    const result = await search('unbekanntesessen123');
    expect(result).toMatchObject({ source: 'none', degraded: true, foods: [] });
    expect(result.notice).toContain('manuell');
  });

  it('blockiert ungültige Suchbegriffe bevor externe APIs aufgerufen werden', async () => {
    const primary = vi.fn(async () => []);
    const search = createResilientSearch({ primary });
    await expect(search('x')).rejects.toMatchObject({ status: 400 });
    await expect(search('x'.repeat(121))).rejects.toMatchObject({ status: 400 });
    expect(primary).not.toHaveBeenCalled();
  });

  it('gibt gecachte Treffer nicht als veränderbare Referenzen zurück', async () => {
    const primary = vi.fn(async () => [FOOD_PRESETS[0]]);
    const search = createResilientSearch({ primary });
    (await search('Brötchen')).foods[0].name = 'Changed';
    expect((await search('Brötchen')).foods[0].name).not.toBe('Changed');
    expect(primary).toHaveBeenCalledTimes(1);
  });

  it('isoliert lokale Treffer auch von den unveränderlichen Presets', async () => {
    const original = structuredClone(FOOD_PRESETS);
    const search = createResilientSearch({ primary: unavailable });
    (await search('Brötchen')).foods[0].name = 'Changed';
    expect(FOOD_PRESETS).toEqual(original);
  });
});
