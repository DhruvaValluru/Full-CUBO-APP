const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', output)(module, module.exports);
  return module.exports;
}

const { LiveNavigationTracker, distanceToRouteMeters } = load('src/features/navigation/liveNavigation.ts');
const route = {
  coordinates: [{ latitude: 35, longitude: -78 }, { latitude: 35, longitude: -77.99 }],
  distanceMeters: 910, durationSeconds: 100,
  steps: [{ location: { latitude: 35, longitude: -78 }, distanceMeters: 910, name: 'Main', type: 'depart' }],
};
const destination = { latitude: 35, longitude: -77.99 };
const fix = (latitude, longitude, timestamp, accuracy = 5) => ({ latitude, longitude, timestamp, accuracy });

test('distance uses the nearest line segment rather than route vertices', () => {
  assert.ok(distanceToRouteMeters(route, { latitude: 35.0001, longitude: -77.995 }) < 12);
});

test('automatic reroute requires three accurate off-route fixes and enforces cooldown', () => {
  const tracker = new LiveNavigationTracker();
  const off = index => fix(35.001, -77.995, 1000 + index * 1000);
  assert.equal(tracker.update(route, off(0), destination, 1000).kind, 'none');
  assert.equal(tracker.update(route, off(1), destination, 2000).kind, 'none');
  assert.equal(tracker.update(route, off(2), destination, 3000).kind, 'reroute');
  tracker.routeApplied(3500);
  assert.equal(tracker.update(route, off(3), destination, 4000).kind, 'none');
  assert.equal(tracker.update(route, off(4), destination, 5000).kind, 'none');
  assert.equal(tracker.update(route, off(5), destination, 6000).kind, 'none');
  assert.equal(tracker.update(route, off(22), destination, 23000).kind, 'none');
  assert.equal(tracker.update(route, off(28), destination, 29000).kind, 'reroute');
});

test('arrival needs two fresh nearby fixes and only announces once', () => {
  const tracker = new LiveNavigationTracker();
  assert.equal(tracker.update(route, fix(35, -77.9902, 1000), destination, 1000).kind, 'none');
  assert.equal(tracker.update(route, fix(35, -77.9901, 2000), destination, 2000).kind, 'arrived');
  assert.equal(tracker.update(route, fix(35, -77.9901, 3000), destination, 3000).kind, 'none');
});

test('stale or inaccurate GPS cannot reroute or announce arrival', () => {
  const tracker = new LiveNavigationTracker();
  for (let index = 0; index < 4; index++) {
    assert.equal(tracker.update(route, fix(35.001, -77.995, 1000, 75), destination, 1000 + index * 1000).kind, 'none');
  }
  assert.equal(tracker.update(route, fix(35, -77.9901, 1000), destination, 20000).kind, 'none');
});

test('web drive UI exposes route states, responsive camera follow and red destination pin', () => {
  const map = fs.readFileSync(path.join(__dirname, '..', 'src/screens/MapScreen.web.tsx'), 'utf8');
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src/components/DrivingMap.web.tsx'), 'utf8');
  assert.match(map, /RECALCULATING ROUTE/);
  assert.match(map, /DESTINATION REACHED/);
  assert.match(map, /location-sharp/);
  assert.match(map, /color=\{colors\.danger\}/);
  assert.match(renderer, /m\.stop\(\)/);
  assert.match(map, /duration: navigating \? 320 : 450/);
});
