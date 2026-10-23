import type { Entry, Food } from "./nutrition";
export type FavoriteLearning = { dismissed: string[]; automatic: string[] };
export type LearningData = { favorites: Food[]; entries: Entry[]; favoriteLearning?: FavoriteLearning };

export function checkedFavoriteLearning(value: unknown): FavoriteLearning {
  if (!value || typeof value !== 'object') throw new Error('Ungültige Favoriten-Lerndaten in der Sicherung.');
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.dismissed) || !Array.isArray(v.automatic) ||
      v.dismissed.length > 100000 || v.automatic.length > 5000 ||
      !v.dismissed.every(key => typeof key === 'string' && key.length > 0 && key.length <= 3000) ||
      !v.automatic.every(id => typeof id === 'string' && id.length < 200)) {
    throw new Error('Ungültige Favoriten-Lerndaten in der Sicherung.');
  }
  return { dismissed: [...v.dismissed] as string[], automatic: [...v.automatic] as string[] };
}

/** Exact food-name identity; portion, source and generated IDs may change. */
export function foodFavoriteKey(food: Pick<Food, "name">): string {
  return food.name.normalize("NFKC").toLocaleLowerCase("de-DE").trim().replace(/\s+/gu, " ");
}

function sameFood(a: Food, b: Food): boolean {
  return a.id === b.id || foodFavoriteKey(a) === foodFavoriteKey(b);
}

function dayNumber(day: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
  const stamp = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === day
    ? stamp / 86400000 : NaN;
}

function asFood(entry: Entry): Food {
  return {
    id: entry.id, name: entry.name, emoji: entry.emoji, grams: entry.grams,
    macros: { ...entry.macros }, source: entry.source,
  };
}

export function promoteFrequentFoods<T extends LearningData>(data: T, referenceDay: string): T {
  const reference = dayNumber(referenceDay);
  if (!Number.isFinite(reference) || data.favorites.length >= 5000) return data;
  const automatic = data.favoriteLearning?.automatic ?? [];
  let available = 10 - new Set(automatic.filter(id => data.favorites.some(f => f.id === id))).size;
  if (available <= 0) return data;
  const dismissed = new Set(data.favoriteLearning?.dismissed ?? []);
  const groups = new Map<string, { days: Set<string>; latest: Entry }>();
  for (const entry of data.entries) {
    const day = dayNumber(entry.date);
    if (!Number.isFinite(day) || day < reference - 29 || day > reference) continue;
    const key = foodFavoriteKey(entry);
    if (dismissed.has(key)) continue;
    const group = groups.get(key);
    if (!group) groups.set(key, { days: new Set([entry.date]), latest: entry });
    else {
      group.days.add(entry.date);
      if (`${entry.date}T${entry.time}` >= `${group.latest.date}T${group.latest.time}`) group.latest = entry;
    }
  }
  const candidates = [...groups.entries()].filter(([, group]) => group.days.size >= 3)
    .sort(([aKey, a], [bKey, b]) => b.days.size - a.days.size ||
      `${b.latest.date}T${b.latest.time}`.localeCompare(`${a.latest.date}T${a.latest.time}`) || aKey.localeCompare(bKey, "de-DE"));
  const favorites = [...data.favorites];
  const added: string[] = [];
  for (const [, { latest }] of candidates) {
    if (available <= 0 || favorites.length >= 5000) break;
    if (favorites.some(food => sameFood(food, latest))) continue;
    favorites.push(asFood(latest));
    added.push(latest.id);
    available--;
  }
  return added.length ? { ...data, favorites, favoriteLearning: {
    dismissed: data.favoriteLearning?.dismissed ?? [], automatic: [...automatic, ...added],
  } } : data;
}

export function dismissFavorite<T extends LearningData>(data: T, food: Food): T {
  const dismissed = data.favoriteLearning?.dismissed ?? [];
  const automatic = data.favoriteLearning?.automatic ?? [];
  const key = foodFavoriteKey(food);
  const favorites = data.favorites.filter(f => f.id !== food.id);
  if (favorites.length === data.favorites.length && dismissed.includes(key) && !automatic.includes(food.id)) return data;
  return { ...data, favorites, favoriteLearning: {
    dismissed: dismissed.includes(key) ? dismissed : [...dismissed, key],
    automatic: automatic.filter(id => id !== food.id),
  } };
}

export function restoreFavorite<T extends LearningData>(data: T, food: Food, wasAutomatic: boolean): T {
  const existing = data.favorites.find(f => sameFood(f, food));
  const favorites = existing || data.favorites.length >= 5000 ? data.favorites : [...data.favorites, { ...food, macros: { ...food.macros } }];
  const restored = existing ?? favorites.find(f => f.id === food.id);
  const automatic = data.favoriteLearning?.automatic ?? [];
  const dismissed = data.favoriteLearning?.dismissed ?? [];
  const activeAutomaticCount = new Set(automatic.filter(id => favorites.some(f => f.id === id))).size;
  const nextAutomatic = wasAutomatic && restored && !automatic.includes(restored.id) && activeAutomaticCount < 10
    ? [...automatic, restored.id] : automatic;
  const nextDismissed = dismissed.filter(key => key !== foodFavoriteKey(food));
  if (favorites === data.favorites && nextAutomatic === automatic && nextDismissed.length === dismissed.length) return data;
  return { ...data, favorites, favoriteLearning: { dismissed: nextDismissed, automatic: nextAutomatic } };
}

export function markFavoriteManual<T extends LearningData>(data: T, food: Food): T {
  const automatic = data.favoriteLearning?.automatic ?? [];
  const dismissed = data.favoriteLearning?.dismissed ?? [];
  const key = foodFavoriteKey(food);
  if (!automatic.includes(food.id) && !dismissed.includes(key)) return data;
  return { ...data, favoriteLearning: {
    automatic: automatic.filter(id => id !== food.id),
    dismissed: dismissed.filter(item => item !== key),
  } };
}

/** A remote deletion becomes a local learning exclusion, including on this device. */
export function withSyncedFavorites<T extends LearningData>(data: T, nextFavorites: Food[]): T {
  const dismissed = new Set(data.favoriteLearning?.dismissed ?? []);
  for (const old of data.favorites) {
    if (!nextFavorites.some(food => sameFood(old, food))) dismissed.add(foodFavoriteKey(old));
  }
  const automatic = (data.favoriteLearning?.automatic ?? []).filter(id => nextFavorites.some(food => food.id === id));
  return { ...data, favorites: nextFavorites, favoriteLearning: { dismissed: [...dismissed], automatic } };
}

