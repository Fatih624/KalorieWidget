import type { Entry, Food } from "./domain";

/** Favorites take precedence; otherwise reuse the most recently eaten portion. */
export function quickSearchFoods(favorites: Food[], entries: Entry[]): Food[] {
  const recent = entries.map((food, index) => ({ food, index })).sort((a, b) =>
    b.food.date.localeCompare(a.food.date) ||
    b.food.time.localeCompare(a.food.time) || b.index - a.index,
  );
  const seen = new Set<string>();
  return [...favorites, ...recent.map(({ food }) => food)].filter((food) => {
    const name = food.name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("de");
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}
