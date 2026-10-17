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
const data = { tripId: 'trip-a', point: { latitude: 35, longitude: -78, timestamp: 1000 }, gpsValid: true, speed: 24.2, nextTurn: 'Turn right onto Main Street', durationSeconds: 240, distanceMiles: 2.3, score: 88, monitoring: 'Monitoring active', account: JSON.stringify({ name: 'Alice', selectedVehicle: '2021 Toyota Prius', vehicleCount: 1, completedTrips: 2, averageFocusOutOf100: 83 }), details: { ready: true, home: 'Saved home', insurer: 'Example Insurance' } };
test('spoken variants reuse account answers and live facts without inference', () => {
  const c = new DriveCommands(() => 1000);
  for (const [q, expected] of [
    ['Hey Cubo, what is my vehicle selected?', /Toyota Prius/],
    ['Who are my kids?', /Child 1 and Child 2/], ['what is my name', /Alice/],
    ['child one safety score', /89\/100/], ['and their score', /89\/100/],
    ['what is my home address', /Saved home/], ['what insurance do I have', /Example Insurance/],
    ['what road do I drive on next', /Main Street/], ['what road do I turn onto next', /Main Street/],
    ['how fast am I going', /24 miles/], ['how am I doing this drive', /88 out of 100/],
    ['how long have I driven', /4 minutes and 2.3/], ['are you listening', /Voice is on/],
    ['what is my eta', /not connected/], ['report a pothole', /Which hazard|not submitted/],
  ]) assert.match(c.answer(q, data).text, expected, q);
  const last = c.answer('my vehicle', data).text;
  assert.equal(c.answer('repeat that', data).text, last);
  assert.equal(c.answer('stop listening', data).stop, true);
});
test('missing data is not invented and destructive actions stay blocked', () => {
  const c = new DriveCommands();
  assert.match(c.answer('next turn', { ...data, gpsValid: false }).text, /unavailable/);
  assert.match(c.answer('my speed', { ...data, speed: undefined }).text, /unavailable/);
  assert.match(c.answer('how am i doing', { ...data, score: undefined }).text, /No measured/);
  assert.match(c.answer('end drive', data).text, /cannot/);
  assert.match(c.answer('and their score', data).text, /Which demo/);
});
test('hazards require confirmation, fresh coordinates and same trip; save original location once', () => {
  let now = 1000; const c = new DriveCommands(() => now);
  assert.equal(c.answer('report an object on the road here', data).report, undefined);
  const saved = c.answer('confirm', { ...data, point: { ...data.point, latitude: 36 } }).report;
  assert.equal(saved.kind, 'object'); assert.equal(saved.point.latitude, 35);
  assert.equal(c.answer('yes', data).report, undefined);
  c.answer('report debris', data); c.answer('cancel', data);
  assert.equal(c.answer('confirm', data).report, undefined);
  c.answer('report crash', data); c.answer('my vehicle', data);
  assert.equal(c.answer('yes', data).report, undefined);
  c.answer('report police', data);
  assert.equal(c.answer('confirm', { ...data, tripId: 'trip-b' }).report, undefined);
  c.answer('report debris', data); now = 22000;
  assert.equal(c.answer('confirm', data).report, undefined);
  assert.match(c.answer('report debris', data).text, /fresh GPS/);
  now = 1000;
  assert.match(c.answer('report a hazard', data).text, /Which hazard/);
  assert.match(c.answer('object', data).text, /Say confirm/);
  assert.equal(c.answer('yes', data).report.kind, 'object');
});
test('conversation has a hard 60-second limit even with ongoing speech', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let active = false;
  const c = new DriveConversation({ stop() {}, listen() {}, speak() {} }, () => true, () => ({ text: '' }), value => active = value);
  c.start(); assert.equal(active, true);
  t.mock.timers.tick(60000); assert.equal(active, false); c.stop();
});
test('conversation alternates listen and speak, stops on silence/errors and ignores stale results', () => {
  let input, done, failed, ended, error, listens = 0, allowed = true, answers = 0;
  const states = [];
  const speech = { stop() {}, listen(consent, result, onerror, onend) { assert.equal(consent, true); listens++; input = result; error = onerror; ended = onend; }, speak(text, complete, failure) { done = complete; failed = failure; } };
  const c = new DriveConversation(speech, () => allowed, text => { answers++; return { text: 'Reply', stop: text === 'stop' }; }, (on, text) => states.push([on, text]));
  try {
    c.start(); assert.equal(listens, 1);
    input('hello'); ended(); assert.equal(listens, 1); // no microphone during speech
    done(); assert.equal(listens, 2);
    input('stop'); done(); assert.equal(states.at(-1)[0], false);
    const old = input; old('late callback'); assert.equal(answers, 2);
    c.start(); ended(); assert.match(states.at(-1)[1], /no speech/);
    c.start(); error('permission denied'); assert.equal(states.at(-1)[0], false);
    c.start(); input('hello'); failed(); assert.match(states.at(-1)[1], /playback unavailable/);
    c.start(); allowed = false; input('late'); assert.equal(answers, 3);
  } finally { c.stop(); }
});
test('browser voice stops recognition BEFORE dispatching the command and honors selected output', () => {
  const { CuboAIVoice } = load('src/features/cuboAI/browserVoice.ts');
  const previous = global.window, previousUtterance = global.SpeechSynthesisUtterance;
  let recognition, utterance, aborted = false, completed = false;
  global.window = { SpeechRecognition: class { constructor() { recognition = this; } start() {} abort() { aborted = true; } }, speechSynthesis: { cancel() {}, getVoices: () => [{ voiceURI: 'chosen', lang: 'en-US' }], speak: u => { utterance = u; } } };
  global.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  const voice = new CuboAIVoice(() => true, () => 'chosen');
  try {
    voice.listen(true, text => { assert.equal(aborted, true); voice.speak(text, () => completed = true); }, assert.fail);
    recognition.onresult({ results: [[{ transcript: 'hello' }]] });
    assert.equal(utterance.voice.voiceURI, 'chosen');
    assert.equal(typeof utterance.onend, 'function'); utterance.onend(); assert.equal(completed, true);
    voice.speak('cancel me'); voice.stop(); assert.equal(utterance.onend, null);
  } finally { voice.dispose(); global.window = previous; global.SpeechSynthesisUtterance = previousUtterance; }
});
