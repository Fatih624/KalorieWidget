import { makeEntry, type AppData, type Entry } from './domain';

/** A repeat is a new meal at the selected day, with the original serving. */
export function duplicateEntries(entries: readonly Entry[], day: string): Entry[] {
  return entries.map(({ id, name, emoji, grams, macros, source }) =>
    makeEntry({ id, name, emoji, grams, macros, source }, day));
}

/** Undo only this operation; preserve meals added in the meantime. */
export function undoAddedEntries(data: AppData, addedIds: ReadonlySet<string>): AppData {
  const entries = data.entries.filter(entry => !addedIds.has(entry.entryId));
  return entries.length === data.entries.length ? data : { ...data, entries };
}
