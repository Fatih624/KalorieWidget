import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  X,
  Plus,
  Search,
  Sparkles,
  Star,
  ArrowRight,
  LoaderCircle,
  Check,
  Download,
  Upload,
  KeyRound,
  Trash2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  defaults,
  findLocal,
  number,
  parseData,
  portion,
  validFood,
} from "./domain";
import type { AppData, Entry, Food, Settings } from "./domain";
import { quickSearchFoods } from "./quickSearch";
import {
  estimateFood,
  exportData,
  hasKey,
  native,
  searchProducts,
  setKey,
  usage,
} from "./bridge";

export function IconButton({
  label,
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`icon-button ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  eyebrow,
  children,
  onClose,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        // File inputs bubble their own cancel event when the OS picker closes.
        // Only Escape on this dialog itself should close the editor.
        if(e.target!==e.currentTarget)return;
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-body">
        <header className="modal-header">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          <IconButton label="Schließen" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Ring({
  value,
  goal,
  compact = false,
}: {
  value: number;
  goal: number;
  compact?: boolean;
}) {
  const progress = Math.min(1, Math.max(0, value / goal));
  return (
    <div
      className={`ring ${compact ? "compact-ring" : ""}`}
      aria-label={`${number(value)} von ${number(goal)} Kilokalorien`}
    >
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <defs>
          <linearGradient
            id={compact ? "ring-mini" : "ring-main"}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#8fffe4" />
            <stop offset="100%" stopColor="#4acbff" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx="90" cy="90" r="77" />
        <circle
          className="ring-value"
          cx="90"
          cy="90"
          r="77"
          pathLength="100"
          stroke={`url(#${compact ? "ring-mini" : "ring-main"})`}
          strokeDasharray={`${progress * 100} 100`}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="ring-label">
        <strong>{number(value)}</strong>
        <span>{compact ? "kcal" : `/ ${number(goal)} kcal`}</span>
      </div>
    </div>
  );
}
export function FoodEditor({
  food,
  mode,
  onSave,
  onClose,
}: {
  food?: Food;
  mode: "add" | "entry" | "favorite";
  onSave: (food: Food, favorite: boolean) => void;
  onClose: () => void;
}) {
  const initial = food || {
    id: crypto.randomUUID(),
    name: "",
    emoji: "🍽️",
    grams: 100,
    macros: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    source: "Eigene Angabe",
  };
  const [draft, setDraft] = useState(initial);
  const [favorite, setFavorite] = useState(mode === "favorite");
  const [error, setError] = useState("");
  const lastValid = useRef(initial);
  const updateGrams = (grams: number) => {
    if (grams > 0 && grams <= 10000) {
      setDraft((d) => {
        const updated = portion(d.grams > 0 ? d : lastValid.current, grams);
        lastValid.current = updated;
        return updated;
      });
    } else {
      if (draft.grams > 0) lastValid.current = draft;
      setDraft((d) => ({ ...d, grams }));
    }
  };
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!validFood(draft))
      return setError("Bitte Name, Portion und gültige Nährwerte angeben.");
    onSave(draft, favorite);
  }
  return (
    <Modal
      title={
        mode === "entry"
          ? "Eintrag bearbeiten"
          : mode === "favorite"
            ? "Favorit bearbeiten"
            : food
              ? "Portion prüfen"
              : "Eigenes Lebensmittel"
      }
      eyebrow={food?.source || "DEINE ANGABEN"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Name
          <input
            autoFocus
            value={draft.name}
            maxLength={160}
            required
            placeholder="z. B. Mein Frühstück"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <div className="portion-row">
          <span className="food-emoji big">{draft.emoji}</span>
          <label>
            Portion in Gramm
            <input
              type="number"
              min="1"
              max="10000"
              step="any"
              required
              value={draft.grams || ""}
              onChange={(e) => updateGrams(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="muted small">
          Die Nährwerte gelten für diese ganze Portion. Bei Mengenänderungen
          werden sie proportional angepasst.
        </p>
        <div className="form-grid">
          {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
            <label key={k}>
              {
                {
                  kcal: "Kalorien · kcal",
                  protein: "Protein · g",
                  carbs: "Kohlenhydrate · g",
                  fat: "Fett · g",
                }[k]
              }
              <input
                type="number"
                min="0"
                max={k === "kcal" ? 50000 : 10000}
                step="any"
                required
                value={Number(draft.macros[k].toFixed(2))}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    source: "Eigene Angabe",
                    macros: { ...draft.macros, [k]: Number(e.target.value) },
                  })
                }
              />
            </label>
          ))}
        </div>
        {mode === "add" && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
            />
            <Star size={16} /> Als Favorit speichern
          </label>
        )}
        {food?.source.includes("KI") && (
          <div className="notice">
            KI-Werte sind Schätzungen. Prüfe besonders Portion, Öl, Soßen und
            Getränke.
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary full" type="submit">
          <Check size={17} />
          {mode === "entry" || mode === "favorite"
            ? "Änderungen speichern"
            : "Zum Tagebuch hinzufügen"}
        </button>
      </form>
    </Modal>
  );
}
export function FoodSearch({
  initialQuery,
  initialTab = "local",
  favorites,
  entries,
  settings,
  onSelect,
  onManual,
  onClose,
  onSettings,
}: {
  initialQuery: string;
  initialTab?: "local" | "ai";
  favorites: Food[];
  entries: Entry[];
  settings: Settings;
  onSelect: (food: Food) => void;
  onManual: () => void;
  onClose: () => void;
  onSettings: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [quantity, setQuantity] = useState("");
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"local" | "online" | "ai">(initialTab);
  const [results, setResults] = useState<Food[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);
  const localFoods = useMemo(() => quickSearchFoods(favorites, entries), [favorites, entries]);
  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );
  let local: Food[] = [];
  try {
    local = findLocal(query, localFoods);
  } catch {
    /* Invalid portion is shown as no local match. */
  }
  function clearResults() {
    requestId.current++;
    setResults([]);
    setError("");
    setSearched(false);
  }
  async function search(e: FormEvent) {
    e.preventDefault();
    if (tab === "local") {
      if (local.length === 1) onSelect(local[0]);
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setSearched(true);
    try {
      const foods =
        tab === "online"
          ? await searchProducts(query)
          : [await estimateFood(query, settings, {
              quantity: quantity.trim() ? Number(quantity) : undefined,
              comment: comment.trim() || undefined,
            })];
      if (!foods.every(validFood))
        throw new Error(
          "Die gelieferten Nährwerte sind unvollständig. Bitte manuell eintragen.",
        );
      if (id === requestId.current) setResults(foods);
    } catch (e) {
      if (id === requestId.current) {
        setError(String(e));
        setResults([]);
      }
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }
  const foods = tab === "local" ? local : results;
  return (
    <Modal
      title="Was hast du gegessen?"
      eyebrow="SCHNELL ERFASSEN"
      onClose={onClose}
    >
      <div className="tabs" role="tablist" aria-label="Quelle">
        {(
          [
            ["local", "Schnellsuche", Star],
            ["online", "Lebensmittel", Search],
            ["ai", "Mit KI", Sparkles],
          ] as const
        ).map(([id, name, Icon]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            key={id}
            disabled={busy}
            className={tab === id ? "selected" : ""}
            onClick={() => {
              requestId.current++;
              setTab(id);
              setResults([]);
              setError("");
              setSearched(false);
            }}
          >
            <Icon size={14} />
            {name}
          </button>
        ))}
      </div>
      <form onSubmit={search} className="form-stack">
        <div className="search-form">
        <input
          autoFocus
          aria-label="Essen suchen oder beschreiben"
          maxLength={tab === "ai" ? 1600 : 120}
          value={query}
          disabled={busy}
          onChange={(e) => {
            setQuery(e.target.value);
            clearResults();
          }}
          placeholder={
            tab === "ai"
              ? "z. B. 250 g Skyr mit einer Banane"
              : tab === "online"
                ? "Produktname oder Barcode"
                : "z. B. 2 Eier, Reis gekocht oder Lidl"
          }
        />
        <button
          className="primary"
          disabled={busy || query.trim().length < 2}
          title="Suchen"
          aria-label="Suchen"
        >
          {busy ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <ArrowRight size={18} />
          )}
        </button>
        </div>
        {tab === "ai" && (
          <>
            <label>
              Anzahl insgesamt · optional
              <input
                type="number"
                min="0.01"
                max="100"
                step="any"
                value={quantity}
                disabled={busy}
                placeholder="z. B. 2"
                onChange={(e) => {
                  setQuantity(e.target.value);
                  clearResults();
                }}
              />
            </label>
            <p className="muted small">
              Gesamtzahl der gegessenen Stücke oder Portionen. Ersetzt eine
              bereits genannte Anzahl und wird nicht nochmals multipliziert.
            </p>
            <label>
              Zusatzkommentar · optional
              <input
                value={comment}
                maxLength={600}
                disabled={busy}
                placeholder="z. B. mit veganen Patties, ohne Käse"
                onChange={(e) => {
                  setComment(e.target.value);
                  clearResults();
                }}
              />
            </label>
          </>
        )}
      </form>
      {tab === "ai" && (
        <div className="notice">
          Deine Beschreibung, Anzahl und dein Zusatzkommentar werden an{" "}
          {settings.provider === "openai"
            ? "OpenAI"
            : settings.provider === "groq"
              ? "Groq"
              : "OpenRouter"}{" "}
          gesendet. Der Vorschlag wird erst nach deiner Prüfung eingetragen.{" "}
          <button className="text-button" onClick={onSettings}>
            KI einrichten
          </button>
        </div>
      )}
      {tab === "online" && (
        <p className="muted small">
          Open Food Facts · Suche erst per Klick · Ergebnisse pro 100 g, Portion
          danach wählen.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="search-results">
        {foods.map((f, i) => (
          <button
            className="food-result"
            key={`${f.id}-${i}`}
            onClick={() => onSelect(f)}
          >
            <span className="food-emoji">{f.emoji}</span>
            <div>
              <strong>{f.name}</strong>
              <small>
                {number(f.grams)} g · {number(f.macros.kcal)} kcal
              </small>
              <small className="source">{f.source}</small>
            </div>
            <Plus size={18} />
          </button>
        ))}
        {!foods.length && !busy && (tab === "local" || searched) && (
          <div className="empty small">
            {tab === "local"
              ? "Kein passendes Lebensmittel in Favoriten, Tagebuch oder Vorlagen. Suche online oder lege dein Essen selbst an."
              : "Keine vollständigen Nährwerte gefunden. Du kannst sie selbst eintragen."}
          </div>
        )}
      </div>
      <button className="secondary full" onClick={onManual}>
        <Plus size={16} /> Lebensmittel selbst anlegen
      </button>
      {tab === "online" && (
        <p className="attribution">
          Daten: Open Food Facts · ODbL · Bitte Produktetikett prüfen.
        </p>
      )}
    </Modal>
  );
}

export function SettingsPanel({
  data,
  onSave,
  onImport,
  onClose,
}: {
  data: AppData;
  onSave: (settings: Settings) => void;
  onImport: (data: AppData) => void;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState(data.settings);
  const [tab, setTab] = useState("widget");
  const [apiKey, setApiKey] = useState("");
  const [keyPresent, setKeyPresent] = useState(false);
  const [calls, setCalls] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let alive = true;
    setKeyPresent(false);
    setApiKey("");
    hasKey(settings.provider)
      .then((v) => {
        if (alive) setKeyPresent(v);
      })
      .catch((e) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, [settings.provider]);
  useEffect(() => {
    usage()
      .then((v) => setCalls(v.calls))
      .catch((e) => setError(String(e)));
  }, []);
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const checked = parseData({ ...data, settings });
      onSave(checked.settings);
    } catch (e) {
      setError(String(e));
    }
  }
  async function keyAction(remove = false) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await setKey(settings.provider, remove ? "" : apiKey);
      setKeyPresent(!remove);
      setApiKey("");
      setMessage(
        remove
          ? "API-Schlüssel entfernt."
          : "API-Schlüssel sicher in Windows gespeichert.",
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 30_000_000) throw new Error("Die Datei ist zu groß.");
      const imported = parseData(JSON.parse(await file.text()));
      onImport(imported);
    } catch (e) {
      setError(String(e));
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  return (
    <Modal title="Dein Widget" eyebrow="SO WIE DU ES MAGST" onClose={onClose}>
      <div className="tabs" role="tablist" aria-label="Einstellungen">
        {[
          ["widget", "Ansicht"],
          ["goals", "Ziele"],
          ["ai", "KI & Sprache"],
          ["data", "Daten"],
        ].map(([id, title]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "selected" : ""}
            onClick={() => {
              setTab(id);
              setError("");
              setMessage("");
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="form-stack">
        {tab === "widget" && (
          <>
            <div className="notice">
              <SlidersHorizontal size={18} /> Ziehe das kleine Symbol zum Verschieben. Ein Klick öffnet
              das Panel; ein Klick außerhalb klappt es wieder ein.
            </div>
            <Toggle
              title="Immer im Vordergrund"
              detail="Über anderen Fenstern sichtbar bleiben"
              checked={settings.alwaysOnTop}
              onChange={(v) => setSettings({ ...settings, alwaysOnTop: v })}
            />
            <Toggle
              title="Weniger Bewegung"
              detail="Sanfte, reduzierte Animationen"
              checked={settings.reducedMotion}
              onChange={(v) => setSettings({ ...settings, reducedMotion: v })}
            />
            <Toggle
              title="Freundlicher Tagesimpuls"
              detail="Hinweis im Widget ab 14 Uhr, wenn heute noch nichts erfasst wurde"
              checked={settings.reminder}
              onChange={(v) => setSettings({ ...settings, reminder: v })}
            />
          </>
        )}
        {tab === "goals" && (
          <>
            <p className="muted small">
              Passe die Tagesziele an deinen eigenen Plan an. Die Startwerte
              sind frei änderbare Beispiele.
            </p>
            <div className="form-grid">
              {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
                <label key={k}>
                  {
                    {
                      kcal: "Kalorien · kcal",
                      protein: "Protein · g",
                      carbs: "Kohlenhydrate · g",
                      fat: "Fett · g",
                    }[k]
                  }
                  <input
                    required
                    type="number"
                    min="1"
                    max={k === "kcal" ? 50000 : 10000}
                    step="any"
                    value={settings.goals[k]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        goals: {
                          ...settings.goals,
                          [k]: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <p className="muted small">
              Makros und Kalorienziel lassen sich unabhängig einstellen;
              Rundungen und Ballaststoffe können Unterschiede verursachen.
            </p>
          </>
        )}
        {tab === "ai" && (
          <>
            <label>
              Anbieter
              <select
                value={settings.provider}
                onChange={(e) => {
                  const provider = e.target.value as Settings["provider"];
                  setSettings({
                    ...settings,
                    provider,
                    model: {
                      openai: "gpt-4.1-mini",
                      groq: "llama-3.3-70b-versatile",
                      openrouter: "openai/gpt-4.1-mini",
                    }[provider],
                  });
                }}
              >
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </label>
            <label>
              Modell-ID
              <input
                required
                value={settings.model}
                maxLength={120}
                pattern="[a-zA-Z0-9_./:@\-]+"
                onChange={(e) =>
                  setSettings({ ...settings, model: e.target.value })
                }
              />
            </label>
            <p className="muted small">
              Modell frei austauschbar. Es muss Chat Completions mit JSON-Modus
              unterstützen. Verfügbarkeit und Preise hängen vom Anbieter ab.
            </p>
            <label>
              API-Schlüssel{" "}
              {keyPresent && (
                <span className="status-inline">
                  <ShieldCheck size={12} /> gespeichert
                </span>
              )}
              <input
                type="password"
                autoComplete="off"
                placeholder={
                  keyPresent
                    ? "Neuen Schlüssel hinterlegen"
                    : "API-Schlüssel einfügen"
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
            <div className="button-row">
              <button
                type="button"
                disabled={!apiKey.trim() || busy}
                className="secondary"
                onClick={() => keyAction()}
              >
                <KeyRound size={14} /> Schlüssel speichern
              </button>
              {keyPresent && (
                <IconButton
                  label="API-Schlüssel entfernen"
                  disabled={busy}
                  onClick={() => keyAction(true)}
                >
                  <Trash2 size={15} />
                </IconButton>
              )}
            </div>
            <p className="muted small">
              Schlüssel bleiben in der Windows-Anmeldeinformationsverwaltung und
              werden weder exportiert noch in Projektdateien gespeichert.
            </p>
            <label>
              KI-Anfragen pro Tag · heute {calls}
              <input
                type="number"
                min="0"
                max="100"
                value={settings.dailyLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    dailyLimit: Number(e.target.value),
                  })
                }
              />
            </label>
            <p className="muted small">
              0 deaktiviert KI-Aufrufe. Auch Spracherkennung und fehlgeschlagene
              Anfragen zählen. Maximal 700 Ausgabetokens pro Essensschätzung;
              dies ist ein Anfragelimit, kein Euro-Budget.
            </p>
            <Toggle
              title="Spracheingabe aktivieren"
              detail="Bis zu 30 Sekunden aufnehmen. Beim Stoppen wird die Aufnahme an OpenAI gesendet und nur als Text übernommen. Ein OpenAI-Schlüssel ist dafür erforderlich."
              checked={settings.speech}
              onChange={(v) => setSettings({ ...settings, speech: v })}
            />
          </>
        )}
        {tab === "data" && (
          <>
            <div className="notice">
              <ShieldCheck size={18} /> Dein Tagebuch bleibt lokal.
              Online-Anfragen starten nur durch deine Eingabe.
            </div>
            <p className="muted small">
              {data.entries.length} Einträge · {data.favorites.length}{" "}
              Favoriten. Die Windows-App und die Browser-Vorschau haben
              getrennte Speicher.
            </p>
            <button
              className="secondary full"
              type="button"
              onClick={async () => {
                setError("");
                try {
                  setMessage(await exportData(data));
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              <Download size={16} /> Sicherung exportieren
            </button>
            <button
              className="secondary full"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> Sicherung importieren und prüfen
            </button>
            <input
              ref={fileRef}
              className="visually-hidden"
              type="file"
              accept=".json,application/json"
              onChange={(e) => importFile(e.target.files?.[0])}
            />
            <p className="muted small">
              Ein Import wird vor dem Ersetzen zur Bestätigung angezeigt. Für
              „Kalorien Coach“ wird später ein bereitgestellter Chat-Export
              ausgewertet; ein automatischer Zugriff auf andere Chats besteht
              nicht.
            </p>
            {!native && (
              <p className="muted small">
                Du siehst die Browser-Vorschau. Windows-Funktionen,
                Lebensmittel-API und KI stehen in der installierten App zur
                Verfügung.
              </p>
            )}
          </>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary full" type="submit" disabled={busy}>
          <Check size={16} /> Einstellungen übernehmen
        </button>
      </form>
    </Modal>
  );
}
function Toggle({
  title,
  detail,
  checked,
  onChange,
}: {
  title: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export const blankFood = () => defaults().favorites[0];
