// Shared local food recognition; no network or AI calls.
import { resizeFood as portion, fmt as number } from './nutrition';
import type { Food } from './nutrition';

function searchText(text: string): string {
  return text.toLocaleLowerCase("de").normalize("NFD")
    .replace(/\p{M}/gu, "").replace(/ß/g, "ss").trim();
}
type ServingUnit = "piece" | "can" | "scoop" | "slice" | "cup" | "portion";
const unitPattern = "stucke?|stuecke?|stck|stk|dosen?|scoops?|scheiben?|becher|portionen?|portion";
const countPattern = "-?\\d+(?:[.,]\\d+)?|eine[mnrs]?|ein|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn";
function servingUnit(unit: string): ServingUnit {
  if (/^dos/.test(unit)) return "can";
  if (/^scoop/.test(unit)) return "scoop";
  if (/^scheib/.test(unit)) return "slice";
  if (unit === "becher") return "cup";
  if (/^portion/.test(unit)) return "portion";
  return "piece";
}
function serving(food: Food): { unit: ServingUnit; grams: number } | undefined {
  const name = searchText(food.name);
  const named = name.match(new RegExp(`(?:^|·)\\s*(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})\\b`));
  if (named) {
    const weight = name.match(/\((\d+(?:[.,]\d+)?)\s*g(?=\s*(?:\)|ohne\b|abgetropft\b|essbarer\b))/);
    const count = Number(named[1].replace(",", "."));
    if (count > 0) return { unit: servingUnit(named[2]), grams: (weight ? Number(weight[1].replace(",", ".")) : food.grams) / count };
  }
  if (/\b\d+-g-becher\b/.test(name)) {
    return { unit: "cup", grams: Number(name.match(/(\d+)-g-becher/)![1]) };
  }
  // Retain physical units even if a gram-scaled result was saved as a favorite.
  const standardServings: Record<string, [ServingUnit, number]> = {
    "standard-egg-l": ["piece", 60], "standard-whey-scoop": ["scoop", 30],
    "standard-chickpeas-can": ["can", 240], "standard-black-beans-can": ["can", 240],
    "standard-white-beans-can": ["can", 240], "standard-toast-large": ["slice", 38],
    "standard-toast-small": ["slice", 25], "standard-protein-bar": ["piece", 55],
    "standard-egg-waffle": ["piece", 30], "standard-medjool-date": ["piece", 24],
    "standard-pink-lady": ["piece", 180], "standard-pear": ["piece", 170],
    "standard-skyr-500": ["cup", 500],
  };
  const known = standardServings[food.id];
  if (known) return { unit: known[0], grams: known[1] };
  // These unlabelled favorites conventionally describe one whole fruit.
  if (/^(banane|apfel|pink lady apfel|birne)\b/.test(name)) return { unit: "piece", grams: food.grams };
  return undefined;
}
// Adjacent letter swaps, missing letters, extra letters and substitutions.
function spellingDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1,
      rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
      rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
  }
  return rows[a.length][b.length];
}
export function findLocal(query: string, favorites: Food[]): Food[] {
  let text = searchText(query);
  if (!text) return favorites;
  if (/^-?\d+(?:[.,]\d+)?$/.test(text)) return [];
  let grams: number | undefined;
  let count: number | undefined;
  let unit: ServingUnit | undefined;
  const weight = text.match(/(?:^|\s)(-?\d+(?:[.,]\d+)?)\s*(kg|g|gramm)\b/);
  if (weight) {
    grams = Number(weight[1].replace(",", ".")) * (weight[2] === "kg" ? 1000 : 1);
    text = text.replace(weight[0], " ").trim();
  } else {
    const explicit = text.match(new RegExp(`(?:^|\\s)(${countPattern})\\s*(${unitPattern})\\b\\.?`));
    const amount = explicit ?? text.match(new RegExp(`^(${countPattern})(?:\\s*x\\s*|\\s+)(?=\\S)`));
    if (amount) {
      const wordCounts: Record<string, number> = { ein: 1, eine: 1, einen: 1, einem: 1, einer: 1, eines: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10 };
      count = wordCounts[amount[1]] ?? Number(amount[1].replace(",", "."));
      if (explicit) unit = servingUnit(explicit[2]);
      text = text.replace(amount[0], " ").trim();
    }
  }
  if (grams !== undefined && (!Number.isFinite(grams) || grams <= 0 || grams > 10000) ||
      count !== undefined && (!Number.isFinite(count) || count <= 0 || count > 10000))
    throw new Error("Bitte eine gültige positive Menge eingeben.");
  // A quantity alone cannot identify a food or an appropriate serving.
  if (!text) return [];
  const aliases: Record<string, string> = { ei: "eier", kafe: "kaffee", kaffe: "kaffee" };
  const words = text.match(/[a-z0-9]+/g) ?? [];
  if (!words.length) return [];
  const rank = (name: string) => name === text ? 0 : name.startsWith(text) ? 1 :
    name.split(/\s+/).some((word) => word.startsWith(text)) ? 2 : 3;
  return favorites.map((food) => {
    const name = searchText(food.name);
    const tokens: string[] = name.match(/[a-z0-9]+/g) ?? [];
    let score = 0;
    for (const word of words) {
      const term = aliases[word] ?? word;
      if (tokens.includes(word) || tokens.includes(term)) continue;
      if (tokens.some((token) => token.startsWith(word) || token.startsWith(term))) { score += 1; continue; }
      if (tokens.some((token) => token.includes(word) || token.includes(term))) { score += 2; continue; }
      const limit = word.length < 4 ? 0 : word.length < 8 ? 1 : 2;
      const distance = limit ? Math.min(...tokens.filter((token) => Math.abs(token.length - word.length) <= limit)
        .map((token) => spellingDistance(term, token))) : Infinity;
      if (distance > limit) return undefined;
      score += 4 + distance;
    }
    const base = serving(food);
    if (count !== undefined && unit !== "portion" && (!base || unit && base.unit !== unit)) return undefined;
    const requestedGrams = grams ?? (count !== undefined ? count * (unit === "portion" ? food.grams : base!.grams) : undefined);
    // Skip individual oversized servings without hiding other valid matches.
    if (requestedGrams !== undefined && requestedGrams > 10000) return undefined;
    let result = requestedGrams !== undefined ? portion(food, requestedGrams) : food;
    if (requestedGrams !== undefined) {
      const baseName = food.name.replace(/\s*·\s*\d+(?:[.,]\d+)?\s*(?:Stücke?|Dosen?|Scoops?|Scheiben?|Portion(?:en)?|Becher|-g-Becher|kg|g)\b.*$/i, "").slice(0, 130);
      const labels: Record<ServingUnit, [string, string]> = {
        piece: ["Stück", "Stück"], can: ["Dose", "Dosen"], scoop: ["Scoop", "Scoops"],
        slice: ["Scheibe", "Scheiben"], cup: ["Becher", "Becher"], portion: ["Portion", "Portionen"],
      };
      result = { ...result, name: count !== undefined
        ? `${baseName} · ${number(count, 2)} ${labels[unit ?? base!.unit][count === 1 ? 0 : 1]}`
        : `${baseName} · ${number(requestedGrams, 2)} g` };
    }
    return { result, score: score * 10 + rank(name) };
  }).filter((match): match is { result: Food; score: number } => match !== undefined)
    .sort((a, b) => a.score - b.score).map((match) => match.result);
}

export type MealPart = { query: string; options: Food[]; error?: string };
export function splitMealQuery(query: string, favorites: Food[] = []): string[] {
  if (!/\s+und(?:\s+|$)|\+|\s+&(?:\s+|$)/i.test(query)) return [query.trim()];
  // A complete existing recipe name keeps its usual single-food behavior.
  try {
    if (findLocal(query, favorites).some((food) => /\s+und\s+|\+|\s+&\s+/i.test(food.name)))
      return [query.trim()];
  } catch { /* Check each part below. */ }
  return query.split(/\s+und(?:\s+|$)|\s*\+\s*|\s+&(?:\s+|$)/i).map((part) => part.trim());
}
export function findMealPart(query: string, favorites: Food[]): MealPart {
  if (!query.trim()) return { query, options: [], error: "Bitte ein Lebensmittel eingeben." };
  try {
    const options = findLocal(query, favorites);
    return { query, options, ...(!options.length ? { error: "Keine passende Vorlage. Bitte die Beschreibung prüfen." } : {}) };
  } catch (error) {
    return { query, options: [], error: error instanceof Error ? error.message : "Ungültige Menge." };
  }
}
