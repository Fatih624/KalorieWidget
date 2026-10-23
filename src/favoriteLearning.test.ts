import { describe, expect, it } from "vitest";
import { defaults, parseData, type AppData, type Entry, type Food } from "./domain";
import { dismissFavorite, foodFavoriteKey, markFavoriteManual, promoteFrequentFoods, restoreFavorite, withSyncedFavorites } from "./favoriteLearning";

const food = (id = "apple", name = "Apfel"): Food => ({
  id, name, emoji: "🍎", grams: 100, macros: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, source: "Test",
});
const entry = (date: string, value = food(), time = "12:00"): Entry => ({ ...value, entryId: `${date}-${value.id}-${time}`, date, time });
const data = (entries: Entry[] = [], favorites: Food[] = []): AppData => ({ ...defaults(), entries, favorites });
const history = (value = food()) => ["2026-10-21", "2026-10-22", "2026-10-23"].map(day => entry(day, value));

describe("automatic favorite learning", () => {
  it("normalizes Unicode, casing and whitespace without fuzzy matching", () => {
    expect(foodFavoriteKey({ name: "  ＳＫＹＲ\t NATUR  " })).toBe("skyr natur");
    expect(foodFavoriteKey({ name: "ÄPFEL" })).toBe("äpfel");
    expect(foodFavoriteKey({ name: "Apfel" })).not.toBe(foodFavoriteKey({ name: "Äpfel" }));
  });

  it("requires three distinct days and preserves identity without changes", () => {
    const initial = data([entry("2026-10-21"), entry("2026-10-22"), entry("2026-10-22", food("another"))]);
    expect(promoteFrequentFoods(initial, "2026-10-23")).toBe(initial);
    const promoted = promoteFrequentFoods({ ...initial, entries: [...initial.entries, entry("2026-10-23")] }, "2026-10-23");
    expect(promoted.favorites).toHaveLength(1);
    expect(promoteFrequentFoods(promoted, "2026-10-23")).toBe(promoted);
  });

  it("uses inclusive calendar bounds across DST and excludes future or invalid dates", () => {
    const initial = data([entry("2026-03-01"), entry("2026-03-29"), entry("2026-03-30")]);
    expect(promoteFrequentFoods(initial, "2026-03-30").favorites).toHaveLength(1);
    for (const day of ["2026-02-28", "2026-03-31", "2026-02-30"]) {
      const outside = data([entry(day), entry("2026-03-29"), entry("2026-03-30")]);
      expect(promoteFrequentFoods(outside, "2026-03-30")).toBe(outside);
    }
    expect(promoteFrequentFoods(initial, "bad")).toBe(initial);
  });

  it("deduplicates by normalized name or ID and copies only newest food fields", () => {
    const newest = entry("2026-10-23", { ...food("new", " APFEL "), grams: 275 }, "18:00");
    const initial = data([...history(), newest]);
    const favorite = promoteFrequentFoods(initial, "2026-10-23").favorites[0];
    expect(favorite.id).toBe("new");
    expect(favorite.grams).toBe(275);
    expect(favorite).not.toHaveProperty("entryId");
    expect(favorite).not.toHaveProperty("date");
    expect(favorite.macros).toEqual(newest.macros);
    expect(favorite.macros).not.toBe(newest.macros);
    for (const existing of [food("other", "apfel"), food("new", "Birne")]) {
      const withExisting = { ...initial, favorites: [existing] };
      expect(promoteFrequentFoods(withExisting, "2026-10-23")).toBe(withExisting);
    }
  });

  it("ranks by days, recency, then name and limits automatic and total favorites", () => {
    const foods = Array.from({ length: 12 }, (_, i) => food(`id${i}`, `Food ${String(i).padStart(2, "0")}`));
    const entries = foods.flatMap(value => history(value));
    entries.push(entry("2026-10-20", foods[11]));
    entries.push(entry("2026-10-23", foods[10], "23:00"));
    const promoted = promoteFrequentFoods(data(entries), "2026-10-23");
    expect(promoted.favorites).toHaveLength(10);
    expect(promoted.favorites.slice(0, 3).map(f => f.id)).toEqual(["id11", "id10", "id0"]);
    expect(promoteFrequentFoods(promoted, "2026-10-23")).toBe(promoted);
    const nearlyFull = data(entries, Array.from({ length: 4999 }, (_, i) => food(`existing${i}`, `Existing ${i}`)));
    expect(promoteFrequentFoods(nearlyFull, "2026-10-23").favorites).toHaveLength(5000);
    expect(promoteFrequentFoods({ ...promoted, entries: [] }, "2026-10-23").favorites).toBe(promoted.favorites);
  });

  it("uses the last array position for portions recorded during the same minute", () => {
    const earlier = { ...entry("2026-10-23", { ...food(), grams: 150 }), entryId: "zzz" };
    const later = { ...entry("2026-10-23", { ...food(), grams: 275 }), entryId: "aaa" };
    const result = promoteFrequentFoods(data([...history().slice(0, 2), earlier, later]), "2026-10-23");
    expect(result.favorites[0].grams).toBe(275);
  });

  it("restores the food manually when an automatic replacement has filled the quota", () => {
    const foods = Array.from({ length: 11 }, (_, i) => food(`id${i}`, `Food ${String(i).padStart(2, "0")}`));
    const promoted = promoteFrequentFoods(data(foods.flatMap(value => history(value))), "2026-10-23");
    const removedFood = promoted.favorites[0];
    const replaced = promoteFrequentFoods(dismissFavorite(promoted, removedFood), "2026-10-23");
    expect(replaced.favorites).toHaveLength(10);
    expect(replaced.favoriteLearning?.automatic).toHaveLength(10);
    const restored = restoreFavorite(replaced, removedFood, true);
    expect(restored.favorites).toHaveLength(11);
    expect(restored.favorites).toContainEqual(removedFood);
    expect(restored.favoriteLearning?.automatic).toHaveLength(10);
    expect(restored.favoriteLearning?.automatic).not.toContain(removedFood.id);
    expect(restored.favoriteLearning?.dismissed).not.toContain(foodFavoriteKey(removedFood));
  });

  it("dismisses, suppresses and restores including automatic provenance", () => {
    const promoted = promoteFrequentFoods(data(history()), "2026-10-23");
    const removed = dismissFavorite(promoted, promoted.favorites[0]);
    expect(removed.favorites).toEqual([]);
    expect(removed.favoriteLearning).toEqual({ dismissed: ["apfel"], automatic: [] });
    expect(promoteFrequentFoods(removed, "2026-10-23")).toBe(removed);
    const restored = restoreFavorite(removed, promoted.favorites[0], true);
    expect(restored.favorites).toEqual(promoted.favorites);
    expect(restored.favoriteLearning).toEqual({ dismissed: [], automatic: ["apple"] });
    expect(restoreFavorite(restored, food(), true)).toBe(restored);
    expect(markFavoriteManual(restored, food()).favoriteLearning).toEqual({ dismissed: [], automatic: [] });
    expect(markFavoriteManual(data(), food())).toEqual(data());
  });

  it("treats remote deletion as a learning exclusion while retaining other local data", () => {
    const original = promoteFrequentFoods(data(history()), "2026-10-23");
    const synced = withSyncedFavorites(original, []);
    expect(synced.entries).toBe(original.entries);
    expect(synced.favoriteLearning).toEqual({ dismissed: ["apfel"], automatic: [] });
    expect(promoteFrequentFoods(synced, "2026-10-23")).toBe(synced);
    expect(withSyncedFavorites(original, [food("remote")]).favoriteLearning?.dismissed).toEqual([]);
  });

  it("round trips local metadata, keeps old backups compatible and rejects malformed values", () => {
    const learned = promoteFrequentFoods(data(history()), "2026-10-23");
    expect(parseData(JSON.parse(JSON.stringify(learned)))).toEqual(learned);
    expect(parseData(data())).not.toHaveProperty("favoriteLearning");
    for (const favoriteLearning of [null, {}, { dismissed: "x", automatic: [] }, { dismissed: [1], automatic: [] },
      { dismissed: [""], automatic: [] }, { dismissed: [], automatic: ["x".repeat(200)] },
      { dismissed: ["x".repeat(3001)], automatic: [] }, { dismissed: [], automatic: Array(5001).fill("x") }]) {
      expect(() => parseData({ ...data(), favoriteLearning })).toThrow();
    }
    expect(parseData({ ...learned, favoriteLearning: { ...learned.favoriteLearning, ignored: true }, ignored: true })).toEqual(learned);
  });
});
