import { localProductMatches } from './local-product-matches';
import { searchableFoods } from './recent-foods';
import type { Food } from './nutrition';
import type { ResilientSearchResult } from './search-fallback';

// Personal foods stay on the device. Resolve local matches even when the server
// responds successfully with presets or no results, not only on network errors.
export async function searchProductsForClient(
  query: string, candidates: Food[],
  request: (signal: AbortSignal) => Promise<ResilientSearchResult>,
  timeoutMs = 13_000,
): Promise<ResilientSearchResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      request(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { reject(new Error('Produktsuche dauert zu lange.')); controller.abort(); }, timeoutMs);
      }),
    ]);
    if (result.source !== 'local' && result.source !== 'none') return result;
    const foods = localProductMatches(query, searchableFoods(candidates, [], result.foods));
    return foods.length ? localResult(foods) : result;
  } catch {
    return localResult(localProductMatches(query, candidates));
  } finally { clearTimeout(timer); }
}

function localResult(foods: Food[]): ResilientSearchResult {
  return {
    foods: structuredClone(foods), source: foods.length ? 'local' : 'none', degraded: true,
    notice: foods.length
      ? 'Lokale Treffer aus Favoriten, Verlauf oder Standardwerten. Produkt, Portion und Nährwerte bitte prüfen.'
      : 'Die Online-Suche ist nicht erreichbar und lokal wurde nichts gefunden. Nutze „Manuell“ oder versuche es später erneut.',
  };
}
