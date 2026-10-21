// Shared by mobile and desktop; intentionally independent of browser and server APIs.
export type Macros = { kcal: number; protein: number; carbs: number; fat: number };
export type Food = { id: string; name: string; emoji: string; grams: number; macros: Macros; source: string };
export type Entry = Food & { entryId: string; date: string; time: string };
export type Snapshot = { favorites: Food[]; entries: Entry[]; goals: Macros };
export type CloudDocument = { revision: number; snapshot: Snapshot };
export const initialSnapshot = (): Snapshot => ({ goals: { kcal: 2200, protein: 150, carbs: 250, fat: 67 }, entries: [], favorites: [
  { id: 'skyr', name: 'Skyr natur', emoji: '🥣', grams: 250, macros: { kcal: 158, protein: 27.5, carbs: 10, fat: .5 }, source: 'Standard · Richtwert' },
  { id: 'oats', name: 'Haferflocken', emoji: '🌾', grams: 60, macros: { kcal: 223, protein: 8.1, carbs: 35.2, fat: 4.2 }, source: 'Standard · Richtwert' },
  { id: 'banana', name: 'Banane', emoji: '🍌', grams: 120, macros: { kcal: 107, protein: 1.3, carbs: 24, fat: .4 }, source: 'Standard · Richtwert' }
] });
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fmt = (n: number, digits = 0) => n.toLocaleString('de-DE', { maximumFractionDigits: digits });
export function total(entries: { macros: Macros }[]): Macros { return entries.reduce((a, e) => ({ kcal: a.kcal + e.macros.kcal, protein: a.protein + e.macros.protein, carbs: a.carbs + e.macros.carbs, fat: a.fat + e.macros.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }); }
export function resizeFood(f: Food, grams: number): Food { if (!Number.isFinite(grams) || grams <= 0 || grams > 10000 || f.grams <= 0) throw new Error('Ungültige Portion.'); const m = grams / f.grams; return { ...f, grams, macros: { kcal: f.macros.kcal * m, protein: f.macros.protein * m, carbs: f.macros.carbs * m, fat: f.macros.fat * m } }; }
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
export function checkedMacros(v: unknown, goal = false): Macros { if (!record(v)) throw new Error('Nährwerte fehlen.'); const result = {} as Macros; for (const k of ['kcal', 'protein', 'carbs', 'fat'] as const) { const n = v[k]; if (typeof n !== 'number' || !Number.isFinite(n) || n < (goal ? 1 : 0) || n > (k === 'kcal' ? 50000 : 10000)) throw new Error('Ungültige Nährwerte.'); result[k] = n; } return result; }
export function checkedFood(v: unknown): Food { if (!record(v) || typeof v.id !== 'string' || !v.id || v.id.length > 200 || typeof v.name !== 'string' || !v.name.trim() || v.name.length > 160 || typeof v.grams !== 'number' || !Number.isFinite(v.grams) || v.grams <= 0 || v.grams > 10000 || typeof v.source !== 'string' || v.source.length > 300 || typeof v.emoji !== 'string' || v.emoji.length > 16) throw new Error('Ungültiges Lebensmittel.'); return { id: v.id, name: v.name.trim(), grams: v.grams, source: v.source, emoji: v.emoji, macros: checkedMacros(v.macros) }; }
export function checkedSnapshot(v: unknown): Snapshot {
  if (!record(v) || !Array.isArray(v.favorites) || v.favorites.length > 5000 || !Array.isArray(v.entries) || v.entries.length > 50000) throw new Error('Ungültiges Tagebuch.');
  const favorites = v.favorites.map(checkedFood);
  const entries = v.entries.map(e => { const f = checkedFood(e); if (!record(e) || typeof e.entryId !== 'string' || !e.entryId || e.entryId.length > 100 || typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || localDay(new Date(e.date + 'T12:00:00')) !== e.date || typeof e.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)) throw new Error('Ungültiger Tagebucheintrag.'); return { ...f, entryId: e.entryId, date: e.date, time: e.time }; });
  if (new Set(favorites.map(f => f.id)).size !== favorites.length || new Set(entries.map(e => e.entryId)).size !== entries.length) throw new Error('Doppelte Einträge in den Daten.');
  return { favorites, entries, goals: checkedMacros(v.goals, true) };
}
export function canonical(v: unknown): string { if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; if (record(v)) return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}'; return JSON.stringify(v) ?? 'undefined'; }
export type Conflict = { collection: 'favorites' | 'entries' | 'goals'; id: string; label: string; local: Food | Entry | number | null; remote: Food | Entry | number | null };
export function mergeSnapshots(base: Snapshot, local: Snapshot, remote: Snapshot): { snapshot: Snapshot; conflicts: Conflict[] } {
  const conflicts: Conflict[] = [];
  const resolve = (b: unknown, l: unknown, r: unknown) => canonical(l) === canonical(b) ? r : canonical(r) === canonical(b) || canonical(l) === canonical(r) ? l : undefined;
  function mergeList<T extends Food>(collection: 'favorites' | 'entries', b: T[], l: T[], r: T[], key: (v: T) => string): T[] {
    const bm = new Map(b.map(x => [key(x), x])), lm = new Map(l.map(x => [key(x), x])), rm = new Map(r.map(x => [key(x), x])); const result: T[] = [];
    for (const id of new Set([...bm.keys(), ...lm.keys(), ...rm.keys()])) { const bv = bm.get(id) ?? null, lv = lm.get(id) ?? null, rv = rm.get(id) ?? null; const v = resolve(bv, lv, rv); if (v === undefined) { conflicts.push({ collection, id, label: lv?.name || rv?.name || id, local: lv, remote: rv }); if (rv) result.push(rv); } else if (v !== null) result.push(v as T); } return result;
  }
  const goals = { ...remote.goals }; for (const id of ['kcal', 'protein', 'carbs', 'fat'] as const) { const value = resolve(base.goals[id], local.goals[id], remote.goals[id]); if (value === undefined) conflicts.push({ collection: 'goals', id, label: `Tagesziel ${id}`, local: local.goals[id], remote: remote.goals[id] }); else goals[id] = value as number; }
  return { snapshot: { favorites: mergeList('favorites', base.favorites, local.favorites, remote.favorites, f => f.id), entries: mergeList('entries', base.entries, local.entries, remote.entries, e => e.entryId), goals }, conflicts };
}
export function resolveConflicts(snapshot: Snapshot, conflicts: Conflict[], choice: 'local' | 'remote'): Snapshot { const result = structuredClone(snapshot); for (const c of conflicts) { const v = c[choice]; if (c.collection === 'goals') result.goals[c.id as keyof Macros] = v as number; else if (c.collection === 'entries') { result.entries = result.entries.filter(e => e.entryId !== c.id); if (v) result.entries.push(v as Entry); } else { result.favorites = result.favorites.filter(f => f.id !== c.id); if (v) result.favorites.push(v as Food); } } return result; }
