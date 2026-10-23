import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { dragWindow, loadData, restoreWindow } from './bridge';
import { number, sum, today } from './domain';
import type { Macros } from './domain';
export type BadgeState = { total: Macros; goals: Macros; open: boolean; reducedMotion: boolean };
const compactGrams = (v:number) => v>=1000 ? `${number(v/1000, v>=10000?0:1)}k` : number(Math.round(v));

export function MacroBadge({ value, onToggle, standalone = false }: { value: BadgeState; onToggle: () => void; standalone?: boolean }) {
  const start = useRef<{x:number;y:number}|null>(null), dragged = useRef(false);
  const [details,setDetails]=useState(false);
  const keys = ['protein','carbs','fat'] as const;
  const labels = {protein:'P',carbs:'KH',fat:'F'};
  return <button className={`macro-badge ${details?'show-details':''} ${value.open?'panel-open':''} ${value.reducedMotion?'reduce-motion':''}`} aria-expanded={value.open}
    aria-label={`Kalorie-Widget ${value.open?'einklappen':'öffnen'}. Heute ${number(value.total.kcal)} kcal. Protein ${number(value.total.protein,1)} g, Kohlenhydrate ${number(value.total.carbs,1)} g, Fett ${number(value.total.fat,1)} g.`}
    title="P: Protein · KH: Kohlenhydrate · F: Fett. Klicken zum Öffnen, Ziehen zum Verschieben."
    onMouseEnter={()=>setDetails(true)} onMouseLeave={()=>setDetails(false)} onFocus={()=>setDetails(true)} onBlur={()=>setDetails(false)}
    onPointerDown={e=>{if(e.button!==0)return;start.current={x:e.clientX,y:e.clientY};dragged.current=false;e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{if(!start.current || !(e.buttons&1))return;if(Math.abs(e.clientX-start.current.x)+Math.abs(e.clientY-start.current.y)>6){start.current=null;dragged.current=true;if(standalone)void dragWindow().catch(()=>{});}}}
    onPointerUp={()=>{start.current=null;}} onPointerCancel={()=>{start.current=null;dragged.current=true;}}
    onClick={()=>{if(!dragged.current)onToggle();dragged.current=false;}}>
    <svg className="badge-rings" viewBox="0 0 128 128" shapeRendering="geometricPrecision" aria-hidden="true">
      <circle className="badge-surface" cx="64" cy="64" r="63"/>
      {keys.map((key,i)=>{const radius=59-i*5.5,progress=Math.max(0,Math.min(1,value.total[key]/value.goals[key]));return <g key={key} className={`badge-${key}`}>
        <circle className="badge-track" cx="64" cy="64" r={radius}/>
        {progress > 0 && <circle className="badge-value" cx="64" cy="64" r={radius} pathLength="100" strokeDasharray={progress < 1 ? `${progress*100} 100` : undefined} transform="rotate(-90 64 64)"/>}
      </g>;})}
    </svg>
    <span className="badge-calories"><strong>{number(value.total.kcal)}</strong><span>kcal</span></span>
    <span className="badge-today">HEUTE</span>
    <span className="badge-macros" aria-hidden={!details}>{keys.map(key=><span className={`badge-${key}`} key={key}><b>{labels[key]}<small> g</small></b><span>{compactGrams(value.total[key])}</span></span>)}</span>
  </button>;
}

export default function Badge() {
  const [value,setValue]=useState<BadgeState|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    document.body.classList.add('badge-window','native');
    const shortcut=(e:KeyboardEvent)=>{if(e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey)){e.preventDefault();void invoke('widget_quick_input').catch(e=>setError(String(e)));}};
    window.addEventListener('keydown',shortcut);
    let alive=true;const unlisten:(()=>void)[]=[];
    const keep=(fn:()=>void)=>{if(alive)unlisten.push(fn);else fn();};
    const receive=listen<BadgeState>('widget-badge-state',e=>{if(alive)setValue(e.payload);}).then(keep);
    const panel=listen<boolean>('widget-panel-state',e=>{if(alive)setValue(v=>v?{...v,open:e.payload}:v);}).then(keep);
    restoreWindow().then(keep).catch(e=>setError(String(e)));
    // Only the main panel writes the journal or synchronizes. The badge is a view.
    Promise.all([receive,panel]).then(async()=>{
      const data=await loadData();if(alive)setValue(v=>v||{total:sum(data.entries.filter(e=>e.date===today())),goals:data.settings.goals,open:false,reducedMotion:data.settings.reducedMotion});
      await invoke('widget_badge_ready');
    }).catch(e=>setError(String(e)));
    return()=>{alive=false;window.removeEventListener('keydown',shortcut);unlisten.forEach(fn=>fn());};
  },[]);
  return <div className="badge-shell">{value?<MacroBadge value={value} standalone onToggle={()=>void invoke('widget_toggle').then(()=>setError('')).catch(e=>setError(String(e)))}/>:<button className="macro-badge badge-loading" onClick={()=>void invoke('widget_toggle')}>Kalorie</button>}{error&&<button className="badge-error" title={error} aria-label="Widget öffnen, Status prüfen" onClick={()=>void invoke('widget_toggle')}>!</button>}
  </div>;
}
