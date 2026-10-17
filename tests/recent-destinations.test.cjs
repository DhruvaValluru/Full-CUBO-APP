const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const m = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/features/places/recentPlaces.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(m, m.exports);
test('recent destinations keep only three distinct latest places, including existing stored history', () => {
  const places = Array.from({ length: 10 }, (_, i) => ({ id: String(i), title: 'Place ' + i, latitude: i, longitude: i, subtitle: 'City' }));
  assert.deepEqual(m.exports.latestPlaces([places[0], places[0], ...places.slice(1)]).map(p => p.id), ['0', '1', '2']);
  assert.deepEqual(m.exports.latestPlaces(null), []);
  assert.deepEqual(m.exports.latestPlaces([{}, ...places]).map(p => p.id), ['0', '1', '2']);
  assert.match(fs.readFileSync('src/features/places/PlacesContext.tsx', 'utf8'), /recent: latestPlaces\(parsed.recent\)/);
});
test('Home has no destination history, and Map offers a tappable recent list on search focus', () => {
  assert.doesNotMatch(fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8'), /places.recent/);
  for (const file of ['src/screens/MapScreen.tsx', 'src/screens/MapScreen.web.tsx']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /RecentDestinations places=\{recent\}/);
    assert.match(source, /onFocus=\{/);
  }
  assert.match(fs.readFileSync('src/components/RecentDestinations.tsx', 'utf8'), /keyboardShouldPersistTaps="always"/);
});
