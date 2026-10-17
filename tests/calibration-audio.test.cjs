const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function moduleIn(file, globals) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module, exports: module.exports, setTimeout, clearTimeout, ...globals });
  return module.exports;
}
function browser() {
  const spoken = [], timers = new Map(); let next = 0, cancelled = 0;
  const context = { window: { speechSynthesis: { speak: u => spoken.push(u), cancel: () => cancelled++, resume() {} } },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    setTimeout: fn => { timers.set(++next, fn); return next; }, clearTimeout: id => timers.delete(id) };
  const { AttentionAudio } = moduleIn('src/features/attention/attentionAudio.ts', context);
  return { audio: new AttentionAudio(), spoken, timers, cancelled: () => cancelled };
}
test('web speaks the actual alert and releases it on completion', async () => {
  const h = browser(); const done = h.audio.speak('Distraction detected. Look forward again.');
  assert.equal(h.spoken[0].text, 'Distraction detected. Look forward again.');
  assert.equal(h.spoken[0].volume, 1);
  h.spoken[0].onend(); await done; assert.equal(h.timers.size, 0);
});
test('web reports blocked audio instead of silently succeeding', async () => {
  const h = browser(); const done = h.audio.speak('Test').catch(error => error.message);
  h.spoken[0].onerror(); assert.match(await done, /Audio could not play/);
  assert.equal(h.timers.size, 0);
});
test('web cancels a stale prompt and cannot speak after leaving calibration', async () => {
  const h = browser(); const old = h.audio.speak('Old').catch(error => error.message);
  const current = h.audio.speak('New').catch(error => error.message);
  assert.match(await old, /stopped/); assert.equal(h.timers.size, 1);
  h.audio.dispose(); assert.match(await current, /stopped/);
  assert.equal(h.timers.size, 0); assert.equal(h.cancelled(), 2);
  await assert.rejects(h.audio.speak('Late'), /unavailable/);
});
test('web times out audio that never starts', async () => {
  const h = browser(); const done = h.audio.speak('Test').catch(error => error.message);
  [...h.timers.values()][0](); assert.match(await done, /did not finish/); assert.equal(h.timers.size, 0);
});
test('native uses real speech without accessibility or microphone dependencies', async () => {
  const spoken = [], timers = new Map(); let next = 0;
  const speech = { stop: () => Promise.resolve(), speak: (text, options) => spoken.push({ text, options }) };
  const { AttentionAudio } = moduleIn('src/features/attention/attentionAudio.native.ts', {
    require: name => { assert.equal(name, 'expo-speech'); return speech; },
    setTimeout: fn => { timers.set(++next, fn); return next; }, clearTimeout: id => timers.delete(id),
  });
  const audio = new AttentionAudio();
  const done = audio.speak('Look forward again.');
  await Promise.resolve(); await Promise.resolve();
  assert.equal(spoken[0].text, 'Look forward again.');
  spoken[0].options.onDone(); await done; assert.equal(timers.size, 0);
  const stale = audio.speak('Do not play').catch(error => error.message);
  audio.dispose(); await Promise.resolve();
  assert.match(await stale, /stopped/); assert.equal(spoken.length, 1); assert.equal(timers.size, 0);
});

test('native cannot start a timed-out alert after a delayed speech engine stop', async () => {
  const spoken = [], stops = [], timers = new Map(); let next = 0;
  const speech = { stop: () => new Promise(resolve => stops.push(resolve)), speak: text => spoken.push(text) };
  const { AttentionAudio } = moduleIn('src/features/attention/attentionAudio.native.ts', {
    require: () => speech,
    setTimeout: fn => { timers.set(++next, fn); return next; }, clearTimeout: id => timers.delete(id),
  });
  const audio = new AttentionAudio();
  const done = audio.speak('Expired alert').catch(error => error.message);
  [...timers.values()][0]();
  assert.match(await done, /did not finish/);
  stops.forEach(resolve => resolve());
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(spoken, [], 'A delayed engine must not speak after the UI reports timeout');
  audio.dispose();
});
