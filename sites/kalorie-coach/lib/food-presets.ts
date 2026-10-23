import type { Food } from './nutrition';
import { BASIC_FOODS } from './basic-foods';
import { LIDL_FOODS } from './lidl-foods';

// Standard bread roll values from Bundeslebensmittelschlüssel (BLS):
// B511000 Weizenbrötchen, B411000 Weizenvollkornbrötchen.
// Per-100-g data; a 55 g roll is an example portion, not a measured package.
export const ROLL_FOODS: Food[] = [
  {
    id: 'reference-roll-white', name: 'Brötchen / Weizenbrötchen · 1 Stück (55 g)',
    emoji: '🥖', grams: 55,
    macros: { kcal: 154, protein: 5.55, carbs: 29.68, fat: 1 },
    source: 'BLS · B511000 · 55-g-Beispielportion · Größe prüfen'
  },
  {
    id: 'reference-roll-wholegrain', name: 'Vollkornbrötchen / Weizenvollkornbrötchen · 1 Stück (55 g)',
    emoji: '🥖', grams: 55,
    macros: { kcal: 158.4, protein: 5.78, carbs: 26.95, fat: 1.79 },
    source: 'BLS · B411000 · 55-g-Beispielportion · Größe prüfen'
  }
];

// Read-only lookup data: never inserted into diary or favorites automatically.
export const FOOD_PRESETS = [...ROLL_FOODS, ...BASIC_FOODS, ...LIDL_FOODS];
