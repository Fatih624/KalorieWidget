import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Flame,
  Settings2,
  Minus,
  Pin,
  PinOff,
  X,
  Plus,
  Sparkles,
  Mic,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  ChartNoAxesColumnIncreasing,
  Utensils,
  Dumbbell,
  Wheat,
  Droplet,
  Pencil,
  Trash2,
  Grip,
  Check,
  Undo2,
  LoaderCircle,
  Cloud,
} from "lucide-react";
import { FoodGlyph } from "./FoodGlyph";
import { MacroBadge } from "./Badge";
import { useWidgetWindows } from "./widgetWindows";
import { useCloud, CloudPanel, CloudConflict } from "./cloud";
import {
  loadData,
  saveData,
  native,
  resizeWindow,
  restoreWindow,
  pinWindow,
  closeWindow,
  hasKey,
  transcribe,
} from "./bridge";
import {
  localDate,
  makeEntry,
  number,
  parseData,
  sum,
  today,
  week,
} from "./domain";
import type { AppData, Entry, Food, Settings } from "./domain";
import {
  FoodEditor,
  FoodSearch,
  IconButton,
  Modal,
  Ring,
  SettingsPanel,
} from "./components";

type Panel =
  | { type: "search"; query: string; tab?: "local" | "ai" }
  | { type: "settings" }
  | { type: "cloud" }
  | {
      type: "food";
      food?: Food;
      mode: "add" | "entry" | "favorite";
      entry?: Entry;
    }
  | { type: "favorites" }
  | { type: "week" }
  | { type: "import"; data: AppData }
  | null;
type Toast = { id: number; message: string; undo?: () => void };

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const cloud = useCloud(data, setData);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(today());
  const [currentDay, setCurrentDay] = useState(today());
  const [transitioning, setTransitioning] = useState(false);
  const [recording, setRecording] = useState(false);
  const [permissionPending,setPermissionPending]=useState(false);
  const [fileDialogPending,setFileDialogPending]=useState(false);
  const [moreBelow,setMoreBelow]=useState(false);
  const scrollRef=useRef<HTMLDivElement>(null);
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  useWidgetWindows(data, setData, currentDay, recording || transcribing || permissionPending || fileDialogPending, setSaveError,()=>{setTimeout(()=>{const dialog=document.querySelector('dialog[open]');(dialog?.querySelector<HTMLElement>('input,select,textarea,button')??inputRef.current)?.focus();},80);});
  const load = () => {
    setLoadError("");
    loadData()
      .then(d => setData(native ? {...d, settings:{...d.settings, collapsed:true}} : d))
      .catch((e) => setLoadError(String(e)));
  };
  useEffect(() => {
    load();
    document.body.classList.toggle("native", native);
    let cleanup: (() => void) | undefined;
    let disposed = false;
    restoreWindow()
      .then((fn) => {
        if (disposed) fn();
        else cleanup = fn;
      })
      .catch((e) => setSaveError(String(e)));
    return () => {
      disposed = true;
      cleanup?.();
      if (recorder.current?.state === "recording") recorder.current.stop();
      micStream.current?.getTracks().forEach((t) => t.stop());
      clearTimeout(recordingTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!data) return;
    let active = true;
    setSaving(true);
    saveData(data)
      .then(() => {
        if (active) {
          setSaveError("");
          setSaving(false);
        }
      })
      .catch((e) => {
        if (active) {
          setSaveError(String(e));
          setSaving(false);
        }
      });
    return () => {
      active = false;
    };
  }, [data]);
  const collapsed = data?.settings.collapsed ?? false;
  const alwaysOnTop = data?.settings.alwaysOnTop ?? true;
  useEffect(() => {
    if (data)
      pinWindow(alwaysOnTop).catch((e) =>
        setSaveError(`Fensterposition: ${String(e)}`),
      );
  }, [alwaysOnTop, !!data]);
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(
      () =>
        resizeWindow(collapsed).catch((e) =>
          setSaveError(`Fenstergröße: ${String(e)}`),
        ),
      0,
    );
    return () => clearTimeout(timer);
  }, [collapsed, !!data]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const timer = setInterval(() => {
      const next = today();
      setCurrentDay((previous) => {
        if (previous !== next) setDate((d) => (d === previous ? next : d));
        return next;
      });
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (collapsed) void toggleCollapsed();
        setTimeout(() => inputRef.current?.focus(), 400);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });
  useEffect(() => {
    if (native) return;
    const outside = (e:PointerEvent) => { if (!(e.target as Element).closest(".app-shell") && !recording && !transcribing) setData(d => d ? {...d,settings:{...d.settings,collapsed:true}} : d); };
    document.addEventListener("pointerdown",outside);
    return () => document.removeEventListener("pointerdown",outside);
  }, [recording,transcribing]);
  useEffect(() => {
    const picking=(event:MouseEvent)=>{if(event.target instanceof HTMLInputElement && event.target.type==='file')setFileDialogPending(true);};
    const complete=()=>setFileDialogPending(false);
    document.addEventListener('click',picking,true);document.addEventListener('change',complete,true);document.addEventListener('cancel',complete,true);window.addEventListener('focus',complete);
    return()=>{document.removeEventListener('click',picking,true);document.removeEventListener('change',complete,true);document.removeEventListener('cancel',complete,true);window.removeEventListener('focus',complete);};
  },[]);
  useEffect(() => {
    const el=scrollRef.current;if(!el)return;
    const measure=()=>setMoreBelow(el.scrollHeight-el.scrollTop-el.clientHeight>28);
    const observer=new ResizeObserver(measure);observer.observe(el);el.addEventListener('scroll',measure);measure();
    return()=>{observer.disconnect();el.removeEventListener('scroll',measure);};
  },[data,collapsed]);
  function notify(message: string, undo?: () => void) {
    setToast({ id: Date.now(), message, undo });
  }
  async function toggleCollapsed() {
    if (!data || transitioning || recording || transcribing) return;
    setTransitioning(true);
    setData(d => d ? {...d, settings:{...d.settings, collapsed:!d.settings.collapsed}} : d);
    setTimeout(() => setTransitioning(false), 200);
  }
  function add(food: Food) {
    setData((d) =>
      d ? { ...d, entries: [...d.entries, makeEntry(food, date)] } : d,
    );
    setQuery("");
    notify(`${food.name} hinzugefügt`);
  }
  function saveFood(food: Food, favorite: boolean) {
    if (panel?.type !== "food") return;
    const current = panel;
    setData((d) => {
      if (!d) return d;
      let favorites = d.favorites;
      if (favorite || current.mode === "favorite")
        favorites = favorites.some((f) => f.id === food.id)
          ? favorites.map((f) => (f.id === food.id ? food : f))
          : [...favorites, food];
      const entries =
        current.mode === "entry" && current.entry
          ? d.entries.map((e) =>
              e.entryId === current.entry!.entryId
                ? { ...food, entryId: e.entryId, date: e.date, time: e.time }
                : e,
            )
          : current.mode === "favorite"
            ? d.entries
            : [...d.entries, makeEntry(food, date)];
      return { ...d, favorites, entries };
    });
    setPanel(null);
    setQuery("");
    notify(
      current.mode === "add"
        ? `${food.name} hinzugefügt`
        : "Änderungen gespeichert",
    );
  }
  function removeEntry(entry: Entry) {
    setData((d) =>
      d
        ? {
            ...d,
            entries: d.entries.filter((e) => e.entryId !== entry.entryId),
          }
        : d,
    );
    notify("Eintrag entfernt", () =>
      setData((d) => (d ? { ...d, entries: [...d.entries, entry] } : d)),
    );
  }
  function removeFavorite(food: Food) {
    setData((d) =>
      d ? { ...d, favorites: d.favorites.filter((f) => f.id !== food.id) } : d,
    );
    notify("Favorit entfernt", () =>
      setData((d) => (d ? { ...d, favorites: [...d.favorites, food] } : d)),
    );
  }
  async function startVoice() {
    if(permissionPending || transcribing)return;
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (!data?.settings.speech) {
      setPanel({ type: "settings" });
      notify("Aktiviere Sprache unter „KI & Sprache“.");
      return;
    }
    if (!native) {
      notify("Spracheingabe steht in der Windows-App bereit.");
      return;
    }
    setPermissionPending(true);
    try {
      if (!(await hasKey("openai")))
        throw new Error(
          "Bitte hinterlege einen OpenAI-Schlüssel unter „KI & Sprache“.",
        );
      if (
        !navigator.mediaDevices?.getUserMedia ||
        !window.MediaRecorder ||
        !MediaRecorder.isTypeSupported("audio/webm")
      )
        throw new Error(
          "Die Audioaufnahme wird hier nicht unterstützt. Bitte Text eingeben.",
        );
      micStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const chunks: BlobPart[] = [];
      const media = new MediaRecorder(micStream.current, {
        mimeType: "audio/webm",
      });
      recorder.current = media;
      media.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      media.onerror = () => {
        setRecording(false);
        micStream.current?.getTracks().forEach((t) => t.stop());
        notify("Die Mikrofonaufnahme ist fehlgeschlagen.");
      };
      media.onstop = async () => {
        clearTimeout(recordingTimer.current);
        setRecording(false);
        micStream.current?.getTracks().forEach((t) => t.stop());
        setTranscribing(true);
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          if (blob.size > 5_000_000)
            throw new Error(
              "Die Aufnahme ist zu groß. Bitte kürzer aufnehmen.",
            );
          const text = await transcribe(
            Array.from(new Uint8Array(await blob.arrayBuffer())),
            data.settings.dailyLimit,
          );
          setQuery(text);
          setPanel({ type: "search", query: text });
        } catch (e) {
          notify(String(e));
        } finally {
          setTranscribing(false);
        }
      };
      media.start();
      setRecording(true);
      recordingTimer.current = setTimeout(() => {
        if (media.state === "recording") media.stop();
      }, 30000);
    } catch (e) {
      micStream.current?.getTracks().forEach((t) => t.stop());
      notify(String(e));
    } finally {setPermissionPending(false);}
  }
  if (!data)
    return (
      <div className="boot surface">
        <Flame size={28} />
        <h1>Kalorie Widget</h1>
        {loadError ? (
          <>
            <p className="error" role="alert">
              {loadError}
            </p>
            <button className="secondary" onClick={load}>
              Erneut laden
            </button>
            <p className="small muted">
              Vorhandene Daten werden nicht überschrieben.
            </p>
          </>
        ) : (
          <p className="muted">Dein Widget wird geladen …</p>
        )}
      </div>
    );
  const entries = data.entries
    .filter((e) => e.date === date)
    .sort((a, b) => b.time.localeCompare(a.time));
  const total = sum(entries);
  const miniTotal = sum(data.entries.filter((e) => e.date === currentDay));
  const goals = data.settings.goals;
  const remaining = goals.kcal - total.kcal;
  const days = week(data.entries);
  const activeDays = days.filter((d) => d.count > 0).length;
  const favorites = [...data.favorites]
    .sort(
      (a, b) =>
        data.entries.filter((e) => e.id === b.id).length -
        data.entries.filter((e) => e.id === a.id).length,
    )
    .slice(0, 3);
  const displayDate = new Date(date + "T12:00:00");
  const dateLabel =
    date === currentDay
      ? "Heute"
      : displayDate.toLocaleDateString("de-DE", {
          day: "numeric",
          month: "short",
        });
  const reduced = data.settings.reducedMotion;
  const changeDay = (offset: number) => {
    const next = new Date(date + "T12:00:00");
    next.setDate(next.getDate() + offset);
    setDate(localDate(next));
  };
  function submitQuery(e: FormEvent) {
    e.preventDefault();
    setPanel({ type: "search", query });
  }
  return (
    <div
      className={`app-shell ${!native && collapsed ? "is-collapsed" : ""} ${reduced ? "reduce-motion" : ""}`}
    >
      {!native && (
        <div className="preview-note">
          <span className="preview-dot" /> DESKTOP-VORSCHAU
        </div>
      )}
      {!native && <div className="preview-badge"><MacroBadge value={{total:miniTotal,goals,open:!collapsed,reducedMotion:reduced}} onToggle={() => void toggleCollapsed()} /></div>}
      <main className="widget surface">
        <div className="expanded-content" inert={!native && collapsed}>
          <header className="widget-header">
            <div
              className="brand"
              title="Zum Verschieben das kleine Symbol ziehen"
            >
              <div className="brand-mark">
                <Flame size={21} fill="currentColor" strokeWidth={1.5} />
              </div>
              <span>
                Kalorie<span className="brand-light"> Widget</span>
              </span>
              <Grip size={13} className="drag-hint" />
            </div>
            <div className="window-controls">
              <IconButton label="Handy & Cloud" onClick={() => setPanel({ type: "cloud" })} active={cloud.connection?.connected}>
                <Cloud size={15} />
              </IconButton>
              <IconButton
                label={
                  alwaysOnTop ? "Vordergrund lösen" : "Immer im Vordergrund"
                }
                active={alwaysOnTop}
                onClick={() =>
                  setData({
                    ...data,
                    settings: { ...data.settings, alwaysOnTop: !alwaysOnTop },
                  })
                }
              >
                {alwaysOnTop ? <Pin size={14} /> : <PinOff size={14} />}
              </IconButton>
              <IconButton
                label="Einstellungen"
                onClick={() => setPanel({ type: "settings" })}
              >
                <Settings2 size={16} />
              </IconButton>
              <IconButton
                label="Zum Kreis zusammenklappen"
                disabled={recording || transcribing || transitioning}
                onClick={() => void toggleCollapsed()}
              >
                <Minus size={18} />
              </IconButton>
              {native && (
                <IconButton
                  label="Widget beenden"
                  onClick={() => {
                    if (!saving && !recording && !transcribing)
                      void closeWindow().catch((e) => notify(String(e)));
                  }}
                  disabled={saving || recording || transcribing}
                >
                  <X size={16} />
                </IconButton>
              )}
            </div>
          </header>
          <div className="widget-scroll" ref={scrollRef}>
            <div className="day-navigation">
              <div className="eyebrow">DEIN TAG. DEIN TEMPO.</div>
              <div className="date-controls">
                <IconButton
                  label="Vorheriger Tag"
                  onClick={() => changeDay(-1)}
                >
                  <ChevronLeft size={14} />
                </IconButton>
                <button
                  className="date-label"
                  title="Zu heute wechseln"
                  onClick={() => setDate(currentDay)}
                >
                  {dateLabel}
                  <span>
                    {displayDate.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </button>
                <IconButton
                  label="Nächster Tag"
                  disabled={date >= currentDay}
                  onClick={() => changeDay(1)}
                >
                  <ChevronRight size={14} />
                </IconButton>
              </div>
            </div>
            <section className="calorie-overview">
              <Ring value={total.kcal} goal={goals.kcal} />
              <div className="calorie-copy">
                <span className="muted">
                  {remaining >= 0 ? "Noch für dich" : "Über deinem Ziel"}
                </span>
                <div className="remaining">
                  <strong key={Math.round(Math.abs(remaining))}>
                    {number(Math.abs(remaining))}
                  </strong>
                  <span>kcal</span>
                </div>
                <span className="progress-caption">
                  <span className="little-spark">✦</span>
                  {number((total.kcal / goals.kcal) * 100)} % deines Tagesziels
                </span>
              </div>
            </section>
            <section className="macro-section" aria-label="Makronährstoffe">
              {(
                [
                  {
                    key: "protein",
                    label: "Protein",
                    icon: Dumbbell,
                    color: "#f6a0cc",
                  },
                  {
                    key: "carbs",
                    label: "Kohlenhydrate",
                    icon: Wheat,
                    color: "#86ebc3",
                  },
                  {
                    key: "fat",
                    label: "Fett",
                    icon: Droplet,
                    color: "#f4d180",
                  },
                ] as const
              ).map(({ key, label, icon: Icon, color }) => (
                <div
                  className="macro-row"
                  key={key}
                  style={{ "--macro-color": color } as CSSProperties}
                >
                  <span className="macro-icon">
                    <Icon size={17} />
                  </span>
                  <div className="macro-info">
                    <div className="macro-heading">
                      <span>{label}</span>
                      <span>
                        <b>{number(total[key], 1)}</b>
                        <span className="muted"> / {number(goals[key])} g</span>
                      </span>
                    </div>
                    <div
                      className="macro-track"
                      role="progressbar"
                      aria-label={label}
                      aria-valuenow={Math.round(total[key])}
                      aria-valuemin={0}
                      aria-valuemax={Math.max(
                        goals[key],
                        Math.round(total[key]),
                      )}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, (total[key] / goals[key]) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>
            <section className="favorites-section">
              <div className="section-heading">
                <h2>
                  <Star size={14} />
                  Deine Favoriten
                </h2>
                <button
                  className="text-button"
                  onClick={() => setPanel({ type: "favorites" })}
                >
                  Alle ansehen
                  <ChevronRight size={12} />
                </button>
              </div>
              <div className="favorite-grid">
                {favorites.map((f) => (
                  <button
                    className="favorite-card"
                    key={f.id}
                    title={`${f.name}: ${number(f.grams)} g direkt hinzufügen`}
                    onClick={() => add(f)}
                  >
                    <FoodGlyph food={f} />
                    <strong>{f.name}</strong>
                    <small>
                      {number(f.grams)} g · {number(f.macros.kcal)} kcal
                    </small>
                    <span className="favorite-plus">
                      <Plus size={15} />
                    </span>
                  </button>
                ))}
                {favorites.length < 3 && (
                  <button
                    className="favorite-card add-favorite"
                    onClick={() => setPanel({ type: "food", mode: "favorite" })}
                  >
                    <Plus size={20} />
                    <span>Neuer Favorit</span>
                  </button>
                )}
              </div>
            </section>
            <section className="diary-section">
              <div className="section-heading">
                <h2>
                  <Utensils size={14} />
                  {date === currentDay ? "Heute gegessen" : "Tagebuch"}
                </h2>
                <span className="count-badge">
                  {entries.length}{" "}
                  {entries.length === 1 ? "Eintrag" : "Einträge"}
                </span>
              </div>
              {entries.length === 0 ? (
                <button
                  className="empty-diary"
                  onClick={() => setPanel({ type: "search", query: "" })}
                >
                  <div className="empty-icon">
                    <Utensils size={21} />
                    <span>+</span>
                  </div>
                  <strong>Ein guter Tag beginnt mit dir.</strong>
                  <span>Trag deine erste Mahlzeit ein.</span>
                </button>
              ) : (
                <div className="diary-list">
                  {entries.map((e) => (
                    <div className="diary-entry" key={e.entryId}>
                      <FoodGlyph food={e} />
                      <button
                        className="entry-main"
                        onClick={() =>
                          setPanel({
                            type: "food",
                            food: e,
                            entry: e,
                            mode: "entry",
                          })
                        }
                      >
                        <strong>{e.name}</strong>
                        <small>
                          {e.time} · {number(e.grams)} g{" "}
                          <span>
                            · P {number(e.macros.protein)} / KH{" "}
                            {number(e.macros.carbs)} / F {number(e.macros.fat)}
                          </span>
                        </small>
                      </button>
                      <div className="entry-right">
                        <span>
                          {number(e.macros.kcal)}
                          <small> kcal</small>
                        </span>
                        <IconButton
                          label={`${e.name} entfernen`}
                          onClick={() => removeEntry(e)}
                        >
                          <Trash2 size={13} />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            {data.settings.reminder &&
              date === currentDay &&
              entries.length === 0 &&
              new Date().getHours() >= 14 && (
                <div className="daily-nudge">
                  Schon etwas Leckeres gegessen? Ein Favorit ist mit einem Klick
                  erfasst.
                </div>
              )}
            <button
              className="week-link"
              onClick={() => setPanel({ type: "week" })}
            >
              <div className="week-label">
                <ChartNoAxesColumnIncreasing size={16} />
                <div>
                  <strong>Deine Woche im Blick</strong>
                  <small>
                    {activeDays
                      ? `An ${activeDays} ${activeDays === 1 ? "Tag" : "Tagen"} etwas für dich festgehalten`
                      : "Kleine Schritte werden sichtbar"}
                  </small>
                </div>
              </div>
              <div className="mini-bars" aria-hidden="true">
                {days.map((d) => (
                  <span
                    key={d.date}
                    className={d.date === currentDay ? "today" : ""}
                    style={{
                      height: `${Math.max(5, Math.min(26, (d.kcal / goals.kcal) * 26))}px`,
                    }}
                  />
                ))}
              </div>
              <ChevronRight size={15} />
            </button>
          </div>
          {moreBelow && <button className="scroll-cue" onClick={()=>scrollRef.current?.scrollBy({top:240,behavior:reduced?"auto":"smooth"})}>Weiter nach unten <ChevronDown size={14}/></button>}
          <footer className="widget-footer">
            <form
              className={`quick-input ${recording ? "recording" : ""}`}
              onSubmit={submitQuery}
            >
              <input
                ref={inputRef}
                aria-label="Essen hinzufügen"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  recording
                    ? "Ich höre zu …"
                    : transcribing
                      ? "Wird in Text umgewandelt …"
                      : "Was hast du gegessen?"
                }
                maxLength={1600}
                disabled={recording || transcribing}
              />
              <IconButton
                label={
                  recording ? "Aufnahme stoppen und senden" : "Spracheingabe"
                }
                onClick={() => void startVoice()}
                active={recording}
                disabled={transcribing}
              >
                {transcribing ? (
                  <LoaderCircle size={16} className="spin" />
                ) : recording ? (
                  <Square size={16} fill="currentColor" />
                ) : (
                  <Mic size={17} />
                )}
              </IconButton>
              <button
                type="submit"
                className="quick-add"
                aria-label="Essen erfassen"
                title="Essen erfassen"
                disabled={recording || transcribing}
              >
                <Plus size={20} />
              </button>
            </form>
            <div className="footer-meta">
              <span className={`local-status ${saveError ? "warning" : ""}`}>
                <span />
                {saveError
                  ? "Speicherung prüfen"
                  : saving
                    ? "Wird gespeichert …"
                    : "Lokal gespeichert"}
              </span>
              <button
                className="text-button"
                onClick={() => setPanel({ type: "search", query, tab: "ai" })}
              >
                <Sparkles size={12} />
                Mit KI erfassen
              </button>
            </div>
            {saveError && (
              <div className="error save-error" role="alert">
                {saveError}
                <button
                  className="text-button"
                  onClick={() => setData({ ...data })}
                >
                  Erneut speichern
                </button>
              </div>
            )}
          </footer>
        </div>
        {toast && !collapsed && (
          <div className="toast" role="status">
            <Check size={16} />
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                onClick={() => {
                  toast.undo!();
                  setToast(null);
                }}
              >
                <Undo2 size={15} />
                Rückgängig
              </button>
            )}
            <button
              className="toast-close"
              aria-label="Hinweis schließen"
              onClick={() => setToast(null)}
            >
              <X size={13} />
            </button>
          </div>
        )}
      </main>
      {panel?.type === "cloud" && <CloudPanel cloud={cloud} onClose={() => setPanel(null)} />}
      <CloudConflict cloud={cloud} />
      {panel?.type === "search" && (
        <FoodSearch
          initialQuery={panel.query}
          initialTab={panel.tab}
          favorites={data.favorites}
          entries={data.entries}
          settings={data.settings}
          onClose={() => setPanel(null)}
          onSelect={(food) => setPanel({ type: "food", food, mode: "add" })}
          onManual={() => setPanel({ type: "food", mode: "add" })}
          onSettings={() => setPanel({ type: "settings" })}
        />
      )}
      {panel?.type === "food" && (
        <FoodEditor
          key={panel.food?.id || panel.mode}
          food={panel.food}
          mode={panel.mode}
          onClose={() => setPanel(null)}
          onSave={saveFood}
        />
      )}
      {panel?.type === "settings" && (
        <SettingsPanel
          data={data}
          onSave={(settings: Settings) => {
            setData({ ...data, settings });
            setPanel(null);
            notify("Einstellungen übernommen");
          }}
          onImport={(imported) => setPanel({ type: "import", data: imported })}
          onClose={() => setPanel(null)}
        />
      )}
      {panel?.type === "favorites" && (
        <Modal
          title="Deine schnellen Lieblinge"
          eyebrow="FAVORITEN"
          onClose={() => setPanel(null)}
        >
          <p className="muted small">
            Ein Klick auf + übernimmt die gespeicherte Portion. Mit dem Stift
            kannst du Portion und Nährwerte anpassen.
          </p>
          <div className="favorite-list">
            {data.favorites.map((f) => (
              <div key={f.id} className="favorite-list-row">
                <span className="food-emoji">{f.emoji}</span>
                <div>
                  <strong>{f.name}</strong>
                  <small>
                    {number(f.grams)} g · {number(f.macros.kcal)} kcal
                  </small>
                </div>
                <IconButton
                  label={`${f.name} bearbeiten`}
                  onClick={() =>
                    setPanel({ type: "food", food: f, mode: "favorite" })
                  }
                >
                  <Pencil size={14} />
                </IconButton>
                <IconButton
                  label={`Favorit ${f.name} entfernen`}
                  onClick={() => removeFavorite(f)}
                >
                  <Trash2 size={14} />
                </IconButton>
                <IconButton
                  label={`${f.name} hinzufügen`}
                  onClick={() => {
                    add(f);
                    setPanel(null);
                  }}
                >
                  <Plus size={18} />
                </IconButton>
              </div>
            ))}
          </div>
          <button
            className="primary full"
            onClick={() => setPanel({ type: "food", mode: "favorite" })}
          >
            <Plus size={16} />
            Neuer Favorit
          </button>
          <p className="muted small">
            Die Startfavoriten sind Richtwerte. Passe sie an deine Produkte an.
            Häufig genutzte Favoriten erscheinen auf der Startansicht zuerst.
          </p>
        </Modal>
      )}
      {panel?.type === "week" && (
        <Modal
          title="Jeder Eintrag zählt."
          eyebrow="DEINE LETZTEN 7 TAGE"
          onClose={() => setPanel(null)}
        >
          <div className="weekly-summary">
            <strong>
              {activeDays}
              <span> / 7 Tage</span>
            </strong>
            <p className="muted">
              {activeDays
                ? "Du machst deine Gewohnheiten sichtbar."
                : "Deine erste Mahlzeit ist ein schöner Anfang."}
            </p>
          </div>
          <div className="weekly-chart">
            {days.map((d) => (
              <button
                key={d.date}
                title={`${d.date}: ${number(d.kcal)} kcal, ${d.count} Einträge`}
                onClick={() => {
                  setDate(d.date);
                  setPanel(null);
                }}
              >
                <span>{number(d.kcal)}</span>
                <div className="weekly-bar-track">
                  <div
                    style={{
                      height: `${Math.max(3, Math.min(100, (d.kcal / Math.max(goals.kcal, ...days.map((item) => item.kcal))) * 100))}%`,
                    }}
                    className={d.date === currentDay ? "today" : ""}
                  />
                </div>
                <small>{d.label}</small>
              </button>
            ))}
          </div>
          <p className="muted small">
            Gezeigt werden erfasste Kalorien, keine Bewertung deines
            Essverhaltens. Klicke einen Tag an, um seine Einträge zu sehen.
          </p>
        </Modal>
      )}
      {panel?.type === "import" && (
        <Modal
          title="Sicherung übernehmen?"
          eyebrow="DATEN PRÜFEN"
          onClose={() => setPanel(null)}
        >
          <div className="notice">
            Die Sicherung enthält {panel.data.entries.length} Tagebucheinträge
            und {panel.data.favorites.length} Favoriten. Sie ersetzt das
            aktuelle Tagebuch samt Einstellungen. API-Schlüssel bleiben
            unverändert.
          </div>
          <div className="button-row">
            <button
              className="secondary"
              onClick={() => setPanel({ type: "settings" })}
            >
              Abbrechen
            </button>
            <button
              className="primary"
              onClick={() => {
                const imported = parseData(panel.data);
                setData({
                  ...imported,
                  settings: { ...imported.settings, collapsed: false },
                });
                setPanel(null);
                notify("Sicherung übernommen");
              }}
            >
              Sicherung übernehmen
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
