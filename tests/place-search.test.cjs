const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function loader() {
  const modules = new Map();
  return function load(file) {
    file = path.resolve(file);
    if (modules.has(file)) return modules.get(file);
    const m = { exports: {} };
    new Function('module', 'exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(m, m.exports, n => load(path.resolve(path.dirname(file), n + '.ts')));
    modules.set(file, m.exports); return m.exports;
  };
}
test('search preserves provider relevance, removes hard geographic exclusion, caches and validates coordinates', async () => {
  const { searchPlaces } = loader()('src/features/places/searchPlaces.ts');
  const previous = global.fetch; let calls = 0;
  global.fetch = async url => {
    calls++; const params = new URL(url).searchParams;
    assert.equal(params.has('bbox'), false); assert.equal(params.get('q'), 'Central Library');
    return { ok: true, json: async () => ({ features: [
      { geometry: { coordinates: [-78.8, 35.8] }, properties: { name: 'Central Library' } },
      { geometry: { coordinates: [-78.64, 35.78] }, properties: { name: 'Other Library' } },
      { geometry: { coordinates: [999, 0] }, properties: {} },
    ] }) };
  };
  try {
    const origin = { latitude: 35.78, longitude: -78.64 };
    const first = await searchPlaces(' Central   Library ', origin);
    assert.equal(first[0].title, 'Central Library'); assert.equal(first.length, 2);
    first[0].title = 'mutated';
    assert.equal((await searchPlaces('central library', origin))[0].title, 'Central Library');
    assert.equal(calls, 1);
    const cancelled = new AbortController(); cancelled.abort();
    await assert.rejects(searchPlaces('central library', origin, cancelled.signal), { name: 'AbortError' });
  } finally { global.fetch = previous; }
});
test('GPS updates do not restart address search and saved addresses use the shared hook', () => {
  const hook = fs.readFileSync('src/features/places/usePlaceSuggestions.ts', 'utf8');
  assert.ok(hook.includes('[clean, enabled]'));
  assert.match(fs.readFileSync('src/screens/SavedPlaceScreen.tsx', 'utf8'), /usePlaceSuggestions/);
});
test('GPS jitter preserves pending suggestions and late results cannot overwrite a newer query', async () => {
  const states = [], refs = []; let si = 0, ri = 0, deps, cleanup, callback;
  const requests = [];
  const react = {
    useState(initial) { const i = si++; if (!(i in states)) states[i] = initial; return [states[i], v => states[i] = v]; },
    useRef(initial) { const i = ri++; return refs[i] ??= { current: initial }; },
    useEffect(fn, next) { if (!deps || next.some((v, i) => v !== deps[i])) { cleanup?.(); deps = next; callback = fn; } },
  };
  const m = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync('src/features/places/usePlaceSuggestions.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', 'require', js)(m, m.exports, n => n === 'react' ? react : { searchPlaces: (query, origin, signal) => new Promise(resolve => requests.push({ query, origin, signal, resolve })) });
  function render(query, origin) { si = 0; ri = 0; m.exports.usePlaceSuggestions(query, origin); if (callback) { const effect = callback; callback = null; cleanup = effect(); } }
  try {
    render('first query', { latitude: 1, longitude: 1 });
    await new Promise(r => setTimeout(r, 240));
    render('first query', { latitude: 1.00001, longitude: 1.00001 });
    assert.equal(requests.length, 1); assert.equal(requests[0].signal.aborted, false);
    render('second query', { latitude: 1, longitude: 1 });
    assert.equal(requests[0].signal.aborted, true);
    await new Promise(r => setTimeout(r, 240));
    requests[1].resolve([{ id: 'new' }]); await new Promise(r => setImmediate(r));
    requests[0].resolve([{ id: 'old' }]); await new Promise(r => setImmediate(r));
    assert.equal(states[0][0].id, 'new');
  } finally { cleanup?.(); }
});

