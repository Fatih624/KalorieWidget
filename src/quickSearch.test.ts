import { describe, expect, it } from "vitest";
import { defaults, findLocal, makeEntry, portion } from "./domain";
import { quickSearchFoods } from "./quickSearch";

describe("Schnellsuche aus Favoriten und Tagebuch", () => {
  it("findet historische Lebensmittel aus allen Quellen und erhält ihre Portion", () => {
    const food = defaults().favorites[0];
    const entries = ["Eigene Angabe", "KI-Schätzung · bitte prüfen", "Open Food Facts"].map((source, i) =>
      makeEntry({ ...portion(food, 100 + i * 50), id: `food-${i}`, name: `Essen ${i}`, source }, `2026-10-${20 + i}`),
    );
    const results = findLocal("Essen", quickSearchFoods([], entries));
    expect(results.map((f) => f.grams)).toEqual([200, 150, 100]);
    expect(results[0].macros.kcal).toBe(entries[2].macros.kcal);
    expect(findLocal("300 g Essen 2", quickSearchFoods([], entries))[0].grams).toBe(300);
  });

  it("dedupliziert normalisierte Namen und bevorzugt Favoriten", () => {
    const favorite = { ...defaults().favorites[0], name: "Skyr natur" };
    const historical = makeEntry({ ...portion(favorite, 500), name: "  SKYR   NATUR  " });
    expect(quickSearchFoods([favorite], [historical])[0]).toEqual(favorite);
    expect(quickSearchFoods([favorite], [historical]).filter(f=>f.name.trim().toLowerCase()==='skyr natur')).toHaveLength(1);
  });

  it("wählt jüngstes Datum, Uhrzeit und zuletzt erfassten Eintrag bei Gleichstand", () => {
    const food = defaults().favorites[0];
    const entry = (grams: number, date: string, time: string) => ({ ...makeEntry(portion(food, grams), date), time });
    const entries = [entry(200, "2026-10-22", "09:00"), entry(300, "2026-10-23", "10:00"), entry(400, "2026-10-23", "10:00"), entry(100, "2026-10-23", "08:00")];
    expect(quickSearchFoods([], entries)[0].grams).toBe(400);
    expect(entries.map((e) => e.grams)).toEqual([200, 300, 400, 100]);
  });
});
