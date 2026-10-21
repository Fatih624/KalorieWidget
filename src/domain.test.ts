import { describe, expect, it } from "vitest";
import {
  defaults,
  findLocal,
  localDate,
  makeEntry,
  parseData,
  portion,
  sum,
  week,
} from "./domain";
describe("Tagebuch und Portionen", () => {
  it("rechnet Portionen und Tageswerte ohne Rundungsverlust", () => {
    const food = defaults().favorites[0];
    const scaled = portion(food, 375);
    expect(scaled.macros.protein).toBe(41.25);
    expect(sum([scaled, food]).protein).toBe(68.75);
    expect(scaled.grams).toBe(375);
    expect(food.grams).toBe(250);
  });
  it("verhindert ungültige Mengen", () => {
    for (const grams of [0, -1, NaN, Infinity, 10001])
      expect(() => portion(defaults().favorites[0], grams)).toThrow();
    expect(() =>
      portion({ ...defaults().favorites[0], grams: 0 }, 100),
    ).toThrow();
  });
  it("versteht Gramm, Dezimalkomma und Kilogramm bei Favoriten", () => {
    expect(findLocal("300 g Skyr", defaults().favorites)[0].grams).toBe(300);
    expect(
      findLocal("0,3 kg Skyr", defaults().favorites)[0].macros.kcal,
    ).toBeCloseTo(189.6);
    expect(findLocal("Skyr 300 gramm", defaults().favorites)[0].grams).toBe(
      300,
    );
  });
  it("trennt Tage anhand des lokalen Datums auch am Monatswechsel", () => {
    const data = defaults();
    const a = makeEntry(data.favorites[0], "2026-10-31");
    const b = makeEntry(data.favorites[1], "2026-11-01");
    const days = week([a, b], new Date(2026, 10, 1, 0, 5));
    expect(days).toHaveLength(7);
    expect(days[5].kcal).toBe(a.macros.kcal);
    expect(days[6].kcal).toBe(b.macros.kcal);
    expect(localDate(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
  });
});
describe("Sicherungen", () => {
  it("akzeptiert ein vollständiges Tagebuch mit Historie", () => {
    const data = defaults();
    data.entries.push(makeEntry(data.favorites[0]));
    expect(parseData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });
  it("weist beschädigte Daten zurück", () => {
    const data = defaults();
    expect(() => parseData({ ...data, version: 2 })).toThrow();
    expect(() =>
      parseData({
        ...data,
        settings: {
          ...data.settings,
          goals: { ...data.settings.goals, kcal: 0 },
        },
      }),
    ).toThrow();
    expect(() =>
      parseData({
        ...data,
        favorites: [{ ...data.favorites[0], macros: { kcal: -100 } }],
      }),
    ).toThrow();
    const entry = makeEntry(data.favorites[0]);
    expect(() =>
      parseData({ ...data, entries: [{ ...entry, date: "2026-02-31" }] }),
    ).toThrow();
    expect(() =>
      parseData({ ...data, entries: [{ ...entry, time: "99:99" }] }),
    ).toThrow();
  });
  it("exportiert keine fremden Felder oder API-Schlüssel", () => {
    const data = defaults();
    const result = parseData({
      ...data,
      apiKey: "secret",
      settings: { ...data.settings, apiKey: "secret" },
    });
    expect(JSON.stringify(result)).not.toContain("secret");
  });
  it("begrenzt Ressourcen und Anfragelimits beim Import", () => {
    const data = defaults();
    const result = parseData({
      ...data,
      settings: { ...data.settings, dailyLimit: 1e9, opacity: -1 },
    });
    expect(result.settings.dailyLimit).toBe(100);
    expect(result.settings.opacity).toBe(30);
  });
});
