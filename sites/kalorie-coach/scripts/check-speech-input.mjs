import assert from 'node:assert/strict';
import { speechSession } from '../lib/speech-input.ts';

class Engine {
  static current;
  constructor() { Engine.current = this; }
  start() { this.onstart?.(); }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }
  result(...segments) { this.onresult?.({ results: segments.map(([transcript, isFinal]) => ({ 0: { transcript }, isFinal })) }); }
}
function setup(initial = '', maxLength = 1600, Class = Engine) {
  const texts = [], states = [], messages = [];
  const session = speechSession(Class, initial, { text: x => texts.push(x), state: x => states.push(x), message: x => messages.push(x) }, maxLength);
  session.start();
  return { session, engine: Engine.current, texts, states, messages };
}

// Chrome repeats prior final results and revises interim results. Preserve typed text.
{
  const x = setup('Frühstück:');
  x.engine.result(['250 Gramm', false]);
  x.engine.result(['250 Gramm Skyr', true], ['und eine', false]);
  x.engine.result(['250 Gramm Skyr', true], ['und eine Banane', true]);
  assert.equal(x.texts.at(-1), 'Frühstück: 250 Gramm Skyr und eine Banane');
  x.session.stop();
  assert.equal(x.states.at(-1), 'stopping');
  x.engine.result(['250 Gramm Skyr', true], ['und zwei Bananen', true]);
  x.engine.onend();
  assert.equal(x.texts.at(-1), 'Frühstück: 250 Gramm Skyr und zwei Bananen');
  assert.equal(x.states.at(-1), 'idle');
  assert.equal(x.engine.onresult, null);
}
// A new dictation appends to the previous completed text.
{
  const x = setup('250 Gramm Skyr');
  x.engine.result(['und Honig', true]);
  assert.equal(x.texts[0], '250 Gramm Skyr und Honig');
  x.session.cancel();
}
// Closing/switching/backgrounding invalidates even already queued callbacks.
{
  const x = setup();
  const lateResult = x.engine.onresult;
  x.session.cancel(false);
  lateResult({ results: [{ 0: { transcript: 'Nicht übernehmen' }, isFinal: true }] });
  assert.equal(x.engine.aborted, true);
  assert.deepEqual(x.texts, []);
}
// A denied microphone leaves the session idle and permits a new attempt.
{
  const x = setup();
  x.engine.onerror({ error: 'not-allowed' });
  assert.match(x.messages.at(-1), /Mikrofonzugriff gesperrt/);
  assert.equal(x.states.at(-1), 'idle');
  assert.equal(x.engine.aborted, true);
}
// Silence produces actionable feedback, never empty meal submission.
{
  const x = setup('Bereits getippt');
  x.engine.onend();
  assert.deepEqual(x.texts, []);
  assert.match(x.messages[0], /Keine Sprache erkannt/);
}
// Spoken text obeys the same limit as manual text; input is retained on failure.
{
  const x = setup('12345', 10);
  x.engine.result(['6789012345', true]);
  assert.equal(x.texts.at(-1), '12345 6789');
  assert.equal(x.engine.stopped, true);
  x.engine.onerror({ error: 'network' });
  assert.equal(x.states.at(-1), 'idle');
  assert.equal(x.texts.at(-1), '12345 6789');
}
// Synchronous browser start failures also release the active state.
{
  class BrokenEngine extends Engine { start() { throw new Error('blocked'); } }
  const x = setup('', 1600, BrokenEngine);
  assert.equal(x.states.at(-1), 'idle');
  assert.equal(x.engine.aborted, true);
}
console.log('Speech input: 7 scenarios passed.');
