const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const mod = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/features/navigation/courseHeading.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(mod, mod.exports);
const { createCourseTracker, nearestBearing } = mod.exports;
const fix = (lat, lon, time, accuracy = 5) => ({ latitude: lat, longitude: lon, timestamp: time, accuracy });
test('missing browser heading follows north then a right turn east', () => {
  const track = createCourseTracker();
  assert.equal(track(fix(35, -78, 1000), null, null), null);
  assert.ok(Math.abs(track(fix(35.0002, -78, 3000), null, null)) < 1);
  assert.ok(Math.abs(track(fix(35.0002, -77.9998, 5000), null, null) - 90) < 1);
});
test('stationary jitter and inaccurate fixes preserve the last course', () => {
  const track = createCourseTracker();
  assert.equal(track(fix(35, -78, 1000), 90, 10), 90);
  assert.equal(track(fix(35.000001, -78, 2000), 0, 0), 90);
  assert.equal(track(fix(35.001, -78, 3000, 100), 180, 10), 90);
});
test('small displacements accumulate and north crossing uses shortest rotation', () => {
  const track = createCourseTracker(); track(fix(35, -78, 1000), null, null);
  assert.equal(track(fix(35.00002, -78, 2000), null, null), null);
  assert.ok(Math.abs(track(fix(35.00008, -78, 4000), null, null)) < 1);
  assert.equal(nearestBearing(359, 1), 361);
  assert.equal(nearestBearing(1, 359), -1);
});
