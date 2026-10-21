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
const data = { tripId: 'trip-a', point: { latitude: 35, longitude: -78, timestamp: 1000 }, gpsValid: true, speed: 24.2, nextTurn: 'Turn right onto Main Street', durationSeconds: 240, distanceMiles: 2.3, score: 88, monitoring: 'Monitoring active', account: JSON.stringify({ name: 'Alice', selectedVehicle: '2021 Toyota Prius', vehicleCount: 1, completedTrips: 2, averageFocusOutOf100: 83 }), details: { ready: true, home: 'Saved home', insurer: 'Example Insurance', blockedAppsReady: true, blockedAppsEnabled: true, blockedAppNames: ['Instagram', 'Telegram'], childLock: false } };
test('spoken variants reuse account answers and live facts without inference', () => {
  const c = new DriveCommands(() => 1000);
  for (const [q, expected] of [
    ['Hey Cubo, what is my vehicle selected?', /Toyota Prius/],
    ['Who are my kids?', /real linked accounts/], ['what is my name', /Alice/],
    ['child one safety score', /real linked accounts/], ['and their score', /linked person/],
    ['what is my home address', /Saved home/], ['what insurance do I have', /Example Insurance/],
    ['what road do I drive on next', /Main Street/], ['what road do I turn onto next', /Main Street/],
    ['how fast am I going', /24 miles/], ['how am I doing this drive', /88 out of 100/],
    ['how long have I driven', /4 minutes and 2.3/], ['are you listening', /Voice is on/],
    ['what apps are blocked', /Blocked Apps|Facebook and Telegram/], ['what is child lock', /family organizer/],
    ['what is my eta', /unavailable/], ['report a pothole', /Which hazard|not submitted/],
  ]) assert.match(c.answer(q, data).text, expected, q);
  const last = c.answer('my vehicle', data).text;
  assert.equal(c.answer('repeat that', data).text, last);
  assert.match(c.answer('stop listening', data).text, /Say yes/);
  assert.equal(c.answer('yes', data).stop, true);
});
test('missing data is not invented and destructive actions stay blocked', () => {
  const c = new DriveCommands();
  assert.match(c.answer('next turn', { ...data, gpsValid: false }).text, /unavailable/);
  assert.match(c.answer('my speed', { ...data, speed: undefined }).text, /unavailable/);
  assert.match(c.answer('how am i doing', { ...data, score: undefined }).text, /No measured/);
  assert.match(c.answer('end drive', data).text, /cannot/);
  assert.match(c.answer('and their score', data).text, /linked person/);
});
test('confirmation survives long speech, respond repair and controller restart within a drive', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let now = 1000, input, done, reports = 0;
  const memory = new DriveCommands(() => now);
  const speech = { stop() {}, listen(consent, result) { input = result; }, speak(text, complete) { done = complete; } };
  const controller = () => new DriveConversation(speech, () => true, text => { const r = memory.answer(text, data); if (r.report) reports++; return r; }, () => {}, () => now, memory);
  let c = controller(); c.start(); done(); t.mock.timers.tick(650);
  input('Hey Cubo report a crash'); now += 40000; done(); t.mock.timers.tick(650);
  now += 25000; // Beyond normal follow-up window, but pending confirmation is still accepted.
  input('Hey Cubo respond'); assert.match(memory.answer('what am i confirming', data).text, /crash/);
  done(); t.mock.timers.tick(650); c.stop();
  c = controller(); c.start(); done(); t.mock.timers.tick(650);
  input('confirm'); assert.equal(reports, 1); done(); t.mock.timers.tick(650);
  input('confirm'); assert.equal(reports, 1); c.stop();
  assert.equal(memory.answer('confirm', { ...data, tripId: 'new-drive' }).report, undefined);
});
test('spoken off confirm works after respond and no wake word beyond ordinary follow-up window', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let now = 1000, input, done, on = false;
  const memory = new DriveCommands(() => now);
  const c = new DriveConversation({ stop() {}, listen(consent, r) { input = r; }, speak(text, d) { done = d; } }, () => true, text => memory.answer(text, data), active => on = active, () => now, memory);
  c.start(); done(); t.mock.timers.tick(650); input('Hey Cubo turn off voice assist');
  now += 35000; done(); t.mock.timers.tick(650); now += 25000;
  input('confirm'); done(); assert.equal(on, false); c.stop();
});
test('navigation follows route context, destination, approximate ETA and history without a model', () => {
  const c = new DriveCommands(() => 1000);
  const route = { ...data, routeId: 'route-a', routeIndex: 0, routeSteps: ['Turn right on A', 'Turn left on B', 'Arrive at Library'], destination: 'Library', remainingSeconds: 600, remainingMiles: 4.5, history: [{ role: 'user', text: 'Who are my kids?' }] };
  assert.match(c.answer('next turn', route).text, /right on A/);
  assert.match(c.answer('and after that', route).text, /left on B/);
  assert.match(c.answer('what then', route).text, /Library/);
  assert.match(c.answer('my final destination', route).text, /Library/);
  assert.match(c.answer('estimated time of arrival', route).text, /10 minutes and 4.5 miles/);
  assert.match(c.answer('when will I get there', { ...route, gpsValid: false }).text, /unavailable/);
  assert.match(c.answer('what did I ask earlier', route).text, /Who are my kids/);
  assert.match(c.answer('next turn', { ...route, routeId: 'reroute', routeSteps: ['Turn onto C'] }).text, /onto C/);
});
test('remaining route estimate uses projected geometry and refuses off-route position', () => {
  const { remainingRoute } = load('src/features/navigation/remainingRoute.ts');
  const route = { coordinates: [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: .02 }], distanceMeters: 2224, durationSeconds: 200, steps: [] };
  const half = remainingRoute(route, { latitude: 0, longitude: .01 });
  assert.ok(Math.abs(half.seconds - 100) < .01);
  assert.equal(remainingRoute(route, { latitude: 1, longitude: .01 }), undefined);
  assert.equal(remainingRoute(null, null), undefined);
});
test('transcript is bounded, locally recovered, account-synced and never added to family payload', () => {
  const { appendVoiceTurn, MAX_TRANSCRIPT_CHARS } = load('src/features/drives/voiceTranscript.ts');
  const { recoverCheckpoint } = load('src/features/drives/driveCheckpoint.ts');
  let trip = { id: 'test', durationSeconds: 12, voiceTranscript: [] };
  trip = appendVoiceTurn(trip, 'user', 'Report crash'); trip = appendVoiceTurn(trip, 'assistant', 'Confirm?');
  assert.equal(recoverCheckpoint({ version: 1, sessions: [], active: trip, savedAt: 'now' })[0].voiceTranscript.length, 2);
  for (let i = 0; i < 1000; i++) trip = appendVoiceTurn(trip, 'user', 'x'.repeat(1200));
  assert.equal(trip.voiceTranscriptLimited, true); assert.ok(JSON.stringify(trip.voiceTranscript).length <= MAX_TRANSCRIPT_CHARS);
  const source = fs.readFileSync('src/features/drives/DriveContext.tsx', 'utf8');
  const payload = source.match(/const drives = sessions[\s\S]*?familyRequest\('\/family\/drives', \{ drives \}\)/)[0];
  assert.doesNotMatch(payload, /voiceTranscript/);
  assert.match(source, /domain: 'drives'/);
  assert.match(source, /activeSession\?\.id, owner, user\?\.uid/);
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
  assert.equal(c.answer('yes', data).report.kind, 'crash');
  c.answer('report police', data);
  assert.equal(c.answer('confirm', { ...data, tripId: 'trip-b' }).report, undefined);
  c.answer('report debris', data); c.readyForReply(); now = 62000;
  assert.equal(c.answer('confirm', data).report, undefined);
  assert.match(c.answer('report debris', data).text, /fresh GPS/);
  now = 1000;
  assert.match(c.answer('report a hazard', data).text, /Which hazard/);
  assert.match(c.answer('object', data).text, /Say confirm/);
  assert.equal(c.answer('yes', data).report.kind, 'object');
});
test('voice stays on past 60 seconds, silence restarts, wake phrase gates idle conversation', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let active = false, result, end, complete, now = 1000, count = 0;
  const c = new DriveConversation({ stop() {}, listen(consent, r, error, e) { result = r; end = e; }, speak(text, done) { complete = done; } }, () => true, () => { count++; return { text: 'Reply' }; }, value => active = value, () => now);
  c.start(); assert.equal(active, true); complete(); t.mock.timers.tick(650);
  now += 61000; t.mock.timers.tick(61000); assert.equal(active, true);
  end(); t.mock.timers.tick(650); assert.equal(active, true);
  result('unrelated passenger speech'); assert.equal(count, 0); t.mock.timers.tick(650);
  result('Hey Cubo what is my vehicle'); assert.equal(count, 1);
  complete(); t.mock.timers.tick(650); result('and my kids'); assert.equal(count, 2);
  c.stop(); complete(); t.mock.timers.tick(650); assert.equal(active, false);
});
test('conversation alternates listen and speak, stops on errors and ignores stale results', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let input, done, failed, ended, error, listens = 0, allowed = true, answers = 0;
  const states = [];
  const speech = { stop() {}, listen(consent, result, onerror, onend) { assert.equal(consent, true); listens++; input = result; error = onerror; ended = onend; }, speak(text, complete, failure) { done = complete; failed = failure; } };
  const c = new DriveConversation(speech, () => allowed, text => { answers++; return { text: 'Reply', stop: text === 'turn off voice' }; }, (on, text) => states.push([on, text]));
  try {
    c.start(); assert.equal(listens, 0); done(); t.mock.timers.tick(650); assert.equal(listens, 1);
    input('hello'); ended(); assert.equal(listens, 1); // no microphone during speech
    done(); t.mock.timers.tick(650); assert.equal(listens, 2);
    input('turn off voice'); done(); assert.equal(states.at(-1)[0], false);
    const old = input; old('late callback'); assert.equal(answers, 2);
    c.start(); done(); t.mock.timers.tick(650); error('permission denied'); assert.equal(states.at(-1)[0], false);
    c.start(); done(); t.mock.timers.tick(650); input('hello'); failed(); assert.match(states.at(-1)[1], /audio unavailable/);
    c.start(); done(); t.mock.timers.tick(650); allowed = false; input('late'); assert.equal(answers, 3);
  } finally { c.stop(); }
});
test('spoken off variants require fresh confirmation, never conflict with hazard confirmation', () => {
  let now = 1000;
  for (const q of ['Hey Cubo turn off voice assist', 'please turn voice assistant off', 'could you disable voice assist please', 'stop listening', 'mute yourself']) {
    const c = new DriveCommands(() => now);
    c.answer('report debris', data);
    assert.match(c.answer(q, data).text, /Say yes/);
    const result = c.answer('yes', data); assert.equal(result.stop, true); assert.equal(result.report, undefined);
  }
  const c = new DriveCommands(() => now);
  c.answer('turn off voice assist', data); assert.match(c.answer('no', data).text, /still on/);
  c.answer('turn off voice assist', data); c.readyForReply(); now += 61000; assert.equal(c.answer('yes', data).stop, undefined);
  assert.match(c.answer('Hey Kubo could you tell me my first child score please', data).text, /real linked accounts/);
  assert.match(c.answer('what automobile do I have', data).text, /Toyota Prius/);
});
test('consent is once per account and drive, including remount, without auto-enabling', () => {
  const { driveConsent } = load('src/features/cuboAI/driveConsent.ts');
  const map = new Map(); const store = { getItem: k => map.get(k), setItem: (k,v) => map.set(k,v) };
  const a = driveConsent(store, 'a', 'trip-1'); assert.equal(a.accepted(), false); a.accept();
  assert.equal(a.accepted(), true); assert.equal(driveConsent(store, 'a', 'trip-1').accepted(), true);
  assert.equal(driveConsent(store, 'a', 'trip-2').accepted(), false);
  assert.equal(driveConsent(store, 'b', 'trip-1').accepted(), false);
  const blocked = driveConsent(undefined, 'a', 'trip-1'); blocked.accept(); assert.equal(blocked.accepted(), true);
});
test('silent or stuck speech fails visibly rather than leaving green icon forever', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { CuboAIVoice } = load('src/features/cuboAI/browserVoice.ts');
  const previous = global.window, previousUtterance = global.SpeechSynthesisUtterance;
  let failed = false;
  global.window = { speechSynthesis: { cancel() {}, getVoices: () => [], speak() {}, resume() {} } };
  global.SpeechSynthesisUtterance = class {};
  const voice = new CuboAIVoice(() => true);
  try { voice.speak('Hello', assert.fail, () => failed = true); t.mock.timers.tick(10000); assert.equal(failed, true); }
  finally { voice.dispose(); global.window = previous; global.SpeechSynthesisUtterance = previousUtterance; }
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
