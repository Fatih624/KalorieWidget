import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { emitTo, listen } from '@tauri-apps/api/event';
import type { Dispatch, SetStateAction } from 'react';
import type { AppData } from './domain';
import { sum } from './domain';
import { closeWindow, native } from './bridge';
import type { BadgeState } from './Badge';

export function useWidgetWindows(data:AppData|null,setData:Dispatch<SetStateAction<AppData|null>>,day:string,blocked:boolean,onError:(error:string)=>void,onQuickInput:()=>void) {
  const latest=useRef({data,day,blocked,onError,onQuickInput});latest.current={data,day,blocked,onError,onQuickInput};
  const focusGeneration=useRef(0),pendingBlur=useRef(false),resumeBlur=useRef<()=>void>(()=>{});
  function publish(){const {data,day}=latest.current;if(!data)return;const value:BadgeState={total:sum(data.entries.filter(e=>e.date===day)),goals:data.settings.goals,open:!data.settings.collapsed,reducedMotion:data.settings.reducedMotion};void emitTo('badge','widget-badge-state',value).catch(e=>latest.current.onError(String(e)));}
  useEffect(()=>{if(native)publish();},[data,day]);
  useEffect(()=>{if(native&&!blocked&&pendingBlur.current)resumeBlur.current();},[blocked]);
  useEffect(()=>{
    if(!native)return;
    let alive=true;const cleanup:(()=>void)[]=[];let blurTimer:ReturnType<typeof setTimeout>|undefined;
    const collapse=()=>{if(!latest.current.blocked){pendingBlur.current=false;setData(d=>d?{...d,settings:{...d.settings,collapsed:true}}:d);}else pendingBlur.current=true;};
    const cancelBlur=()=>{focusGeneration.current++;pendingBlur.current=false;clearTimeout(blurTimer);};
    const checkBlur=()=>{clearTimeout(blurTimer);const generation=++focusGeneration.current;pendingBlur.current=true;blurTimer=setTimeout(()=>{invoke<boolean>('widget_has_focus').then(focused=>{if(!alive||generation!==focusGeneration.current)return;if(focused){pendingBlur.current=false;return;}collapse();}).catch(e=>latest.current.onError(String(e)));},140);};
    resumeBlur.current=checkBlur;
    function register<T>(event:string,handler:(value:T)=>void){listen<T>(event,e=>{if(alive)handler(e.payload);}).then(fn=>{if(alive)cleanup.push(fn);else fn();}).catch(e=>latest.current.onError(String(e)));}
    register('widget-request-toggle',()=>{if(latest.current.blocked)return;cancelBlur();if(!latest.current.data){void invoke('set_panel_visible',{visible:true}).catch(e=>latest.current.onError(String(e)));return;}setData(d=>d?{...d,settings:{...d.settings,collapsed:!d.settings.collapsed}}:d);});
    register('widget-panel-opened',()=>setData(d=>d?{...d,settings:{...d.settings,collapsed:false}}:d));
    register('widget-request-collapse',collapse);
    register('widget-request-input',()=>{cancelBlur();setData(d=>d?{...d,settings:{...d.settings,collapsed:false}}:d);latest.current.onQuickInput();});
    register('widget-badge-ready',publish);
    register('widget-panel-focus',cancelBlur);
    register('widget-panel-blur',checkBlur);
    register('widget-request-quit',()=>{if(!latest.current.blocked)void closeWindow().catch(e=>latest.current.onError(String(e)));});
    return()=>{alive=false;cancelBlur();resumeBlur.current=()=>{};cleanup.forEach(fn=>fn());};
  },[]);
}
