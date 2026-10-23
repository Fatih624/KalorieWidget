import type { Entry, Food } from './nutrition';

const normalizedName = (name: string) => name.normalize('NFKC').toLocaleLowerCase('de-DE').trim().replace(/\s+/g, ' ');

// Favorites retain their chosen portion; history contributes the latest recorded portion per name.
export function searchableFoods(favorites: Food[], entries: Entry[], presets: Food[] = []): Food[] {
  const seen = new Set<string>();
  const seenIds = new Set<string>();
  const recent = entries.map((food, index) => ({ food, index })).sort((a, b) =>
    (b.food.date + b.food.time).localeCompare(a.food.date + a.food.time) || b.index - a.index);
  return [...favorites, ...recent.map(({ food }) => food), ...presets].filter(food => {
    const key = normalizedName(food.name);
    if (seen.has(key) || seenIds.has(food.id)) return false;
    seen.add(key);
    seenIds.add(food.id);
    return true;
  });
}
