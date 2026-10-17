const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
const m = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/theme/colors.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(m, m.exports);
function light(hex) { const c = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; }
function contrast(a, b) { const x = light(a), y = light(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
for (const [mode, c] of [['light', m.exports.lightColors], ['dark', m.exports.darkColors]]) {
  test(mode + ' refreshed surfaces retain readable text and buttons', () => {
    for (const bg of [c.background, c.card, c.cardElevated, c.surfaceMuted])
      for (const fg of [c.text, c.textSecondary, c.textTertiary]) assert.ok(contrast(fg, bg) >= 4.5, `${fg} on ${bg}`);
    for (const [fg, bg] of [[c.shortcutText, c.shortcutSurface], [c.messageText, c.messageSurface], [c.text, c.composerSurface], [c.textSecondary, c.composerSurface], [c.onAccent, c.accent], [c.featureText, c.featureSurface], [c.featureMuted, c.featureSurface], [c.featureActionText, c.featureAction], [c.secondaryInk, c.secondarySurface]]) assert.ok(contrast(fg, bg) >= 4.5, `${fg} on ${bg}`);
  });
}
