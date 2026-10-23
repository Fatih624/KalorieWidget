import assert from 'node:assert/strict';
import { checkedEstimateDetails, estimateDescription } from '../lib/estimate-details.ts';
import { searchableFoods } from '../lib/recent-foods.ts';

assert.deepEqual(checkedEstimateDetails({}), { comment: '' });
assert.deepEqual(checkedEstimateDetails({ count: 2, comment: ' vegane Patties ' }), { count: 2, comment: 'vegane Patties' });
for (const count of [0, -1, 0.001, 101, NaN, Infinity, '2', null]) {
  assert.throws(() => checkedEstimateDetails({ count }));
}
for (const count of [0.01, 0.5, 2, 100]) assert.equal(checkedEstimateDetails({ count }).count, count);
assert.throws(() => checkedEstimateDetails({ comment: 'x'.repeat(601) }));
assert.throws(() => checkedEstimateDetails({ comment: 2 }));
// Counts/comments are separate data; existing description counts are never multiplied in code.
assert.deepEqual(JSON.parse(estimateDescription('2 Burger', checkedEstimateDetails({ count: 2, comment: 'vegan' }))),
  { description: '2 Burger', totalCount: 2, additionalComment: 'vegan' });
assert.notEqual(estimateDescription('Burger', { count: 1, comment: '' }), estimateDescription('Burger', { count: 2, comment: '' }));
assert.notEqual(estimateDescription('Burger', { count: 2, comment: '' }), estimateDescription('Burger', { count: 2, comment: 'vegan' }));

const food = (id, name, grams = 100) => ({ id, name, grams, emoji: '🍽️', source: 'Manuell', macros: { kcal: grams, protein: 1, carbs: 1, fat: 1 } });
const entry = (id, name, date, time, grams) => ({ ...food(id, name, grams), entryId: id, date, time });
const favorites = [food('fav', 'Banane', 120)];
const history = [
  entry('old', 'Burger', '2026-10-22', '12:00', 150),
  entry('today', '  BURGER  ', '2026-10-23', '10:00', 300),
  entry('photo', 'Salat', '2026-10-23', '09:00', 200),
  entry('banana', 'banane', '2026-10-23', '11:00', 90),
  entry('tie', 'Burger', '2026-10-23', '10:00', 350),
];
const before = JSON.stringify({ favorites, history });
const results = searchableFoods(favorites, history);
assert.deepEqual(results.map(f => f.id), ['fav', 'tie', 'photo']);
assert.equal(results[1].grams, 350);
assert.equal(JSON.stringify({ favorites, history }), before);
assert.deepEqual(searchableFoods([], []), []);
console.log('Anzahl, Kommentar, Cache-Abgrenzung und Schnellsuche-Historie geprüft.');
