'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, Mic, Square } from 'lucide-react';
import { speechSession } from '../lib/speech-input';
import type { RecognitionConstructor, SpeechState } from '../lib/speech-input';

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

export default function MealDescription({ value, onChange, onActivityChange, optional, disabled }: {
  value: string;
  onChange: (text: string) => void;
  onActivityChange: (active: boolean) => void;
  optional: boolean;
  disabled: boolean;
}) {
  const id = useId();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<SpeechState>('idle');
  const [message, setMessage] = useState('');
  const engine = useRef<RecognitionConstructor | undefined>(undefined);
  const session = useRef<ReturnType<typeof speechSession> | null>(null);
  const callbacks = useRef({ onChange, onActivityChange });
  callbacks.current = { onChange, onActivityChange };
  const active = state !== 'idle';

  useEffect(() => {
    const browser = window as SpeechWindow;
    engine.current = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    setSupported(!!engine.current && window.isSecureContext);
    const leave = () => session.current?.cancel();
    const hide = () => {
      if (document.visibilityState === 'hidden') session.current?.cancel();
    };
    window.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', hide);
    return () => {
      session.current?.cancel(false);
      callbacks.current.onActivityChange(false);
      window.removeEventListener('pagehide', leave);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  function toggle() {
    if (session.current) {
      if (state === 'starting') session.current.cancel();
      else session.current.stop();
      return;
    }
    if (!engine.current || !supported || disabled) return;
    setMessage('');
    try {
      const next = speechSession(engine.current, value, {
        text: text => callbacks.current.onChange(text),
        state: nextState => {
          setState(nextState);
          callbacks.current.onActivityChange(nextState !== 'idle');
          if (nextState === 'idle') session.current = null;
        },
        message: setMessage,
      });
      session.current = next;
      next.start();
    } catch {
      setMessage('Spracheingabe konnte nicht gestartet werden. Nutze alternativ das Mikrofon deiner Bildschirmtastatur.');
    }
  }

  return <div className="meal-description">
    <label htmlFor={id}>{optional ? 'Details ergänzen (optional)' : 'Beschreibe deine Mahlzeit'}</label>
    <textarea id={id} value={value} maxLength={1600} rows={3} readOnly={active} disabled={disabled}
      aria-describedby={`${id}-status ${id}-hint`} aria-busy={active}
      onChange={event => { setMessage(''); onChange(event.target.value); }}
      placeholder="z. B. 250 g Skyr, eine Banane und etwas Honig" />
    <div className="speech-toolbar">
      <button type="button" className={`secondary speech-button${active ? ' recording' : ''}`}
        disabled={disabled || supported !== true || state === 'stopping'} aria-pressed={active} onClick={toggle}>
        {state === 'starting' || state === 'stopping' ? <LoaderCircle className="spin" size={18}/> : active ? <Square size={17}/> : <Mic size={19}/>}
        {state === 'starting' ? 'Abbrechen' : state === 'listening' ? 'Stopp' : state === 'stopping' ? 'Wird beendet …' : 'Einsprechen'}
      </button>
      <span id={`${id}-status`} role="status" className="speech-status">
        {state === 'starting' ? 'Mikrofon wird gestartet …' : state === 'listening' ? 'Ich höre zu …' : state === 'stopping' ? 'Text wird übernommen …' : 'Tippen oder sprechen'}
      </span>
    </div>
    <p id={`${id}-hint`} className="muted small">
      {supported === false ? 'Hier ist die Browser-Spracheingabe nicht verfügbar. Nutze das Mikrofon deiner Bildschirmtastatur oder tippe deinen Text.' : 'Deutsch · Text vor der Analyse prüfen. Die Spracherkennung deines Browsers kann einen Onlinedienst verwenden.'}
    </p>
    {message && <p className="notice" role="alert">{message}</p>}
  </div>;
}
