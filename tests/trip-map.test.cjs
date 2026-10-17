const { test } = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript'); const mod = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/features/maps/tripMapData.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(mod, mod.exports);
const { tripMapData, eventWithLocation, eventMapStyle } = mod.exports;
test('summary includes route and geolocated hazard/attention events, never invented positions', () => {
  const result = tripMapData([{ latitude: 35, longitude: -78 }, { latitude: NaN, longitude: 0 }], [
    { type: 'road_hazard', latitude: 36, longitude: -79 }, { type: 'looking_away', latitude: 35, longitude: -78 }, { type: 'eyes_closed' }, { type: 'attention_restored', latitude: 35, longitude: -78 },
  ]);
  assert.equal(result.route.length, 1); assert.equal(result.events.length, 2); assert.equal(result.bounds.length, 3); assert.equal(result.unlocated, 1);
});
test('new attention events receive only recent GPS; explicit hazard locations survive', () => {
  const route = [{ latitude: 35, longitude: -78, recordedAt: new Date(10000).toISOString() }];
  assert.equal(eventWithLocation({ type: 'looking_away' }, route, 14000).latitude, 35);
  assert.equal(eventWithLocation({ type: 'looking_away' }, route, 30000).latitude, undefined);
  assert.equal(eventWithLocation({ latitude: 40, longitude: -70 }, route, 14000).latitude, 40);
});
test('markers distinguish phone, eyes, police and crash', () => {
  assert.equal(eventMapStyle({ type: 'phone_detected' }).icon, 'phone-portrait-outline');
  assert.equal(eventMapStyle({ type: 'eyes_closed' }).icon, 'eye-off-outline');
  assert.equal(eventMapStyle({ type: 'road_hazard', hazardKind: 'police' }).icon, 'shield-outline');
  assert.equal(eventMapStyle({ type: 'road_hazard', hazardKind: 'crash' }).icon, 'warning-outline');
});
