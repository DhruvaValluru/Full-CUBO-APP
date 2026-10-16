const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/features/calibration/captureBrowserFrame.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', code)(loaded, loaded.exports);
const { captureBrowserFrame } = loaded.exports;
function fixture() {
  const video = { readyState: 4, videoWidth: 1280, videoHeight: 720, paused: false };
  const track = { readyState: 'live', muted: false };
  const stream = { getVideoTracks: () => [track] };
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage() {} }), toBlob: cb => cb({ size: 500 }) };
  return { video, track, stream, canvas, page: { hidden: false, createElement: () => canvas } };
}
test('captures a usable frame and clears its image buffer', async () => {
  const f = fixture(); await captureBrowserFrame(f.video, f.stream, f.page);
  assert.equal(f.canvas.width, 0); assert.equal(f.canvas.height, 0);
});
test('rejects missing, paused, interrupted and background cameras', async () => {
  for (const change of [f => { f.video = null; }, f => { f.video.paused = true; }, f => { f.track.readyState = 'ended'; }, f => { f.track.muted = true; }, f => { f.page.hidden = true; }, f => { f.video.videoWidth = 0; }]) {
    const f = fixture(); change(f); await assert.rejects(captureBrowserFrame(f.video, f.stream, f.page), /not ready/);
  }
});
test('failed capture rejects instead of pretending to calibrate', async () => {
  const f = fixture(); f.canvas.toBlob = cb => cb(null);
  await assert.rejects(captureBrowserFrame(f.video, f.stream, f.page), /empty/);
  assert.equal(f.canvas.width, 0);
});
