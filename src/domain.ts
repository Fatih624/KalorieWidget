export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type Food = {
  id: string;
  name: string;
  emoji: string;
  grams: number;
  macros: Macros;
  source: string;
};
export type Entry = Food & { entryId: string; date: string; time: string };
export type Settings = {
  goals: Macros;
  collapsed: boolean;
  alwaysOnTop: boolean;
  reducedMotion: boolean;
  opacity: number;
  provider: "openai" | "groq" | "openrouter";
  model: string;
  dailyLimit: number;
  speech: boolean;
  reminder: boolean;
};
export type AppData = {
  version: 1;
  settings: Settings;
  favorites: Food[];
  entries: Entry[];
};
export const zero: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
export const today = () => localDate(new Date());
export function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const number = (value: number, digits = 0) =>
  value.toLocaleString("de-DE", { maximumFractionDigits: digits });
export function sum(foods: { macros: Macros }[]): Macros {
  return foods.reduce(
    (total, food) => ({
      kcal: total.kcal + food.macros.kcal,
      protein: total.protein + food.macros.protein,
      carbs: total.carbs + food.macros.carbs,
      fat: total.fat + food.macros.fat,
    }),
    { ...zero },
  );
}
export function portion(food: Food, grams: number): Food {
  if (!Number.isFinite(food.grams) || food.grams <= 0)
    throw new Error("Die ursprüngliche Portion ist ungültig.");
  if (!Number.isFinite(grams) || grams <= 0 || grams > 10000)
    throw new Error("Bitte eine Portion zwischen 1 und 10.000 g eingeben.");
  const factor = grams / food.grams;
  return {
    ...food,
    grams,
    macros: {
      kcal: food.macros.kcal * factor,
      protein: food.macros.protein * factor,
      carbs: food.macros.carbs * factor,
      fat: food.macros.fat * factor,
    },
  };
}
export function makeEntry(food: Food, date = today()): Entry {
  return {
    ...food,
    macros: { ...food.macros },
    entryId: crypto.randomUUID(),
    date,
    time: new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}
export const defaults = (): AppData => ({
  version: 1,
  settings: {
    goals: { kcal: 2200, protein: 150, carbs: 250, fat: 67 },
    collapsed: false,
    alwaysOnTop: true,
    reducedMotion: false,
    opacity: 65,
    provider: "openai",
    model: "gpt-4.1-mini",
    dailyLimit: 10,
    speech: false,
    reminder: false,
  },
  favorites: [
    {
      id: "skyr",
      name: "Skyr natur",
      emoji: "🥣",
      grams: 250,
      macros: { kcal: 158, protein: 27.5, carbs: 10, fat: 0.5 },
      source: "Standard · Richtwert",
    },
    {
      id: "oats",
      name: "Haferflocken",
      emoji: "🌾",
      grams: 60,
      macros: { kcal: 223, protein: 8.1, carbs: 35.2, fat: 4.2 },
      source: "Standard · Richtwert",
    },
    {
      id: "banana",
      name: "Banane",
      emoji: "🍌",
      grams: 120,
      macros: { kcal: 107, protein: 1.3, carbs: 24, fat: 0.4 },
      source: "Standard · Richtwert",
    },
  ],
  entries: [],
});
function object(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
export function validMacros(v: unknown, goals = false): v is Macros {
  return (
    object(v) &&
    ["kcal", "protein", "carbs", "fat"].every(
      (k) =>
        typeof v[k] === "number" &&
        Number.isFinite(v[k]) &&
        (v[k] as number) >= (goals ? 1 : 0) &&
        (v[k] as number) <= (k === "kcal" ? 50000 : 10000),
    )
  );
}
export function validFood(v: unknown): v is Food {
  return (
    object(v) &&
    typeof v.id === "string" &&
    v.id.length < 200 &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    v.name.length <= 160 &&
    typeof v.emoji === "string" &&
    v.emoji.length <= 16 &&
    typeof v.source === "string" &&
    v.source.length <= 300 &&
    typeof v.grams === "number" &&
    Number.isFinite(v.grams) &&
    v.grams > 0 &&
    v.grams <= 10000 &&
    validMacros(v.macros)
  );
}
export function parseData(input: unknown): AppData {
  if (
    !object(input) ||
    input.version !== 1 ||
    !Array.isArray(input.favorites) ||
    !Array.isArray(input.entries) ||
    !object(input.settings)
  )
    throw new Error(
      "Das ist keine gültige Kalorie-Widget-Sicherung (Version 1).",
    );
  if (
    input.favorites.length > 5000 ||
    input.entries.length > 100000 ||
    !input.favorites.every(validFood)
  )
    throw new Error("Ungültige Lebensmittel in der Sicherung.");
  if (
    !input.entries.every(
      (e: unknown) =>
        object(e) &&
        typeof e.entryId === "string" &&
        typeof e.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
        localDate(new Date(e.date + "T12:00:00")) === e.date &&
        typeof e.time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(e.time) &&
        validFood(e),
    )
  )
    throw new Error("Ungültige Tagebucheinträge in der Sicherung.");
  const s = input.settings;
  if (!validMacros(s.goals, true)) throw new Error("Ungültige Tagesziele.");
  const fallback = defaults().settings;
  return {
    version: 1,
    favorites: input.favorites,
    entries: input.entries,
    settings: {
      goals: s.goals,
      collapsed: s.collapsed === true,
      alwaysOnTop: s.alwaysOnTop !== false,
      reducedMotion: s.reducedMotion === true,
      opacity:
        typeof s.opacity === "number" && Number.isFinite(s.opacity)
          ? Math.max(30, Math.min(95, s.opacity))
          : 65,
      provider:
        s.provider === "groq" || s.provider === "openrouter"
          ? s.provider
          : "openai",
      model:
        typeof s.model === "string" && /^[\w./:@-]{1,120}$/.test(s.model)
          ? s.model
          : fallback.model,
      dailyLimit:
        typeof s.dailyLimit === "number" && Number.isFinite(s.dailyLimit)
          ? Math.max(0, Math.min(100, Math.floor(s.dailyLimit)))
          : 10,
      speech: s.speech === true,
      reminder: s.reminder === true,
    },
  };
}
export function week(entries: Entry[], now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const date = localDate(d);
    return {
      date,
      label: d
        .toLocaleDateString("de-DE", { weekday: "short" })
        .replace(".", ""),
      ...sum(entries.filter((e) => e.date === date)),
      count: entries.filter((e) => e.date === date).length,
    };
  });
}
export function findLocal(query: string, favorites: Food[]): Food[] {
  const amount = query.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(kg|g|gramm)\b/i);
  const text = query
    .replace(/(?:^|\s)\d+(?:[.,]\d+)?\s*(kg|g|gramm)\b/i, "")
    .trim()
    .toLocaleLowerCase("de");
  if (!text) return favorites;
  return favorites
    .filter((f) => f.name.toLocaleLowerCase("de").includes(text))
    .map((f) =>
      amount
        ? portion(
            f,
            Number(amount[1].replace(",", ".")) *
              (amount[2].toLowerCase() === "kg" ? 1000 : 1),
          )
        : f,
    );
}
