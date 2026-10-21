import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Cloud, RefreshCw, ExternalLink, Laptop, Check } from 'lucide-react';
import { native, saveData } from './bridge';
import { Modal } from './components';
import type { AppData } from './domain';
import { canonical, checkedSnapshot, initialSnapshot, mergeSnapshots, resolveConflicts } from '../sites/kalorie-coach/lib/nutrition';
import type { Snapshot, CloudDocument, Conflict } from '../sites/kalorie-coach/lib/nutrition';

type Connection = { url: string; gateway: boolean; connected: boolean };
const snapshotOf = (data: AppData): Snapshot => checkedSnapshot({ favorites: data.favorites, entries: data.entries, goals: data.settings.goals });
const apply = (data: AppData, snapshot: Snapshot): AppData => ({ ...data, favorites: snapshot.favorites, entries: snapshot.entries, settings: { ...data.settings, goals: snapshot.goals } });
function documentOf(value: CloudDocument): CloudDocument {
  if (!Number.isSafeInteger(value.revision) || value.revision < 0) throw new Error('Ungültige Version beim Abgleich.');
  return { revision: value.revision, snapshot: checkedSnapshot(value.snapshot) };
}
export function useCloud(data: AppData | null, setData: Dispatch<SetStateAction<AppData | null>>) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [status, setStatus] = useState('Lokal auf diesem Gerät');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{snapshot: Snapshot; conflicts: Conflict[]; remote: CloudDocument} | null>(null);
  const current = useRef(data); current.current = data;
  const base = useRef<CloudDocument | null>(null), busy = useRef(false), blocked = useRef(false), connected = useRef(false), generation = useRef(0);
  const ready = useRef(false);
  async function refresh() {
    if (!native) return;
    const c = await invoke<Connection>('cloud_status');
    connected.current = c.connected; setConnection(c);
    if (c.connected) {
      const b = await invoke<CloudDocument | null>('cloud_base');
      base.current = b ? documentOf(b) : null;
    }
    ready.current = true;
  }
  async function remember(document: CloudDocument) {
    await invoke('cloud_remember', { document });
    base.current = document;
  }
  async function sync() {
    if (!native || !connected.current || !ready.current || busy.current || blocked.current || !current.current) return;
    busy.current = true; const epoch = generation.current;
    setStatus('Wird abgeglichen …');
    try {
      const remote = documentOf(await invoke<CloudDocument>('cloud_pull'));
      if (epoch !== generation.current || !current.current) return;
      const local = snapshotOf(current.current);
      const merged = mergeSnapshots(base.current?.snapshot || initialSnapshot(), local, remote.snapshot);
      if (merged.conflicts.length) { blocked.current = true; setPending({ ...merged, remote }); setStatus('Änderungen prüfen'); return; }
      const saved = canonical(merged.snapshot) === canonical(remote.snapshot) ? remote : documentOf(await invoke<CloudDocument>('cloud_push', { snapshot: merged.snapshot, expectedRevision: remote.revision }));
      if (epoch !== generation.current || !current.current) return;
      const newer = mergeSnapshots(local, snapshotOf(current.current), saved.snapshot);
      if (newer.conflicts.length) { blocked.current = true; setPending({ ...newer, remote: saved }); setStatus('Änderungen prüfen'); return; }
      const next = apply(current.current, newer.snapshot);
      if (canonical(snapshotOf(current.current)) !== canonical(newer.snapshot)) {
        current.current = next; setData(next);
      }
      // Save journal first: a crash must never leave the merge base ahead of it.
      await saveData(next);
      if (epoch !== generation.current) return;
      await remember(saved);
      setStatus('Handy & Widget aktuell'); setError('');
    } catch (e) {
      if (epoch === generation.current) { setStatus('Lokal gesichert · Abgleich ausstehend'); setError(String(e) === 'CLOUD_CONFLICT' ? 'Auf einem anderen Gerät geändert. Der nächste Abgleich führt die Änderungen zusammen.' : String(e)); }
    } finally { busy.current = false; }
  }
  useEffect(() => { let active = true; refresh().then(() => { if (active) void sync(); }).catch(e => setError(String(e))); const timer = setInterval(() => void sync(), 20000); const focus = () => void sync(); window.addEventListener('focus', focus); return () => { active = false; generation.current++; clearInterval(timer); window.removeEventListener('focus', focus); }; }, []);
  const content = data ? canonical({favorites:data.favorites,entries:data.entries,goals:data.settings.goals}) : '';
  useEffect(() => { const timer = setTimeout(() => void sync(), 1200); return () => clearTimeout(timer); }, [content, connection?.connected]);
  async function connect(code: string) { if (busy.current) throw new Error('Bitte warte den laufenden Abgleich ab.'); await invoke('cloud_connect', { code }); await refresh(); await sync(); }
  async function disconnect() { if (busy.current) throw new Error('Bitte warte den laufenden Abgleich ab.'); generation.current++; connected.current = false; await invoke('cloud_disconnect'); base.current = null; blocked.current = false; setPending(null); setStatus('Lokal auf diesem Gerät'); setError(''); await refresh(); }
  async function resolve(choice: 'local' | 'remote') {
    if (!pending || !current.current) return;
    try {
      const nextSnapshot = resolveConflicts(pending.snapshot, pending.conflicts, choice);
      const next = apply(current.current, nextSnapshot);
      await saveData(next); await remember(pending.remote);
      current.current = next; setData(next); blocked.current = false; setPending(null); await sync();
    } catch (e) { setError(String(e)); }
  }
  return { connection, status, error, pending, sync, connect, disconnect, resolve };
}
export type CloudController = ReturnType<typeof useCloud>;
export function CloudPanel({ cloud, onClose }: { cloud: CloudController; onClose: () => void }) {
  const [code, setCode] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function run(fn: () => Promise<unknown>) { setBusy(true); setError(''); try { await fn(); } catch (e) { setError(String(e)); } finally { setBusy(false); } }
  return <Modal title="Handy & Cloud" eyebrow="EIN TAGEBUCH. ALLE GERÄTE." onClose={onClose}>
    <div className="form-stack"><p className="muted">Öffne deine private Site auf dem Handy. Unter „Mehr“ erstellst du einen Kopplungscode für dieses Widget.</p>
    <button className="secondary" onClick={() => void run(() => invoke('cloud_open'))}><ExternalLink size={16}/>Private Site öffnen</button>
    <p className="small muted" style={{overflowWrap:'anywhere'}}>{cloud.connection?.url || 'Die Cloud-Verbindung ist in der Windows-App verfügbar.'}</p>
    <p role="status"><Cloud size={15}/> {cloud.status}</p>
    {cloud.connection?.connected ? <><button className="primary" disabled={busy} onClick={() => void run(cloud.sync)}><RefreshCw size={16}/>Jetzt abgleichen</button><button className="secondary" disabled={busy} onClick={() => void run(cloud.disconnect)}>Verbindung trennen</button><p className="small muted">Deine lokalen Einträge bleiben beim Trennen erhalten. Gerätezugriff kannst du zusätzlich auf der Site widerrufen.</p></> : <form className="form-stack" onSubmit={e => { e.preventDefault(); void run(() => cloud.connect(code)); }}><label>Kopplungscode<input value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false} maxLength={16} placeholder="16 Zeichen von deiner Site"/></label><button className="primary" disabled={busy || code.trim().length !== 16 || !cloud.connection?.gateway}><Laptop size={16}/>Widget verbinden</button>{cloud.connection && !cloud.connection.gateway && <p className="notice">Der private Site-Zugang wird mit dem eingerichteten Windows-Paket bereitgestellt.</p>}</form>}
    <p className="small muted">Favoriten, Tagesziele und Einträge werden abgeglichen. Darstellung und API-Schlüssel bleiben auf diesem Gerät. Offline gesicherte Änderungen werden beim nächsten erfolgreichen Abgleich übertragen.</p>
    {(error || cloud.error) && <p className="error" role="alert">{error || cloud.error}</p>}</div>
  </Modal>;
}
export function CloudConflict({ cloud }: { cloud: CloudController }) {
  if (!cloud.pending) return null;
  return <Modal title="Änderungen abgleichen" eyebrow="DEINE AUSWAHL" onClose={() => {}}><div className="form-stack"><p>Diese Angaben wurden auf beiden Geräten verändert. Welche Version soll bleiben?</p>{cloud.pending.conflicts.map(c => <p className="notice" key={c.collection + c.id}>{c.label}</p>)}<button className="primary" onClick={() => void cloud.resolve('local')}><Check size={16}/>Version des Widgets behalten</button><button className="secondary" onClick={() => void cloud.resolve('remote')}>Version der Site behalten</button>{cloud.error && <p className="error" role="alert">{cloud.error}</p>}</div></Modal>;
}
