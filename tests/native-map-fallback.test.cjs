const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const mod = { exports: {} };
const paletteModule = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/components/webDarkMapPaint.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(paletteModule, paletteModule.exports);
new Function('module', 'exports', 'require', ts.transpileModule(fs.readFileSync('src/components/nativeMapFallbackHtml.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(mod, mod.exports, name => { assert.equal(name, './webDarkMapPaint'); return paletteModule.exports; });
const html = mod.exports.nativeMapFallbackHtml;
function harness() {
  const events = {}, messages = [], moves = [], sources = {}, pins = [], paints = [], layers = {};
  class Map {
    constructor() {} addControl() {} on(name, cb) { events[name] = cb; } once(name, cb) { events[name] = cb; }
    getSource(id) { return sources[id]; } addSource(id, source) { sources[id] = { ...source, setData(data) { this.data = data; } }; }
    addLayer(layer) { layers[layer.id] = layer; }
    getLayer(id) { return layers[id] || paletteModule.exports.webDarkMapPaint[id]; }
    setPaintProperty(...args) { paints.push(args); } getBearing() { return 359; } easeTo(value) { moves.push(value); } fitBounds() {} setStyle() { for (const key of Object.keys(sources)) delete sources[key]; for (const key of Object.keys(layers)) delete layers[key]; }
  }
  class Marker {
    constructor(value) { this.value = value; pins.push(this); } setLngLat(value) { this.location = value; return this; } addTo() { return this; } remove() {}
  }
  const window = { ReactNativeWebView: { postMessage: message => messages.push(JSON.parse(message)) } };
  const element = () => ({ style: {}, setAttribute() {}, appendChild() {} });
  const document = { createElement: element, createElementNS: element, querySelector: () => ({ style: {} }) };
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, { window, document, maplibregl: { Map, Marker, AttributionControl: class {} }, innerHeight: 844 });
  return { receive: window.cuboReceive, events, messages, moves, sources, pins, paints, layers };
}
test('fallback bridge waits for map load and replays heading camera without long spin', () => {
  const h = harness(); assert.equal(h.messages[0].type, 'bridge');
  h.receive({ kind: 'camera', value: { center: { latitude: 35, longitude: -78 }, heading: 1, zoom: 18, pitch: 58 } });
  assert.equal(h.moves.length, 0);
  h.receive({ kind: 'state', value: { mode: 'dark', center: { latitude: 35, longitude: -78 }, route: [], pins: [] } });
  h.events.load(); assert.equal(h.moves[0].bearing, 361); assert.equal(h.moves[0].pitch, 58);
  assert.equal(h.messages.at(-1).type, 'ready');
});
test('route and driver pins update and manual map gestures release follow', () => {
  const h = harness();
  const state = { center: { latitude: 35, longitude: -78 }, mode: 'light', route: [{ latitude: 35, longitude: -78 }, { latitude: 36, longitude: -79 }], pins: [{ latitude: 35, longitude: -78, driver: true, heading: 90 }] };
  h.receive({ kind: 'state', value: state }); h.events.load();
  assert.equal(h.sources.route.data.geometry.coordinates[0][0], -78);
  assert.equal(h.pins[0].value.rotation, 90); assert.equal(h.pins[0].value.rotationAlignment, 'map');
  h.events.dragstart(); assert.equal(h.messages.at(-1).type, 'pan');
  h.events.error(); assert.equal(h.messages.at(-1).type, 'error');
});
test('summary Web renderer accepts distinct event symbols and static map mode', () => {
  const h = harness();
  h.receive({ kind: 'state', value: { center: { latitude: 35, longitude: -78 }, mode: 'light', route: [], preview: true, attributionBottom: 0, pins: ['eye', 'phone', 'shield', 'warning', 'box'].map(symbol => ({ latitude: 35, longitude: -78, symbol })) } });
  h.events.load(); assert.equal(h.pins.length, 5); assert.equal(h.messages.at(-1).type, 'ready');
});

test('night paint survives theme switches without changing light maps or route data', () => {
  const h = harness();
  const state = { center: { latitude: 35, longitude: -78 }, mode: 'light',
    route: [{ latitude: 35, longitude: -78 }, { latitude: 36, longitude: -79 }], pins: [] };
  h.receive({ kind: 'state', value: state }); h.events.load();
  assert.equal(h.paints.length, 0);
  assert.equal(h.layers['route-fill'].paint['line-color'], '#167655');
  h.receive({ kind: 'state', value: { ...state, mode: 'dark' } }); h.events['style.load']();
  assert.ok(h.paints.some(([id, name, color]) => id === 'background' && color === '#242F34'));
  assert.equal(h.layers['route-fill'].paint['line-color'], '#71D3A4');
  assert.deepEqual(Array.from(h.sources.route.data.geometry.coordinates[0]), [-78, 35]);
  h.paints.length = 0;
  h.receive({ kind: 'state', value: state }); h.events['style.load']();
  assert.equal(h.paints.length, 0);
  assert.equal(h.layers['route-fill'].paint['line-color'], '#167655');
});
