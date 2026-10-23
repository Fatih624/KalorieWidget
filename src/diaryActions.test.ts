import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaults, makeEntry, sum } from './domain';
import { duplicateEntries, undoAddedEntries } from './diaryActions';

afterEach(() => vi.useRealTimers());
describe('Einträge wiederholen', () => {
  it('behält Portion und Nährwerte, verwendet neue IDs, ausgewählten Tag und aktuelle Uhrzeit', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 23, 13, 45));
    const original = { ...makeEntry(defaults().favorites[0], '2026-10-20'), time: '09:00' };
    const [copy] = duplicateEntries([original], '2026-10-22');
    expect(copy.entryId).not.toBe(original.entryId);
    expect(copy.date).toBe('2026-10-22');
    expect(copy.time).toBe('13:45');
    expect(copy.grams).toBe(original.grams);
    expect(copy.macros).toEqual(original.macros);
    expect(copy.macros).not.toBe(original.macros);
    expect(original.date).toBe('2026-10-20');
    expect(original.time).toBe('09:00');
  });
  it('kopiert die ganze Liste genau einmal und verdoppelt ihre Summen', () => {
    const originals = defaults().favorites.map(food => makeEntry(food));
    const copies = duplicateEntries(originals, '2026-10-23');
    expect(copies).toHaveLength(originals.length);
    expect(new Set([...originals, ...copies].map(e => e.entryId)).size).toBe(originals.length * 2);
    const doubled = sum([...originals, ...copies]);
    const before = sum(originals);
    for (const key of ['kcal', 'protein', 'carbs', 'fat'] as const) expect(doubled[key]).toBeCloseTo(before[key] * 2);
  });
  it('macht die Wiederholung rückgängig und erhält spätere andere Einträge', () => {
    const data = defaults();
    const original = makeEntry(data.favorites[0]);
    const copies = duplicateEntries([original], original.date);
    const later = makeEntry(data.favorites[1]);
    const restored = undoAddedEntries({...data, entries:[original, ...copies, later]}, new Set(copies.map(e => e.entryId)));
    expect(restored.entries).toEqual([original, later]);
    expect(undoAddedEntries(restored, new Set(copies.map(e => e.entryId)))).toBe(restored);
  });
});
