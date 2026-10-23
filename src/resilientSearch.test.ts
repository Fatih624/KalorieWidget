import { describe, expect, it, vi } from 'vitest';
import { createResilientSearch, searchUsda } from '../sites/kalorie-coach/lib/search-fallback';
import { localProductMatches } from '../sites/kalorie-coach/lib/local-product-matches';
import { FOOD_PRESETS } from '../sites/kalorie-coach/lib/food-presets';
import { ProductSearchError } from '../sites/kalorie-coach/lib/product-search';

const unavailable = async () => { throw new ProductSearchError(503, 'PRODUCT_DATABASE_UNAVAILABLE', 'Offline'); };
const usdaProduct = {
  fdcId: 987654, description: 'WHITE ROLL', foodNutrients: [
    { nutrientId: 1008, value: 280 }, { nutrientId: 1003, value: 10 },
    { nutrientId: 1005, value: 54 }, { nutrientId: 1004, value: 1.8 }
  ]
};

describe('stufenweiser Produkt-Fallback', () => {
  it('lässt einen gültigen Open Food Facts Treffer unverändert', async () => {
    const food = FOOD_PRESETS[0];
    const search = createResilientSearch({ primary: async () => [food] });
    expect(await search('Brötchen')).toMatchObject({ source: 'openfoodfacts', degraded: false, foods: [food] });
  });

  it('zeigt bei einem HTTP-503 trotzdem Standardlebensmittel an', async () => {
    const search = createResilientSearch({ primary: unavailable });
    const result = await search('Brötchen');
    expect(result).toMatchObject({ source: 'local', degraded: true });
    expect(result.foods.some(food => food.name.includes('Weizenbrötchen'))).toBe(true);
    expect(result.notice).toContain('Richtwert');
  });

  it('wählt für Barcodes offline ausschließlich exakt passende Produkte', async () => {
    const search = createResilientSearch({ primary: unavailable });
    expect((await search('4056489035381')).foods.map(f => f.id)).toContain('lidl-4056489035381');
    expect((await search('4056489035382')).foods).toHaveLength(0);
    expect(localProductMatches('4056489035382', FOOD_PRESETS)).toEqual([]);
  });

  it('aktiviert USDA nur bei einem serverseitigen Schlüssel und echten Textsuchen', async () => {
    const mock = vi.fn(async () => Response.json({ foods: [usdaProduct] }));
    const search = createResilientSearch({ primary: unavailable, usdaApiKey: 'test-secret', fetch: mock });
    const result = await search('bread roll');
    expect(result).toMatchObject({ source: 'usda', degraded: true });
    expect(result.foods[0]).toMatchObject({
      id: 'usda-987654', grams: 100, macros: { kcal: 280, protein: 10, carbs: 54, fat: 1.8 }
    });
    const url = new URL(String(mock.mock.calls[0][0]));
    expect(url.hostname).toBe('api.nal.usda.gov');
    expect(url.searchParams.get('api_key')).toBe('test-secret');
    expect(mock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(await searchUsda('1234567890123', 'test-secret', mock)).toEqual([]);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('fällt bei einer gestörten USDA API weiter auf die lokalen Werte zurück', async () => {
    const mock = vi.fn(async () => new Response('', { status: 503 }));
    const search = createResilientSearch({ primary: unavailable, usdaApiKey: 'test-secret', fetch: mock });
    expect((await search('Brötchen')).source).toBe('local');
  });

  it('liefert bei kompletten Ausfällen keine irreführenden erfundenen Lebensmittel', async () => {
    const search = createResilientSearch({ primary: unavailable, localFoods: [] });
    const result = await search('unbekanntesessen123');
    expect(result).toMatchObject({ source: 'none', degraded: true, foods: [] });
    expect(result.notice).toContain('manuell');
  });

  it('blockiert ungültige Suchbegriffe bevor externe APIs aufgerufen werden', async () => {
    const primary = vi.fn(async () => []);
    const search = createResilientSearch({ primary });
    await expect(search('x')).rejects.toMatchObject({ status: 400 });
    await expect(search('x'.repeat(121))).rejects.toMatchObject({ status: 400 });
    expect(primary).not.toHaveBeenCalled();
  });

  it('gibt gecachte Treffer nicht als veränderbare Referenzen zurück', async () => {
    const primary = vi.fn(async () => [FOOD_PRESETS[0]]);
    const search = createResilientSearch({ primary });
    (await search('Brötchen')).foods[0].name = 'Changed';
    expect((await search('Brötchen')).foods[0].name).not.toBe('Changed');
    expect(primary).toHaveBeenCalledTimes(1);
  });
});
