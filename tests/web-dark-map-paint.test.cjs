const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/components/webDarkMapPaint.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(mod, mod.exports);
const { webDarkMapPaint: palette, applyWebDarkMapPaint: apply } = mod.exports;

test('night palette only changes paint on known base layers, never overlays or geometry', () => {
  const writes = [];
  const map = { getLayer: id => ({ id }), setPaintProperty: (...args) => writes.push(args) };
  apply(map, 'light');
  assert.equal(writes.length, 0);
  apply(map, 'dark');
  assert.ok(writes.length > 40);
  for (const [id, prop] of writes) {
    assert.ok(id in palette);
    assert.match(prop, /^(background-color|fill-color|fill-outline-color|line-color|text-color|text-halo-color|text-halo-width)$/);
    assert.doesNotMatch(id, /route|driver|hazard|cubo/);
  }
});

test('missing provider layers are skipped and the palette can be reapplied after retry', () => {
  const writes = [];
  const map = { getLayer: id => id === 'background', setPaintProperty: (...args) => writes.push(args) };
  apply(map, 'dark'); apply(map, 'dark');
  assert.deepEqual(writes, [
    ['background', 'background-color', '#242F34'],
    ['background', 'background-color', '#242F34'],
  ]);
});

function luminance(hex) {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map(v => {
    const c = parseInt(v, 16) / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
test('night labels, roads and route retain useful contrast without a black canvas', () => {
  const base = palette.background['background-color'];
  assert.ok(luminance(base) > luminance('#0C0C0C') * 5);
  for (const paint of Object.values(palette)) {
    if (paint['text-color']) assert.ok(contrast(paint['text-color'], paint['text-halo-color']) >= 4.5);
  }
  assert.ok(contrast(palette.highway_minor['line-color'], base) >= 3);
  assert.ok(contrast('#71D3A4', base) >= 7);
  // Existing white route outline separates mint from the brightest major road.
  assert.ok(contrast('#FFFFFF', palette.highway_motorway_inner['line-color']) >= 2.5);
});

test('all platform map entry points apply the dark palette before adding routes', () => {
  if (fs.existsSync('src/components/DrivingMap.web.tsx')) {
    const drive = fs.readFileSync('src/components/DrivingMap.web.tsx', 'utf8');
    const preview = fs.readFileSync('src/components/StreetMap.web.tsx', 'utf8');
    assert.match(drive, /applyWebDarkMapPaint\(current!, props.userInterfaceStyle\)/);
    assert.match(preview, /applyWebDarkMapPaint\(map, mode\)/);
    assert.ok(preview.indexOf('applyWebDarkMapPaint(map, mode)') < preview.indexOf("map.addSource('cubo-route'"));
  } else {
    const native = fs.readFileSync('src/components/nativeMapFallbackHtml.ts', 'utf8');
    assert.equal((native.match(/paintNightMap\(\);loaded=true;draw\(\)/g) || []).length, 2);
    assert.match(native, /JSON.stringify\(webDarkMapPaint\)/);
  }
});
