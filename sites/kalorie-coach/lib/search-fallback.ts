import { FOOD_PRESETS } from './food-presets';
import { localProductMatches } from './local-product-matches';
import { checkedFood, type Food } from './nutrition';
import { ProductSearchError, searchProducts } from './product-search';

export type ResilientSearchResult = {
  foods: Food[];
  source: 'openfoodfacts' | 'usda' | 'local' | 'none';
  degraded: boolean;
  notice?: string;
};

type SearchOptions = {
  primary?: (query: string) => Promise<Food[]>;
  fetch?: typeof fetch;
  usdaApiKey?: string;
  localFoods?: Food[];
  usdaTimeoutMs?: number;
};
const barcodePattern = /^\d{8,14}$/;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function fromUsda(payload: unknown): Food[] {
  if (!record(payload) || !Array.isArray(payload.foods)) return [];
  return payload.foods.slice(0, 20).flatMap((item): Food[] => {
    if (!record(item) || !Number.isSafeInteger(item.fdcId) ||
        typeof item.description !== 'string' || !item.description.trim() ||
        !Array.isArray(item.foodNutrients)) return [];
    const values = new Map<number, number>();
    for (const raw of item.foodNutrients) {
      if (!record(raw) || typeof raw.nutrientId !== 'number' ||
          typeof raw.value !== 'number' || !Number.isFinite(raw.value) || raw.value < 0) continue;
      values.set(raw.nutrientId, raw.value);
    }
    const kcal = values.get(1008) ?? values.get(2047) ?? values.get(2048);
    const protein = values.get(1003), carbs = values.get(1005), fat = values.get(1004);
    if (kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) return [];
    try {
      return [checkedFood({
        id: `usda-${item.fdcId}`, name: item.description.slice(0, 160),
        emoji: '🍽️', grams: 100,
        macros: { kcal, protein, carbs, fat },
        source: `USDA FoodData Central · ${item.fdcId} · pro 100 g`
      })];
    } catch { return []; }
  }).slice(0, 12);
}

export async function searchUsda(
  query: string, apiKey: string, request: typeof fetch = fetch, timeoutMs = 5000
): Promise<Food[]> {
  if (!apiKey.trim() || barcodePattern.test(query)) return [];
  // Secrets are server-side only; never put the API key in browser JavaScript.
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('api_key', apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query, pageSize: 12, dataType: ['Foundation', 'SR Legacy', 'Branded'] }),
      signal: controller.signal,
    });
    if (!response.ok) return [];
    return fromUsda(await response.json());
  } catch { return []; }
  finally { clearTimeout(timeout); }
}

export function createResilientSearch(options: SearchOptions = {}) {
  const primary = options.primary ?? searchProducts;
  const localFoods = options.localFoods ?? FOOD_PRESETS;
  const apiKey = options.usdaApiKey?.trim() || '';
  const request = options.fetch ?? fetch;
  // Bounded in-memory cache avoids repeated external requests from warm workers.
  const cache = new Map<string, { until: number; result: ResilientSearchResult }>();
  return async (input: string): Promise<ResilientSearchResult> => {
    const query = input.trim();
    if (query.length < 2 || query.length > 120)
      throw new ProductSearchError(400, 'PRODUCT_SEARCH_INVALID_QUERY', 'Bitte 2 bis 120 Zeichen suchen.');
    const key = query.toLocaleLowerCase('de-DE'), hit = cache.get(key);
    if (hit && hit.until > Date.now()) return structuredClone(hit.result);
    let primaryFailed = false;
    try {
      const foods = await primary(query);
      if (foods.length) {
        const result: ResilientSearchResult = { foods, source: 'openfoodfacts', degraded: false };
        if (cache.size >= 128) cache.delete(cache.keys().next().value!);
        cache.set(key, { until: Date.now() + 5 * 60_000, result: structuredClone(result) });
        return result;
      }
    } catch (cause) {
      if (cause instanceof ProductSearchError && cause.status === 400) throw cause;
      primaryFailed = true;
    }

    // Branded barcodes should never use keyword-based USDA matches.
    const local = localProductMatches(query, localFoods);
    if (!barcodePattern.test(query) && apiKey) {
      const usdaFoods = await searchUsda(query, apiKey, request, options.usdaTimeoutMs ?? 5000);
      if (usdaFoods.length) {
        const result: ResilientSearchResult = {
          foods: usdaFoods, source: 'usda', degraded: true,
          notice: 'Ersatzdaten aus USDA FoodData Central. Produkt und Nährwerte bitte prüfen.'
        };
        if (cache.size >= 128) cache.delete(cache.keys().next().value!);
        cache.set(key, { until: Date.now() + 5 * 60_000, result: structuredClone(result) });
        return result;
      }
    }

    const result: ResilientSearchResult = {
      foods: local,
      source: local.length ? 'local' : 'none',
      degraded: primaryFailed || !!apiKey,
      notice: local.length
        ? 'Lokaler Richtwert statt Live-Produktdaten. Marke, Portion und Nährwerte bitte prüfen.'
        : primaryFailed
          ? 'Die Online-Produktsuche ist gerade nicht erreichbar. Kein lokaler Treffer; bitte manuell erfassen.'
          : 'Kein passender Treffer. Probiere einen anderen Suchbegriff oder die manuelle Eingabe.'
    };
    // Short negative cache: do not hide newly available upstream records for long.
    if (cache.size >= 128) cache.delete(cache.keys().next().value!);
    cache.set(key, { until: Date.now() + (local.length ? 2 * 60_000 : 30_000), result: structuredClone(result) });
    return result;
  };
}
