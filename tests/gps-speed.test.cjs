const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path) {
  const module = { exports: {} };
  new Function('module', 'exports', ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module, module.exports);
  return module.exports;
}
const { estimateSpeedMph, freshFix } = load('src/hooks/gpsSpeed.ts');
const { advanceAttention, emptyAttention } = load('src/features/attention/attentionPolicy.ts');
const fix = (timestamp, accuracy = 5) => ({ timestamp, accuracy, latitude: 35, longitude: -78 });
test('native speed converts meters/sec and handles a real stop', () => {
  assert.ok(Math.abs(estimateSpeedMph(10, fix(2000), null, 0, 2000) - 22.36936) < .001);
  assert.equal(estimateSpeedMph(0, fix(2000), null, 0, 2000), 0);
});
test('unreliable, missing and stale speed are not zero mph', () => {
  for (const value of [estimateSpeedMph(null, fix(2000), null, 0, 2000), estimateSpeedMph(10, fix(2000, 90), null, 0, 2000), estimateSpeedMph(10, fix(2000), null, 0, 20000), estimateSpeedMph(null, fix(2000), fix(2000), 30, 2000), estimateSpeedMph(null, fix(2000), fix(1000), 3, 2000)]) assert.equal(value, null);
  assert.equal(freshFix(fix(2000, null), 2000), false);
  assert.equal(estimateSpeedMph(200, fix(2000), null, 0, 2000), null);
});
test('web position fallback needs meaningful movement and elapsed time', () => {
  assert.ok(estimateSpeedMph(null, fix(3000), fix(1000), 20, 3000) > 22);
});
test('stationary, GPS missing and face missing have distinct states', () => {
  const sample = { at: 1000, face: true, width: .4, yaw: 0, pitch: 0, eyes: .3 };
  const baseline = { yaw: 0, pitch: 0, eyes: .3, version: 1 };
  const stopped = advanceAttention(emptyAttention(), sample, baseline, false, true);
  assert.match(stopped.status, /alerts start at 3 mph/);
  assert.equal(stopped.event, null); assert.equal(stopped.state.measuredMs, 0);
  assert.match(advanceAttention(emptyAttention(), sample, baseline, true, false).status, /reliable GPS speed/);
  assert.match(advanceAttention(emptyAttention(), { ...sample, face: false }, baseline, false, true).status, /face not visible/);
  assert.match(advanceAttention(emptyAttention(), sample, baseline, true, true).status, /monitoring active/);
});
