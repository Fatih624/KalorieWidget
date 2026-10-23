import { findLocal } from './local-food-search';
import type { Food } from './nutrition';

// Offline matches from saved meals and bundled food data; no network calls.
// Never guess a barcode by fuzzy name similarity.
export function localProductMatches(input: string, foods: Food[]): Food[] {
  const query = input.trim();
  if (/^\d{8,14}$/.test(query)) return foods.filter(food => {
    return food.id === `off-${query}` ||
      food.id === `lidl-${query}` ||
      food.source.includes(`· ${query} ·`) ||
      food.source.endsWith(`· ${query}`);
  }).slice(0, 12);
  return findLocal(query, foods).slice(0, 12);
}
