const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file) {
  const m = { exports: {} };
  new Function('module', 'exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(m, m.exports, n => load(path.resolve(path.dirname(file), n + '.ts')));
  return m.exports;
}
const { DriveCommands } = load('src/features/cuboAI/driveCommands.ts');
const { DriveConversation } = load('src/features/cuboAI/driveConversation.ts');
const { VoiceRoutes } = load('src/features/navigation/voiceRoutes.ts');
const data = { tripId: 't1', gpsValid: true, point: { latitude: 35, longitude: -78, timestamp: 1000 }, account: '{}', durationSeconds: 0, distanceMiles: 0, monitoring: 'Waiting' };
test('natural off variants never fall through to chat help; negative requests are not commands', () => {
  for (const q of ['Hey Cubo turn off the voice assistance', 'can you switch voice mode off for me', 'I want you to turn off voice assist now', 'please shut off voice', 'deactivate voice assistant', 'mute']) {
    const commands = new DriveCommands(() => 1000);
    assert.match(commands.answer(q, data).text, /Say yes/);
    assert.equal(commands.answer('confirm', data).stop, true);
  }
  for (const q of ['do not turn off voice assist', 'how do I turn off voice', 'turn off the camera']) {
    const commands = new DriveCommands(() => 1000);
    assert.equal(commands.answer(q, data).stop, undefined);
    assert.equal(commands.answer('confirm', data).stop, undefined);
  }
});
test('unknown voice and map questions stay short and never read chat instructions', () => {
  const c = new DriveCommands(() => 1000);
  for (const q of ['voice assistance settings please', 'my mystery thing', 'how does cubo work', 'can I do something with a road', 'my insurance', 'who are my kids', 'my family location']) {
    const answer = c.answer(q, data).text;
    assert.ok(answer.length <= 240, answer);
    assert.doesNotMatch(answer, /In chat, the microphone|This chat has no|Choose a destination in Map/);
  }
});
test('route selection requires a numbered choice and separate confirmation; cancel and trip changes clear it', () => {
  let now = 1000; const c = new DriveCommands(() => now);
  assert.equal(c.answer('could you reroute my drive', data).reroute, true);
  c.offerRoutes(['via Tryon Road, about 12 minutes', 'via Main Street, about 14 minutes']);
  assert.equal(c.acceptsFollowUp('option two'), true);
  assert.equal(c.answer('confirm', data).routeChoice, undefined);
  assert.match(c.answer('use the second route', data).text, /Switch to option 2/);
  assert.match(c.answer('take the Tryon Road way', data).text, /Switch to option 1/);
  assert.equal(c.acceptsFollowUp('take the Main Street route'), true);
  assert.match(c.answer('take the Main Street route', data).text, /Switch to option 2/);
  c.answer('my name', data);
  assert.match(c.answer('what am I confirming', data).text, /option 2/);
  assert.equal(c.answer('confirm', data).routeChoice, 1);
  assert.equal(c.answer('confirm', data).routeChoice, undefined);
  c.offerRoutes(['via A, about 1 minute']); assert.match(c.answer('option two', data).text, /Only option one/);
  c.answer('option one', data); c.answer('cancel', data); assert.equal(c.answer('confirm', data).routeChoice, undefined);
  c.offerRoutes(['via A']); c.answer('option one', data); now += 121000;
  assert.equal(c.answer('confirm', data).routeChoice, undefined);
  c.offerRoutes(['via A']); c.answer('option one', data);
  assert.equal(c.answer('confirm', { ...data, tripId: 't2' }).routeChoice, undefined);
});
test('interruption cancels playback, ignores stale completion, and resumes listening without executing echo', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let interrupt, complete, listens = 0, answers = 0;
  const c = new DriveConversation({ stop() {}, listen() { listens++; }, speak(text, done) { complete = done; }, watchInterrupt(text, callback) { interrupt = callback; } }, () => true, () => { answers++; return { text: 'answer' }; }, () => {});
  c.start(); const stale = complete; interrupt(); stale(); t.mock.timers.tick(650);
  assert.equal(listens, 1); assert.equal(answers, 0); c.stop(); interrupt(); t.mock.timers.tick(650); assert.equal(listens, 1);
  const { isVoiceInterruption } = load('src/features/cuboAI/browserVoice.ts');
  assert.equal(isVoiceInterruption('Hey Cubo stop talking', 'Your destination is home.'), true);
  assert.equal(isVoiceInterruption('stop talking', 'Say stop talking to interrupt.'), false);
  for (const phrase of ['confirm', 'yes', 'report a crash', 'turn off voice assist', 'a passenger is talking']) assert.equal(isVoiceInterruption(phrase, 'Hello'), false);
});
function route(name, offset = 0) { return { distance: 1000, duration: 120, geometry: { coordinates: [[-78, 35], [-78.01 - offset, 35.01]] }, legs: [{ steps: [{ distance: 1000, name, maneuver: { location: [-78, 35], type: 'depart' } }] }] }; }
test('reroutes use real provider names; do not mutate until confirmed; deduplicate alternatives', async () => {
  let state = { ...data, destination: { latitude: 35.01, longitude: -78.01 } }, applied = 0, url;
  const v = new VoiceRoutes(() => state, () => applied++, async u => { url = u; return { ok: true, json: async () => ({ code: 'Ok', routes: [route('Tryon Road'), route('Tryon Road'), route('Main Street', .01)] }) }; }, () => 1000);
  const s = new AbortController().signal;
  const result = await v.run(undefined, s); assert.equal(applied, 0); assert.equal(result.options.length, 2); assert.match(result.options[0], /Tryon Road/); assert.match(url, /alternatives=true/);
  assert.match((await v.run(1, s)).text, /Route updated/); assert.equal(applied, 1);
  await v.run(1, s); assert.equal(applied, 1);
});
test('reroutes refuse stale GPS, changed trips, movement and failed responses without replacing current route', async () => {
  let state = { ...data, destination: { latitude: 35.01, longitude: -78.01 } }, applied = 0;
  const fetchRoute = async () => ({ ok: true, json: async () => ({ code: 'Ok', routes: [route('A')] }) });
  for (const change of [() => state = { ...state, tripId: 'another' }, () => state = { ...state, point: { ...state.point, latitude: 36 } }, () => state = { ...state, gpsValid: false }]) {
    state = { ...data, destination: { latitude: 35.01, longitude: -78.01 } };
    const v = new VoiceRoutes(() => state, () => applied++, fetchRoute, () => 1000);
    await v.run(undefined, new AbortController().signal); change(); await v.run(0, new AbortController().signal);
    assert.equal(applied, 0);
  }
  const v = new VoiceRoutes(() => ({ ...data, destination: { latitude: 35.01, longitude: -78.01 } }), () => applied++, async () => { throw Error('offline'); }, () => 1000);
  assert.match((await v.run(undefined, new AbortController().signal)).text, /Keeping your current route/); assert.equal(applied, 0);
});
test('phone frame does not select desktop chrome on a rotated phone; native remains portrait', () => {
  const frame = fs.readFileSync('src/components/PhoneFrame.web.tsx', 'utf8');
  assert.match(frame, /phone \|\| width < 600/); assert.match(frame, /screen.orientation\?\.angle/);
  assert.match(frame, /Keep CUBO upright/);
  assert.equal(JSON.parse(fs.readFileSync('app.json', 'utf8')).expo.orientation, 'portrait');
  assert.match(fs.readFileSync('scripts/prepare-web.cjs', 'utf8'), /orientation: 'portrait'/);
});
test('late asynchronous routing response cannot restart a stopped voice session', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let input, complete, resolve, spoken = 0;
  const c = new DriveConversation({ stop() {}, listen(consent, result) { input = result; }, speak(text, done) { spoken++; complete = done; } }, () => true, () => new Promise(r => resolve = r), () => {});
  c.start(); complete(); t.mock.timers.tick(650); input('Hey Cubo reroute'); c.stop();
  resolve({ text: 'Options ready' }); await Promise.resolve(); assert.equal(spoken, 1);
});
test('browser interruption ignores confirmation echo, stops once, and releases recognition on stop', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { CuboAIVoice } = load('src/features/cuboAI/browserVoice.ts');
  const previous = global.window, previousUtterance = global.SpeechSynthesisUtterance;
  let recognition, interrupted = 0, aborted = 0;
  global.window = { SpeechRecognition: class { constructor() { recognition = this; } start() {} abort() { aborted++; } }, speechSynthesis: { cancel() {}, getVoices: () => [], speak() {} } };
  global.SpeechSynthesisUtterance = class {};
  const voice = new CuboAIVoice(() => true);
  try {
    voice.speak('Would you like to confirm?'); voice.watchInterrupt('Would you like to confirm?', () => { interrupted++; voice.stop(); });
    t.mock.timers.tick(350);
    recognition.onresult({ results: [[{ transcript: 'confirm' }]] }); assert.equal(interrupted, 0);
    const callback = recognition.onresult;
    callback({ results: [[{ transcript: 'stop talking' }]] }); callback({ results: [[{ transcript: 'stop talking' }]] });
    assert.equal(interrupted, 1); assert.ok(aborted > 0); assert.equal(recognition.onresult, null);
  } finally { voice.dispose(); global.window = previous; global.SpeechSynthesisUtterance = previousUtterance; }
});
