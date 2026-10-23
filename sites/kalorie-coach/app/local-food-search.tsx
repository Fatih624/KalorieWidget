'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { findLocal, findMealPart, splitMealQuery } from '../lib/local-food-search';
import { checkedFood, checkedMealTemplate, fmt, resizeFood, total } from '../lib/nutrition';
import type { Food, MealTemplate } from '../lib/nutrition';

export default function LocalFoodSearch({ favorites, onSelect, onAdd, onSaveTemplate }: {
  favorites: Food[]; onSelect: (food: Food) => void; onAdd: (foods: Food[]) => void; onSaveTemplate: (template: MealTemplate) => void;
}) {
  const [query, setQuery] = useState(''), [open, setOpen] = useState(false), [active, setActive] = useState(0);
  const [review, setReview] = useState(false), [pinned, setPinned] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setPinned(entry.boundingClientRect.top < 8 && entry.intersectionRatio < 1),
      { threshold: [0, 1], rootMargin: '-8px 0px 0px 0px' });
    if (slot.current) observer.observe(slot.current);
    return () => observer.disconnect();
  }, []);
  const parts = splitMealQuery(query, favorites);
  let matches: Food[] = [];
  let error = '';
  try { matches = parts.length > 1 ? [] : findLocal(query, favorites).slice(0, 6); }
  catch (e) { error = e instanceof Error ? e.message : 'Bitte die Menge prüfen.'; }
  function choose(food: Food) { setOpen(false); onSelect(food); }
  function submit() {
    if (parts.length > 1) { setOpen(false); setReview(true); }
    else if (matches[active]) choose(matches[active]);
  }
  return <><div className="mobile-search-slot" ref={slot}>
    <div className={`mobile-local-search ${pinned ? 'is-pinned' : ''}`} onBlur={e => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
    }}>
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <Search size={18} aria-hidden="true"/>
        <input aria-label="Schnellsuche in Favoriten und bisherigen Einträgen" role="combobox" aria-autocomplete="list"
          aria-expanded={open} aria-controls={open ? 'mobile-local-results' : undefined}
          aria-activedescendant={open && (parts.length > 1 || matches[active]) ? `mobile-local-option-${parts.length > 1 ? 0 : active}` : undefined}
          placeholder="Schnellsuche, z. B. Burger" maxLength={1600} value={query}
          onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
            else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && matches.length) {
              e.preventDefault(); setOpen(true);
              const index = (active + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
              setActive(index); document.getElementById(`mobile-local-option-${index}`)?.scrollIntoView({ block: 'nearest' });
            }
          }}/>
        <button className="icon" type="submit" aria-label="Vorlage auswählen" disabled={parts.length < 2 && !matches.length}><Plus size={20}/></button>
      </form>
      {open && <div className="mobile-local-results" id="mobile-local-results" role="listbox" aria-label="Favoriten und bisherige Lebensmittel">
        {parts.length > 1 ? <button type="button" role="option" aria-selected="true" id="mobile-local-option-0"
          onMouseDown={e => e.preventDefault()} onClick={submit}><strong>{parts.length} Lebensmittel gemeinsam prüfen</strong><small>Mengen und Gesamtnährwerte ansehen</small></button>
          : matches.map((food, index) => <button type="button" role="option" key={`${food.id}-${index}`}
            id={`mobile-local-option-${index}`} aria-selected={index === active} onMouseDown={e => e.preventDefault()}
            onMouseEnter={() => setActive(index)} onClick={() => choose(food)}>
            <strong>{food.name}</strong><small>{fmt(food.grams)} g · {fmt(food.macros.kcal)} kcal</small>
          </button>)}
        {parts.length < 2 && !matches.length && <p>{error || 'Noch kein passender Eintrag. Bitte die Beschreibung prüfen oder „Erfassen“ verwenden.'}</p>}
      </div>}
    </div>
  </div>
  {review && <LocalMealReview query={query} favorites={favorites} onClose={() => setReview(false)}
    onAdd={foods => { onAdd(foods); setReview(false); setQuery(''); }} onSaveTemplate={template => { onSaveTemplate(template); setReview(false); setQuery(''); }}/>}</>;
}

export function LocalMealReview({ query, favorites, onClose, onAdd, onSaveTemplate, template }: {
  query: string; favorites: Food[]; onClose: () => void; onAdd: (foods: Food[]) => void; onSaveTemplate: (template: MealTemplate) => void; template?: MealTemplate;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const parts = splitMealQuery(query, favorites);
  const [name, setName] = useState(template?.name ?? ''), [saveError, setSaveError] = useState('');
  const [rows, setRows] = useState(() => template ? template.foods.map(food => ({ query: food.name, options: [food], selected: 0, grams: String(food.grams), error: '' })) : parts.length > 20 ? [] : (parts.length ? parts : ['']).map(text => {
    const part = findMealPart(text, favorites);
    return { ...part, selected: part.options.length === 1 ? 0 : -1, grams: part.options.length === 1 ? String(part.options[0].grams) : '' };
  }));
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  const foods = rows.map(row => {
    if (row.selected < 0) return undefined;
    try {
      const food = resizeFood(row.options[row.selected], Number(row.grams.replace(',', '.')));
      if (food.grams !== row.options[row.selected].grams) food.name = `${food.name.replace(/\s*·\s*\d.*$/, '').slice(0, 130)} · ${fmt(food.grams, 2)} g`;
      return checkedFood(food);
    } catch { return undefined; }
  });
  const selected = foods.filter((food): food is Food => !!food);
  const complete = rows.length > 0 && selected.length === rows.length;
  const sum = total(selected);
  return <dialog ref={dialog} className="sheet mobile-meal-review" aria-label="Mahlzeit prüfen" onCancel={e => { e.preventDefault(); onClose(); }}>
    <header><div><p className="eyebrow">LOKAL AUS DEINEN VORLAGEN</p><h2>Mahlzeit prüfen</h2></div><button className="icon" onClick={onClose} aria-label="Mahlzeitenprüfung schließen"><X size={19}/></button></header>
    <form className="form-stack" onSubmit={e => { e.preventDefault(); if (complete) onAdd(selected); }}>
      {parts.length > 20 && <p className="error">Bitte höchstens 20 Lebensmittel auf einmal eingeben.</p>}
      {rows.map((row, index) => <section className="review-food" key={index}>
        <div className="card-top"><strong>Lebensmittel {index + 1}</strong><button type="button" className="icon" aria-label={`Lebensmittel ${index + 1} entfernen`} onClick={() => setRows(current => current.filter((_, i) => i !== index))}><X size={17}/></button></div>
        <label>Beschreibung<input aria-label={`Beschreibung Lebensmittel ${index + 1}`} value={row.query} maxLength={160}
          onChange={e => { const part = findMealPart(e.target.value, favorites); setRows(current => current.map((item, i) => i === index ? { ...part, selected: part.options.length === 1 ? 0 : -1, grams: part.options.length === 1 ? String(part.options[0].grams) : '' } : item)); }}/></label>
        {row.error && <p className="error">{row.error}</p>}
        {!!row.options.length && <label>Passende Vorlage<select aria-label={`Vorlage Lebensmittel ${index + 1}`} value={row.selected} required
          onChange={e => { const selected = Number(e.target.value); setRows(current => current.map((item, i) => i === index ? { ...item, selected, grams: selected < 0 ? '' : String(item.options[selected].grams) } : item)); }}>
          <option value={-1}>Bitte Vorlage wählen</option>{row.options.map((food, i) => <option key={`${food.id}-${i}`} value={i}>{food.name} · {fmt(food.grams)} g · {fmt(food.macros.kcal)} kcal</option>)}
        </select></label>}
        {row.selected >= 0 && <label>Menge in Gramm<input aria-label={`Gramm Lebensmittel ${index + 1}`} type="number" min="1" max="10000" step="any" required value={row.grams}
          onChange={e => setRows(current => current.map((item, i) => i === index ? { ...item, grams: e.target.value } : item))}/></label>}
        {foods[index] && <small>{fmt(foods[index]!.macros.kcal)} kcal · P {fmt(foods[index]!.macros.protein, 1)} g · KH {fmt(foods[index]!.macros.carbs, 1)} g · F {fmt(foods[index]!.macros.fat, 1)} g</small>}
      </section>)}
      <button className="secondary wide" type="button" disabled={rows.length >= 20} onClick={() => setRows(current => [...current, { query: '', options: [], selected: -1, grams: '', error: '' }])}><Plus size={17}/>Lebensmittel ergänzen</button>
      <section className="notice" aria-live="polite"><strong>{complete ? 'Gesamte Mahlzeit' : 'Zwischensumme'}</strong><p>{fmt(sum.kcal)} kcal · Protein {fmt(sum.protein, 1)} g · Kohlenhydrate {fmt(sum.carbs, 1)} g · Fett {fmt(sum.fat, 1)} g</p></section>
      {!complete && <p className="muted small">Bitte alle Lebensmittel und Mengen prüfen und passende Vorlagen wählen.</p>}
      <button className="primary wide" disabled={!complete}>Lebensmittel gemeinsam eintragen</button>
      <section className="settings-section"><h3>{template ? 'Mahlzeitenvorlage bearbeiten' : 'Als Mahlzeitenvorlage speichern'}</h3>
        <label>Name der Mahlzeit<input aria-label="Name der Mahlzeitenvorlage" maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="z. B. Mein Frühstück"/></label>
        <p className="muted small">Speichert die ausgewählten Lebensmittel und Mengen für Handy und Widget.</p>
        <button className="secondary wide" type="button" disabled={!complete || !name.trim()} onClick={() => { try { onSaveTemplate(checkedMealTemplate({ id: template?.id ?? crypto.randomUUID(), name, foods: selected })); } catch (e) { setSaveError(e instanceof Error ? e.message : String(e)); } }}>{template ? 'Änderungen an Vorlage speichern' : 'Nur als Vorlage speichern'}</button>
        {saveError && <p className="error" role="alert">{saveError}</p>}
      </section>
    </form>
  </dialog>;
}
