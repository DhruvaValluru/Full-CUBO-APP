const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');

function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}
const { lightColors, darkColors } = load('src/theme/colors.ts');
const { authTheme } = load('src/theme/authTheme.ts');
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
for (const [mode, colors] of [['light', lightColors], ['dark', darkColors]]) {
  test(`${mode} auth retains app surfaces and readable controls`, () => {
    const p = authTheme(colors, mode);
    assert.equal(p.card, colors.card);
    assert.equal(p.accent, colors.accent);
    assert.deepEqual(p.gradient.slice(1), [colors.background, colors.background]);
    assert.notEqual(p.gradient[0], colors.background);
    for (const foreground of [p.text, p.textSecondary, p.errorText]) {
      for (const background of [p.card, p.background]) {
        assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
      }
    }
    assert.ok(contrast(p.onAccent, p.accent) >= 4.5);
    assert.ok(contrast(p.fieldBorder, p.card) >= 3);
    assert.ok(contrast(p.accent, p.card) >= 3);
  });
}
