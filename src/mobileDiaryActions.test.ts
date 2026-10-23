import { describe, expect, it } from 'vitest';
import { reconcileMobileSnapshot, repeatDiaryFoods, undoDiaryCopies } from '../sites/kalorie-coach/lib/mobile-diary-actions';
import { checkedSnapshot, initialSnapshot } from '../sites/kalorie-coach/lib/nutrition';
import type { Entry, Food } from '../sites/kalorie-coach/lib/nutrition';

const food:Food={id:'food',name:'Portion',emoji:'🍽️',grams:37.5,macros:{kcal:123.456,protein:4.321,carbs:2.6,fat:7.8},source:'Test'};
const original:Entry={...food,entryId:'original',date:'2026-10-01',time:'08:00'};
const now=new Date(2026,9,23,17,42);
describe('mobile diary repetition',()=>{
  it('copies all exact portions to the selected day with fresh IDs and current time',()=>{
    let id=0;const data={entries:[original],other:'preserved'};
    const result=repeatDiaryFoods(data,[original,{...food,grams:75}], '2026-10-20',now,()=>`copy-${++id}`);
    expect(result.snapshot.entries).toHaveLength(3);
    expect(result.snapshot.entries.slice(1).map(e=>[e.entryId,e.date,e.time,e.grams])).toEqual([['copy-1','2026-10-20','17:42',37.5],['copy-2','2026-10-20','17:42',75]]);
    expect(result.snapshot.entries[1].macros).toEqual(food.macros);
    expect(result.snapshot.entries[1].macros).not.toBe(food.macros);
    expect(result.snapshot.other).toBe('preserved');expect(data.entries).toEqual([original]);
  });
  it('undo keeps originals and additions or edits made after the repeat',()=>{
    const result=repeatDiaryFoods({entries:[original]},[original],'2026-10-23',now,()=> 'copy');
    const later:Entry={...original,entryId:'later',name:'Später'};
    const current={entries:[{...original,name:'Bearbeitet'},...result.snapshot.entries.slice(1),later]};
    expect(undoDiaryCopies(current,result.addedIds).entries).toEqual([current.entries[0],later]);
    expect(undoDiaryCopies(undoDiaryCopies(current,result.addedIds),result.addedIds).entries).toHaveLength(2);
  });
  it('rejects empty, invalid, over-limit and duplicate-ID operations atomically',()=>{
    expect(()=>repeatDiaryFoods({entries:[]},[],'2026-10-23')).toThrow();
    expect(()=>repeatDiaryFoods({entries:[]},[food],'2026-02-30')).toThrow();
    expect(()=>repeatDiaryFoods({entries:[]},[{...food,grams:0}],'2026-10-23')).toThrow();
    expect(()=>repeatDiaryFoods({entries:[original]},[food],'2026-10-23',now,()=>original.entryId)).toThrow();
    expect(()=>repeatDiaryFoods({entries:[]},[food,food],'2026-10-23',now,()=> 'same')).toThrow();
    const full={entries:Array.from({length:50000},()=>original)};
    expect(()=>repeatDiaryFoods(full,[food],'2026-10-23')).toThrow(/50.000/);
    expect(full.entries).toHaveLength(50000);
    expect(repeatDiaryFoods({entries:Array.from({length:49999},()=>original)},[food],'2026-10-23',now,()=> 'last').snapshot.entries).toHaveLength(50000);
  });
  it('retains local learning across remote changes and excludes remotely removed favorites',()=>{
    const entries=['2026-10-21','2026-10-22','2026-10-23'].map(date=>({...original,date,entryId:date}));
    const previous={...initialSnapshot(),entries,favorites:[food],favoriteLearning:{automatic:[food.id],dismissed:['anderes essen']}};
    const remote={...initialSnapshot(),entries,favorites:[],goals:{...initialSnapshot().goals,kcal:2000}};
    const reconciled=reconcileMobileSnapshot(previous,remote,'2026-10-23');
    expect(reconciled.favorites).toEqual([]);
    expect(reconciled.favoriteLearning).toEqual({automatic:[],dismissed:['anderes essen','portion']});
    expect(reconciled.goals.kcal).toBe(2000);
    expect(reconcileMobileSnapshot(reconciled,remote,'2026-10-23').favorites).toEqual([]);
    expect(checkedSnapshot(reconciled)).not.toHaveProperty('favoriteLearning');
  });
  it('preserves automatic markers on unrelated sync updates',()=>{
    const previous={...initialSnapshot(),favorites:[food],favoriteLearning:{automatic:[food.id],dismissed:['entfernt']}};
    const remote={...checkedSnapshot(previous),mealTemplates:[{id:'meal',name:'Meal',foods:[food]}]};
    expect(reconcileMobileSnapshot(previous,remote,'2026-10-23').favoriteLearning).toEqual(previous.favoriteLearning);
  });
});
