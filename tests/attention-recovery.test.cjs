const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }; new Function('module', 'exports', output)(module, module.exports); return module.exports;
}
const { calibrate, advanceAttention, emptyAttention, faceMetrics } = load('src/features/attention/attentionPolicy.ts');
const { recoverCheckpoint } = load('src/features/drives/driveCheckpoint.ts');
const sample = (at, changes = {}) => ({ at, face: true, yaw: 0, pitch: 0, eyes: .3, width: .4, x: .5, y: .5, ...changes });
const baseline = { yaw: 0, pitch: 0, eyes: .3, version: 1 };
test('native bridge and web use identical landmark measurements without Function.toString', () => {
  const { nativeDetectorHtml } = load('src/features/attention/nativeDetectorHtml.ts');
  const body = nativeDetectorHtml.match(/const metrics = ([\s\S]+?);\ntry/)[1];
  const nativeMetrics = new Function(`return (${body})`)();
  for (let n = 0; n < 12; n++) {
    const points = Array.from({ length: 478 }, (_, i) => ({ x: ((i * 13 + n) % 100) / 100, y: ((i * 23 + n) % 100) / 100 }));
    for (const aspect of [.5625, .75, 1, 1.333, 1.777]) assert.deepEqual(nativeMetrics(points, aspect), faceMetrics(points, aspect));
  }
});
test('calibration needs fresh stable eyes-open samples over real elapsed time', () => {
  const samples = Array.from({ length: 8 }, (_, i) => sample(1000 + i * 450));
  assert.deepEqual(calibrate(samples), baseline);
  for (const bad of [samples.slice(0, 3), samples.map(s => ({ ...s, face: false })), samples.map(s => ({ ...s, eyes: .05 })), samples.map(s => ({ ...s, at: 1 })), samples.map((s, i) => ({ ...s, yaw: i % 2 ? .4 : 0 }))]) assert.throws(() => calibrate(bad));
});
test('brief glance or blink does not generate an alert', () => {
  let state = emptyAttention();
  for (let at = 1000; at <= 1800; at += 200) { const next = advanceAttention(state, sample(at, { eyes: .05 }), baseline, true); assert.equal(next.event, null); state = next.state; }
  assert.equal(advanceAttention(state, sample(2000), baseline, true).event, null);
});
test('sustained eye closure emits once per episode and can alert after recovery', () => {
  let state = emptyAttention(), events = 0;
  for (let at = 1000; at <= 6000; at += 200) { const next = advanceAttention(state, sample(at, { eyes: .05 }), baseline, true); if (next.event) { assert.equal(next.event.kind, 'eyes_closed'); events++; } state = next.state; }
  assert.equal(events, 1);
  state = advanceAttention(state, sample(6200), baseline, true).state;
  for (let at = 6400; at <= 9000; at += 200) { const next = advanceAttention(state, sample(at, { eyes: .05 }), baseline, true); if (next.event) events++; state = next.state; }
  assert.equal(events, 2);
});
test('missing faces, stopped vehicles, missing calibration and long gaps never inflate score or dwell', () => {
  const start = advanceAttention(emptyAttention(), sample(1000), baseline, true).state;
  for (const [s, b, moving] of [[sample(1200, { face: false }), baseline, true], [sample(1200), null, true], [sample(1200), baseline, false]]) {
    const next = advanceAttention(start, s, b, moving); assert.equal(next.state.measuredMs, 0); assert.equal(next.event, null);
  }
  assert.equal(advanceAttention(start, sample(10000, { yaw: .4 }), baseline, true).state.measuredMs, 0);
});
test('sustained head turn is logged and score reflects only observed moving time', () => {
  let state = emptyAttention(), events = [];
  for (let at = 1000; at <= 6000; at += 200) { const next = advanceAttention(state, sample(at, { yaw: at < 3000 ? 0 : .3 }), baseline, true); if (next.event) events.push(next.event); state = next.state; }
  assert.equal(events.length, 1); assert.equal(events[0].kind, 'looking_away'); assert.equal(state.measuredMs, 5000); assert.ok(state.attentiveMs > 0 && state.attentiveMs < state.measuredMs);
});
test('invalid landmarks are unavailable instead of safe', () => { assert.equal(faceMetrics(undefined).face, false); assert.equal(faceMetrics([]).face, false); });
test('recovery finishes only the interrupted trip without counting offline time or duplicating it', () => {
  const trip = { id: 'a', durationSeconds: 42, route: [], events: [] };
  const result = recoverCheckpoint({ version: 1, active: trip, sessions: [], savedAt: '2026-10-17T00:00:00Z' });
  assert.equal(result[0].durationSeconds, 42); assert.equal(result[0].interrupted, true); assert.ok(result[0].endedAt);
  assert.equal(recoverCheckpoint({ version: 1, active: trip, sessions: result }).length, 1);
  assert.deepEqual(recoverCheckpoint({ version: 1, active: null, sessions: [] }), []);
});
test('email updates stay owned, match Auth identity and require verification for changed addresses', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert.match(rules, /allow update: if \(isOwner\(userId\)/);
  assert.match(rules, /request.resource.data.email == request.auth.token.email/);
  assert.match(rules, /request.resource.data.email == resource.data.email \|\| request.auth.token.email_verified == true/);
  for (const file of ['src/features/auth/AuthContext.tsx', 'src/features/profile/ProfileContext.tsx']) assert.match(fs.readFileSync(file, 'utf8'), /await syncIdentity\(/);
});
test('insurance is account-scoped and never migrates ambiguous device-wide consent', () => {
  const source = fs.readFileSync('src/features/insurance/InsuranceContext.tsx', 'utf8');
  assert.match(source, /cubo-insurance:\$\{uid\}/); assert.doesNotMatch(source, /getItem\('cubo-insurance'\)/); assert.match(source, /owner !== uid/);
});
