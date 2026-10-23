import { describe, expect, it } from 'vitest';
import { FOOD_PRESETS } from '../sites/kalorie-coach/lib/food-presets';
import { BASIC_FOODS } from '../sites/kalorie-coach/lib/basic-foods';
import { LIDL_FOODS } from '../sites/kalorie-coach/lib/lidl-foods';
import { checkedFood } from '../sites/kalorie-coach/lib/nutrition';
import { findLocal as mobileSearch } from '../sites/kalorie-coach/lib/local-food-search';
import { searchableFoods } from '../sites/kalorie-coach/lib/recent-foods';
import { defaults, findLocal, makeEntry, portion } from './domain';
import { quickSearchFoods } from './quickSearch';

describe('Gemeinsame Lebensmittelvorlagen', () => {
  it('enthält vollständige, eindeutig identifizierte Grundnahrungsmittel und Lidl-Produkte', () => {
    expect(BASIC_FOODS.length).toBeGreaterThanOrEqual(60);
    expect(LIDL_FOODS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(FOOD_PRESETS.map(f=>f.id)).size).toBe(FOOD_PRESETS.length);
    for (const food of FOOD_PRESETS) expect(checkedFood(food)).toEqual(food);
    for (const food of LIDL_FOODS) {
      expect(food.name).toMatch(/^Lidl · /);
      expect(food.source).toContain(food.id.slice(5));
    }
  });

  it('findet dieselben Vorlagen und Portionswerte in beiden Apps', () => {
    const desktop = quickSearchFoods([], []);
    const mobile = searchableFoods([], [], FOOD_PRESETS);
    expect(desktop).toEqual(mobile);
    for (const query of ['2 Eier', '200 g Reis gekocht', '150 g Nudeln trocken', 'Hähnchen', 'Brokkoli', 'Lidl Skyr', 'Lidl Haferflocken']) {
      const results = findLocal(query, desktop);
      expect(results.length, query).toBeGreaterThan(0);
      expect(results).toEqual(mobileSearch(query, mobile));
    }
    const oneEgg = findLocal('Eier gekocht', desktop)[0];
    const twoEggs = findLocal('2 Eier gekocht', desktop)[0];
    expect(twoEggs.grams).toBe(oneEgg.grams*2);
    expect(twoEggs.macros.kcal).toBeCloseTo(oneEgg.macros.kcal*2);
    expect(findLocal('200 g Reis gekocht', desktop)[0].grams).toBe(200);
  });

  it('trennt trockenen und gekochten Reis und Nudeln', () => {
    const byId = (id:string)=>BASIC_FOODS.find(f=>f.id===id)!;
    for(const type of ['rice','pasta']) {
      expect(byId(`basic-${type}-dry`).macros.kcal).toBeGreaterThan(byId(`basic-${type}-cooked`).macros.kcal*1.5);
    }
  });

  it('bevorzugt eigene Portionen und verändert weder Tagebuch noch Favoriten', () => {
    const preset=LIDL_FOODS[0];
    const favorite=portion(preset,200);
    const history=makeEntry({...portion(preset,150),name:preset.name+' · 150 g'});
    const before=JSON.stringify({favorite,history,presets:FOOD_PRESETS});
    const results=quickSearchFoods([favorite],[history]);
    expect(results.filter(f=>f.id===preset.id)).toEqual([favorite]);
    expect(JSON.stringify({favorite,history,presets:FOOD_PRESETS})).toBe(before);
    expect(defaults().favorites.some(f=>f.id.startsWith('lidl-'))).toBe(false);
  });
});
