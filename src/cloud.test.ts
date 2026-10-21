import { describe, expect, it } from 'vitest';
import { checkedSnapshot, initialSnapshot, mergeSnapshots, resolveConflicts } from '../sites/kalorie-coach/lib/nutrition';
const entry = (id: string) => ({ ...initialSnapshot().favorites[0], entryId: id, date: '2026-10-21', time: '12:30' });
describe('shared device merge', () => {
  it('keeps independently added meals from both devices', () => {
    const base = initialSnapshot(), local = structuredClone(base), remote = structuredClone(base);
    local.entries.push(entry('phone')); remote.entries.push(entry('desktop'));
    const merged = mergeSnapshots(base, local, remote);
    expect(merged.conflicts).toEqual([]);
    expect(merged.snapshot.entries.map(e => e.entryId).sort()).toEqual(['desktop', 'phone']);
  });
  it('does not resurrect a deleted meal when another meal is added offline', () => {
    const base = initialSnapshot(); base.entries.push(entry('old'));
    const local = structuredClone(base), remote = structuredClone(base);
    local.entries = []; remote.entries.push(entry('new'));
    expect(mergeSnapshots(base, local, remote).snapshot.entries.map(e => e.entryId)).toEqual(['new']);
  });
  it('asks before resolving deletion against a changed portion', () => {
    const base = initialSnapshot(); base.entries.push(entry('old'));
    const local = structuredClone(base), remote = structuredClone(base); local.entries = []; remote.entries[0].grams = 500;
    const merged = mergeSnapshots(base, local, remote);
    expect(merged.conflicts).toHaveLength(1);
    expect(resolveConflicts(merged.snapshot, merged.conflicts, 'local').entries).toEqual([]);
    expect(resolveConflicts(merged.snapshot, merged.conflicts, 'remote').entries[0].grams).toBe(500);
  });
  it('preserves unrelated remote edits after conflict resolution and next sync', () => {
    const base = initialSnapshot(), local = structuredClone(base), remote = structuredClone(base);
    local.favorites[0].grams = 300; remote.favorites[0].grams = 500; remote.entries.push(entry('phone'));
    const merged = mergeSnapshots(base, local, remote);
    const choice = resolveConflicts(merged.snapshot, merged.conflicts, 'local');
    const next = mergeSnapshots(remote, choice, remote);
    expect(next.conflicts).toEqual([]);
    expect(next.snapshot.favorites[0].grams).toBe(300);
    expect(next.snapshot.entries[0].entryId).toBe('phone');
  });
  it('retains an in-flight local meal while accepting a completed server merge', () => {
    const starting = initialSnapshot(), current = structuredClone(starting), saved = structuredClone(starting);
    current.entries.push(entry('just-added')); saved.entries.push(entry('remote'));
    expect(mergeSnapshots(starting, current, saved).snapshot.entries).toHaveLength(2);
  });
  it('merges independent goal changes but detects conflicting values', () => {
    const base = initialSnapshot(), local = structuredClone(base), remote = structuredClone(base);
    local.goals.protein = 170; remote.goals.fat = 70;
    expect(mergeSnapshots(base, local, remote).snapshot.goals).toMatchObject({ protein: 170, fat: 70 });
    remote.goals.protein = 180;
    expect(mergeSnapshots(base, local, remote).conflicts[0]).toMatchObject({ collection: 'goals', id: 'protein' });
  });
  it('rejects impossible dates, duplicate IDs, and non-finite nutrients', () => {
    const invalid = initialSnapshot(); invalid.entries.push({ ...entry('bad'), date: '2026-02-30' });
    expect(() => checkedSnapshot(invalid)).toThrow();
    const duplicate = initialSnapshot(); duplicate.entries.push(entry('same'), entry('same'));
    expect(() => checkedSnapshot(duplicate)).toThrow();
    const badMacro = initialSnapshot(); badMacro.goals.kcal = NaN;
    expect(() => checkedSnapshot(badMacro)).toThrow();
  });
});
