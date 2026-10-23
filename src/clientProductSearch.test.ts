import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchProductsForClient } from '../sites/kalorie-coach/lib/client-product-search';
import { FOOD_PRESETS } from '../sites/kalorie-coach/lib/food-presets';
import type { Food } from '../sites/kalorie-coach/lib/nutrition';

const personal: Food = { ...FOOD_PRESETS[0], id: 'personal-roll', name: 'Mein Testbrötchen', grams: 65, source: 'Eigene Angabe' };
afterEach(() => vi.useRealTimers());
describe('persönlicher Produkt-Fallback', () => {
  it('findet persönliche Lebensmittel auch nach erfolgreicher API ohne Treffer', async () => {
    const result = await searchProductsForClient('Testbrötchen', [personal], async () => ({ foods: [], source: 'none', degraded: false }));
    expect(result).toMatchObject({ source: 'local', foods: [personal] });
    result.foods[0].name = 'Changed';
    expect(personal.name).toBe('Mein Testbrötchen');
  });
  it('erhält die persönliche Portion vor einem gleichnamigen Server-Preset', async () => {
    const preset = { ...personal, id: 'preset-roll', grams: 100 };
    const result = await searchProductsForClient('Testbrötchen', [personal], async () => ({ foods: [preset], source: 'local', degraded: true }));
    expect(result.foods).toEqual([personal]);
  });
  it('behält echte Online-Produkte und deren Quellenangabe', async () => {
    const online = { foods: [personal], source: 'openfoodfacts' as const, degraded: false };
    expect(await searchProductsForClient('Testbrötchen', [], async () => online)).toBe(online);
  });
  it('beendet hängende API-Aufrufe und findet weiter lokale Daten', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const pending = searchProductsForClient('Testbrötchen', [personal], s => { signal = s; return new Promise(() => {}); }, 25);
    await vi.advanceTimersByTimeAsync(25);
    expect(await pending).toMatchObject({ source: 'local', foods: [personal] });
    expect(signal?.aborted).toBe(true);
  });
  it('ersetzt unbekannte Barcodes auch bei API-Ausfall nicht durch andere Produkte', async () => {
    expect(await searchProductsForClient('1234567890123', [personal], async () => { throw new Error('Offline'); })).toMatchObject({ source: 'none', foods: [] });
  });
});
