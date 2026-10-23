import type { Food, Entry } from './domain';
import { searchableFoods } from '../sites/kalorie-coach/lib/recent-foods';
import { FOOD_PRESETS } from '../sites/kalorie-coach/lib/food-presets';

// Both apps use the same catalog, history ordering and personal overrides.
export function quickSearchFoods(favorites: Food[], entries: Entry[]): Food[] {
  return searchableFoods(favorites, entries, FOOD_PRESETS);
}
