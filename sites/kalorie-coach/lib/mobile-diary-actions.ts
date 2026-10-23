import { checkedFood, localDay } from './nutrition';
import type { Entry, Food } from './nutrition';
import type { Snapshot } from './nutrition';
import { promoteFrequentFoods, withSyncedFavorites } from './favorite-learning';
import type { FavoriteLearning } from './favorite-learning';

export type LocalDiarySnapshot=Snapshot & {favoriteLearning?:FavoriteLearning};

/** Remote snapshots omit local learning preferences; retain them and learn removals. */
export function reconcileMobileSnapshot(previous:LocalDiarySnapshot|null,next:LocalDiarySnapshot,day:string):LocalDiarySnapshot {
  const value=previous?withSyncedFavorites({...next,favorites:previous.favorites,favoriteLearning:next.favoriteLearning??previous.favoriteLearning},next.favorites):next;
  return promoteFrequentFoods(value,day);
}

/** Copies exact portions to the displayed day; never reuses diary identities. */
export function repeatDiaryFoods<T extends { entries: Entry[] }>(data:T, foods:Food[], day:string, now=new Date(), makeId:()=>string=()=>crypto.randomUUID()):{snapshot:T;addedIds:string[]} {
  if (!foods.length) throw new Error('Es gibt keine Einträge zum Hinzufügen.');
  if (data.entries.length + foods.length > 50000) throw new Error('Dein Tagebuch hat die Grenze von 50.000 Einträgen erreicht. Bitte exportiere und bereinige es zuerst.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || localDay(new Date(day+'T12:00:00')) !== day || !Number.isFinite(now.getTime())) throw new Error('Ungültiger Tagebuchtag.');
  const used=new Set(data.entries.map(e=>e.entryId));
  const time=now.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  const entries=foods.map(food=>{
    const value=checkedFood(food),entryId=makeId();
    if(!entryId || entryId.length>100 || used.has(entryId)) throw new Error('Einträge konnten nicht eindeutig kopiert werden. Bitte erneut versuchen.');
    used.add(entryId);
    return {...value,macros:{...value.macros},entryId,date:day,time};
  });
  return {snapshot:{...data,entries:[...data.entries,...entries]},addedIds:entries.map(e=>e.entryId)};
}

/** Removes only this operation's copies, preserving all intervening changes. */
export function undoDiaryCopies<T extends { entries: Entry[] }>(data:T,addedIds:readonly string[]):T {
  const ids=new Set(addedIds);
  return {...data,entries:data.entries.filter(e=>!ids.has(e.entryId))};
}
