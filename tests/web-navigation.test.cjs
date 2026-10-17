const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', code)(module, module.exports); return module.exports;
}
const { subscribeBrowserLocation } = load('src/features/navigation/browserLocation.ts');
const { parseDrivingRoute } = load('src/features/navigation/routeResponse.ts');
test('browser GPS forwards positions and errors and clears the actual browser watch ID', () => {
  let success, failure, options, cleared; const positions = [], errors = [];
  const stop = subscribeBrowserLocation({ watchPosition(s, f, o) { success = s; failure = f; options = o; return 789; }, clearWatch(id) { cleared = id; } }, p => positions.push(p), e => errors.push(e));
  success({ coords: { latitude: 35, longitude: -78 } }); failure({ code: 1 });
  assert.equal(positions.length, 1); assert.equal(errors[0].code, 1); assert.equal(options.enableHighAccuracy, true); assert.equal(options.timeout, 15000);
  stop(); assert.equal(cleared, 789); success({}); failure({ code: 2 }); assert.equal(positions.length, 1); assert.equal(errors.length, 1);
});
const fixture = () => ({ code: 'Ok', routes: [{ distance: 600, duration: 90, geometry: { coordinates: [[-78, 35], [-78.01, 35.01]] }, legs: [{ steps: [{ distance: 500, name: 'Main Street', maneuver: { location: [-78, 35], type: 'depart' } }, { distance: 100, name: 'Oak Street', maneuver: { location: [-78.01, 35.01], type: 'turn', modifier: 'right' } }] }] }] });
test('routing retains geometry, distances and turn maneuvers in latitude/longitude order', () => {
  const route = parseDrivingRoute(fixture()); assert.equal(route.distanceMeters, 600); assert.equal(route.durationSeconds, 90); assert.deepEqual(route.coordinates[0], { longitude: -78, latitude: 35 }); assert.equal(route.steps[1].modifier, 'right');
});
test('missing routes, invalid positions and missing instructions cannot enable a drive', () => {
  assert.throws(() => parseDrivingRoute({ code: 'NoRoute' }));
  const invalid = fixture(); invalid.routes[0].geometry.coordinates[0][1] = 99; assert.throws(() => parseDrivingRoute(invalid));
  const empty = fixture(); empty.routes[0].legs[0].steps = []; assert.throws(() => parseDrivingRoute(empty));
});
