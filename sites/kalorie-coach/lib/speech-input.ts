export type SpeechState = 'idle' | 'starting' | 'listening' | 'stopping';
export type RecognitionResult = { isFinal: boolean; [index: number]: { transcript: string } };
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type RecognitionConstructor = new () => Recognition;

const errors: Record<string, string> = {
  'not-allowed': 'Mikrofonzugriff gesperrt. Erlaube das Mikrofon in den Website-Einstellungen von Chrome und versuche es erneut.',
  'service-not-allowed': 'Die Spracherkennung ist im Browser gesperrt. Nutze alternativ das Mikrofon deiner Bildschirmtastatur.',
  'audio-capture': 'Kein Mikrofon verfügbar. Prüfe, ob eine andere App es verwendet.',
  'no-speech': 'Keine Sprache erkannt. Tippe auf „Einsprechen“ und versuche es erneut.',
  network: 'Die Spracherkennung ist nicht erreichbar. Prüfe deine Internetverbindung und versuche es erneut.',
  'language-not-supported': 'Deutsche Spracherkennung ist in diesem Browser nicht verfügbar. Nutze das Mikrofon deiner Bildschirmtastatur.',
};

// One user-initiated session. Never restart automatically or submit a meal.
export function speechSession(Engine: RecognitionConstructor, initialText: string, callbacks: {
  text: (value: string) => void;
  state: (value: SpeechState) => void;
  message: (value: string) => void;
}, maxLength = 1600) {
  const recognition = new Engine();
  recognition.lang = 'de-DE';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  let closed = false, stopping = false, heard = false, failed = false;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let stopDeadline: ReturnType<typeof setTimeout> | undefined;
  function finish(notify = true) {
    if (closed) return;
    closed = true;
    clearTimeout(deadline);
    clearTimeout(stopDeadline);
    recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
    if (notify) callbacks.state('idle');
  }
  function stop() {
    if (closed || stopping) return;
    stopping = true;
    callbacks.state('stopping');
    // Keep accepting final results until onend; ignore any events after teardown.
    stopDeadline = setTimeout(() => { finish(); try { recognition.abort(); } catch {} }, 5000);
    try { recognition.stop(); } catch { finish(); try { recognition.abort(); } catch {} }
  }
  recognition.onstart = () => { if (!closed && !stopping) callbacks.state('listening'); };
  recognition.onresult = ({ results }) => {
    if (closed) return;
    // Results include earlier final segments; rebuild instead of appending each event.
    const spoken = Array.from(results, result => result[0]?.transcript.trim() || '').filter(Boolean).join(' ');
    if (!spoken) return;
    heard = true;
    const value = [initialText.trimEnd(), spoken].filter(Boolean).join(' ');
    callbacks.text(value.slice(0, maxLength));
    if (value.length >= maxLength) {
      callbacks.message('Textlimit erreicht. Bitte die Beschreibung prüfen und bei Bedarf kürzen.');
      stop();
    }
  };
  recognition.onerror = ({ error }) => {
    if (closed) return;
    failed = true;
    if (error !== 'aborted') callbacks.message(errors[error] || 'Spracheingabe fehlgeschlagen. Versuche es erneut oder tippe deine Mahlzeit ein.');
    finish();
    try { recognition.abort(); } catch {}
  };
  recognition.onend = () => {
    if (closed) return;
    if (!heard && !failed) callbacks.message(errors['no-speech']);
    finish();
  };
  return {
    start() {
      if (closed) return;
      callbacks.state('starting');
      deadline = setTimeout(stop, 60000);
      try { recognition.start(); } catch {
        callbacks.message('Das Mikrofon konnte nicht gestartet werden. Bitte erneut versuchen.');
        finish();
        try { recognition.abort(); } catch {}
      }
    },
    stop,
    cancel(notify = true) { finish(notify); try { recognition.abort(); } catch {} },
  };
}
