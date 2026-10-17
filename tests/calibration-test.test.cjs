const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', 'require', js)(mod, mod.exports, name => load(path.resolve(path.dirname(file), name + '.ts')));
  return mod.exports;
}
const p = load('src/features/calibration/calibrationTest.ts');
const attention = load('src/features/attention/attentionPolicy.ts');
const sample = (at, values = {}) => ({ at, face: true, yaw: 0, pitch: 0, eyes: .3, width: .4, x: .5, y: .5, ...values });
const step = (state, at, values = {}, now = at) => p.advanceCalibrationTest(state, sample(at, values), now);
function baseline() {
  let state = p.beginBaseline(1000);
  for (let at = 1000; at <= 4200; at += 400) state = step(state, at).state;
  assert.equal(state.phase, 'ready');
  return state;
}
function detected() {
  let state = p.beginLookAway(baseline(), 5000), alerts = 0;
  for (let at = 5000; at <= 7400; at += 400) {
    const result = step(state, at, { yaw: .3 }); state = result.state; alerts += Number(result.alert);
  }
  assert.equal(alerts, 1); assert.equal(state.phase, 'return');
  return state;
}

test('baseline requires a stable, fresh forward pose before any test alert', () => {
  let state = p.beginBaseline(1000);
  for (let at = 1000; at <= 3800; at += 400) { const result = step(state, at); state = result.state; assert.equal(result.alert, false); }
  assert.equal(state.phase, 'baseline');
  const ready = baseline();
  assert.deepEqual(ready.baseline, { version: 1, yaw: 0, pitch: 0, eyes: .3 });
  assert.equal(step(ready, 4800, { yaw: .3 }).state.phase, 'ready');
});
test('head turn emits once and completion requires observed forward recovery', () => {
  let state = detected();
  for (let at = 7800; at <= 9400; at += 400) {
    const result = step(state, at, { yaw: .3 }); state = result.state; assert.equal(result.alert, false); assert.equal(state.phase, 'return');
  }
  for (let at = 9800; at <= 11000; at += 400) state = step(state, at).state;
  assert.equal(state.phase, 'confirm');
});
test('brief turns and closed eyes do not pass the head-turn exercise', () => {
  let state = p.beginLookAway(baseline(), 5000);
  for (let at = 5000; at <= 6200; at += 400) state = step(state, at, { yaw: .3 }).state;
  state = step(state, 6600).state;
  for (let at = 7000; at <= 10200; at += 400) {
    const result = step(state, at, { eyes: .02 }); state = result.state; assert.equal(result.alert, false);
  }
  assert.equal(state.phase, 'away');
});
test('face loss, stale frames, duplicate timestamps and long gaps do not manufacture dwell', () => {
  let state = p.beginLookAway(baseline(), 5000);
  state = step(state, 5000, { yaw: .3 }).state;
  state = step(state, 5400, { yaw: .3 }).state;
  const original = state;
  assert.equal(step(state, 5400, { yaw: .3 }).state, original);
  state = step(state, 5800, { face: false }).state;
  assert.equal(state.progress, 0);
  state = step(state, 6200, { yaw: .3 }, 10000).state;
  state = step(state, 11000, { yaw: .3 }).state;
  assert.equal(state.phase, 'away'); assert.equal(state.progress, 0);
});
test('bad framing and moving baseline restart the stable hold, not save random frames', () => {
  for (const change of [{ face: false }, { eyes: .01 }, { width: .1 }, { x: .01 }, { yaw: NaN }]) {
    let state = p.beginBaseline(1000);
    state = step(state, 1000).state; state = step(state, 1400, change).state;
    assert.equal(state.phase, 'baseline'); assert.equal(state.progress, 0); assert.equal(state.baseline, null);
  }
  let state = p.beginBaseline(1000);
  state = step(state, 1000).state; state = step(state, 1400, { yaw: .4 }).state;
  assert.equal(state.samples.length, 1); assert.equal(state.progress, 0);
});
test('future frames do not poison a retry and recovery cannot bridge a camera gap', () => {
  let state = p.beginLookAway(baseline(), 5000);
  state = step(state, 999999, { yaw: .3 }, 5000).state;
  assert.equal(state.lastAt, 0);
  state = detected();
  state = step(state, 7800).state;
  state = step(state, 10200).state;
  assert.equal(state.phase, 'return'); assert.equal(state.progress, 0);
});
test('timeout and restart discard test progress; live drive movement threshold is unchanged', () => {
  const state = p.calibrationTimeout(p.beginLookAway(baseline(), 5000), 35001);
  assert.equal(state.phase, 'position'); assert.equal(state.baseline, null); assert.match(state.hint, /timed out/);
  let drive = attention.emptyAttention();
  for (let at = 1000; at <= 6000; at += 400) {
    const result = attention.advanceAttention(drive, sample(at, { yaw: .3 }), baseline().baseline, false, true);
    drive = result.state; assert.equal(result.event, null); assert.equal(drive.measuredMs, 0);
  }
});
test('screen saves only after detection, recovery and explicit audio confirmation; no trip writes', () => {
  const source = fs.readFileSync('src/screens/CameraCalibrationScreen.tsx', 'utf8');
  assert.match(source, /current.phase !== 'confirm'/);
  assert.match(source, /I heard it — save calibration/);
  assert.match(source, /saveCalibration\(current.samples.length, current.baseline, true\)/);
  assert.doesNotMatch(source, /\baddEvent\(|\brecordAttention\(|setTimeout\(.*navigation|Animated/);
  assert.match(source, /previewFit="contain"/);
  assert.match(source, /ScrollView/);
  assert.match(source, /!activeSession/);
  assert.match(source, /visibilitychange/);
  const drive = fs.readFileSync('src/components/DriveAttentionCamera.tsx', 'utf8');
  assert.match(drive, /speed >= 3/);
  assert.match(drive, /player.speak\(message\)/);
  assert.match(drive, /nativeAudio.current\?\.dispose\(\)/);
});
