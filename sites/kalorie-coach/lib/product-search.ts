import { checkedFood, type Food } from './nutrition';

type Endpoint = 'product' | 'text-search';
type SearchLog = { event: 'product_search'; endpoint: Endpoint; outcome: string; upstreamStatus: number | null; durationMs: number };
type Options = { fetch?: typeof fetch; now?: () => number; log?: (entry: SearchLog) => void; timeoutMs?: number; cacheSize?: number; cacheTtlMs?: number };

export class ProductSearchError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter?: number) { super(message); this.name = 'ProductSearchError'; }
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const unavailable = () => new ProductSearchError(503, 'PRODUCT_DATABASE_UNAVAILABLE', 'Open Food Facts ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.');
const invalidResponse = () => new ProductSearchError(502, 'PRODUCT_DATABASE_INVALID_RESPONSE', 'Open Food Facts hat eine ungültige Antwort geliefert. Bitte später erneut versuchen.');

function foodsFrom(products: unknown[]): Food[] {
  return products.slice(0, 12).flatMap(product => {
    if (!record(product) || !record(product.nutriments) || typeof product.code !== 'string' || !/^\d{8,14}$/.test(product.code)) return [];
    const n = product.nutriments;
    const value = (key: string) => typeof n[key] === 'number' && Number.isFinite(n[key]) && n[key] >= 0 ? n[key] : null;
    const kj = value('energy_100g'), kcal = value('energy-kcal_100g') ?? (kj === null ? null : kj / 4.184);
    const name = typeof product.product_name_de === 'string' && product.product_name_de.trim() ? product.product_name_de : product.product_name;
    if (kcal === null || typeof name !== 'string' || ['proteins_100g', 'carbohydrates_100g', 'fat_100g'].some(key => value(key) === null)) return [];
    try {
      return [checkedFood({ id: `off-${product.code}`, name: name.slice(0, 160), emoji: '🍽️', grams: 100,
        macros: { kcal, protein: n.proteins_100g, carbs: n.carbohydrates_100g, fat: n.fat_100g }, source: `Open Food Facts · ${product.code}` })];
    } catch { return []; }
  });
}

function retrySeconds(response: Response, now: number): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return;
  const seconds = /^\d+$/.test(header.trim()) ? Number(header) : (Date.parse(header) - now) / 1000;
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
}

// Warm-worker cache only: bounded, short-lived, and contains public product data.
// Owner quotas are enforced by the route before calling this helper.
export function createProductSearch(options: Options = {}) {
  const request = options.fetch ?? fetch, now = options.now ?? Date.now;
  const log = options.log ?? ((entry: SearchLog) => console.info(JSON.stringify(entry)));
  const cache = new Map<string, { expires: number; foods: Food[] }>();
  const inFlight = new Map<string, Promise<Food[]>>();
  const cooldown = new Map<Endpoint, { until: number; error: ProductSearchError }>();
  const cacheSize = Math.max(1, options.cacheSize ?? 128), ttl = options.cacheTtlMs ?? 300_000;

  async function load(query: string, endpoint: Endpoint): Promise<Food[]> {
    const started = now(); let upstreamStatus: number | null = null;
    const url = new URL(endpoint === 'product' ? `https://world.openfoodfacts.org/api/v2/product/${query}.json` : 'https://world.openfoodfacts.org/cgi/search.pl');
    url.searchParams.set('fields', 'code,product_name,product_name_de,nutriments');
    if (endpoint === 'text-search') {
      // v2/search is structured search; it does not support plain-text keywords.
      url.searchParams.set('search_terms', query); url.searchParams.set('json', '1');
      url.searchParams.set('search_simple', '1'); url.searchParams.set('action', 'process'); url.searchParams.set('page_size', '12');
    }
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { reject(new ProductSearchError(504, 'PRODUCT_DATABASE_TIMEOUT', 'Open Food Facts antwortet zu langsam. Bitte später erneut versuchen.')); controller.abort(); }, options.timeoutMs ?? 6_000);
    });
    try {
      const foods = await Promise.race([timeout, (async () => {
        const response = await request(url, { headers: { 'user-agent': 'KalorieCoach/0.3.3 (https://github.com/Fatih624/KalorieWidget)', accept: 'application/json' }, signal: controller.signal });
        upstreamStatus = response.status;
        if (endpoint === 'product' && response.status === 404) return [];
        if (!response.ok) {
          const retryAfter = retrySeconds(response, now());
          if (response.status === 429) {
            const error = new ProductSearchError(429, 'PRODUCT_DATABASE_RATE_LIMITED', 'Open Food Facts begrenzt gerade die Anfragen. Bitte in einer Minute erneut versuchen.', retryAfter ?? 60);
            cooldown.set(endpoint, { until: now() + error.retryAfter! * 1000, error }); throw error;
          }
          if (response.status === 503) {
            const error = unavailable(); error.retryAfter = retryAfter ?? 60;
            cooldown.set(endpoint, { until: now() + error.retryAfter * 1000, error }); throw error;
          }
          if (response.status === 401 || response.status === 403) throw new ProductSearchError(502, 'PRODUCT_DATABASE_ACCESS_DENIED', 'Open Food Facts lässt die Produktsuche derzeit nicht zu. Bitte später erneut versuchen.');
          throw new ProductSearchError(502, 'PRODUCT_DATABASE_HTTP_ERROR', 'Open Food Facts konnte die Produktsuche nicht ausführen. Bitte später erneut versuchen.', retryAfter);
        }
        let result: unknown;
        try { result = await response.json(); } catch { throw invalidResponse(); }
        if (!record(result)) throw invalidResponse();
        if (endpoint === 'product') {
          if (result.status === 0) return [];
          if (!record(result.product)) throw invalidResponse();
          return foodsFrom([{ ...result.product, code: result.product.code ?? query }]);
        }
        if (!Array.isArray(result.products)) throw invalidResponse();
        return foodsFrom(result.products);
      })()]);
      for (const [key, entry] of cache) if (entry.expires <= now()) cache.delete(key);
      while (cache.size >= cacheSize) cache.delete(cache.keys().next().value!);
      cache.set(`${endpoint}:${query.toLocaleLowerCase('de')}`, { expires: now() + (foods.length ? ttl : Math.min(ttl, 60_000)), foods: structuredClone(foods) });
      log({ event: 'product_search', endpoint, outcome: 'success', upstreamStatus, durationMs: now() - started });
      return foods;
    } catch (cause) {
      const error = cause instanceof ProductSearchError ? cause : new ProductSearchError(502, 'PRODUCT_DATABASE_NETWORK_ERROR', 'Die Verbindung zu Open Food Facts ist fehlgeschlagen. Bitte später erneut versuchen.');
      log({ event: 'product_search', endpoint, outcome: error.code, upstreamStatus, durationMs: now() - started });
      throw error;
    } finally { clearTimeout(timer); }
  }

  return async function searchProducts(input: string): Promise<Food[]> {
    const query = input.trim();
    if (query.length < 2 || query.length > 120) throw new ProductSearchError(400, 'PRODUCT_SEARCH_INVALID_QUERY', 'Bitte 2 bis 120 Zeichen suchen.');
    const endpoint: Endpoint = /^\d{8,14}$/.test(query) ? 'product' : 'text-search';
    const key = `${endpoint}:${query.toLocaleLowerCase('de')}`, cached = cache.get(key);
    if (cached && cached.expires > now()) {
      log({ event: 'product_search', endpoint, outcome: 'cache_hit', upstreamStatus: null, durationMs: 0 });
      return structuredClone(cached.foods);
    }
    const blocked = cooldown.get(endpoint);
    if (blocked && blocked.until > now()) throw new ProductSearchError(blocked.error.status, blocked.error.code, blocked.error.message, Math.ceil((blocked.until - now()) / 1000));
    const pending = inFlight.get(key);
    if (pending) return structuredClone(await pending);
    const result = load(query, endpoint);
    if (inFlight.size < cacheSize) inFlight.set(key, result);
    try { return await result; } finally { if (inFlight.get(key) === result) inFlight.delete(key); }
  };
}

export const searchProducts = createProductSearch();
