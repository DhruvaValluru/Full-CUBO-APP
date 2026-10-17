const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const ts = require('typescript');
function load(file) { const m = { exports: {} }; new Function('module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(m, m.exports); return m.exports; }
const access = load('src/features/permissions/mediaAccess.web.ts');
test('permission query never starts hardware; grant checks request only selected device and stop all tracks', async () => {
  const original = Object.getOwnPropertyDescriptor(global, 'navigator'); const secure = global.isSecureContext;
  let requested = [], stopped = 0;
  Object.defineProperty(global, 'navigator', { configurable: true, value: { permissions: { query: async () => ({ state: 'granted' }) }, mediaDevices: { getUserMedia: async constraints => { requested.push(constraints); return { getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }] }; } } } });
  global.isSecureContext = true;
  try {
    assert.equal(await access.checkMediaAccess('camera'), 'Allowed'); assert.equal(requested.length, 0);
    assert.match(await access.requestMediaAccess('camera'), /Allowed just now/); assert.deepEqual(requested[0], { audio: false, video: true }); assert.equal(stopped, 2);
    await access.requestMediaAccess('microphone'); assert.deepEqual(requested[1], { audio: true, video: false }); assert.equal(stopped, 4);
    navigator.permissions.query = async () => { throw Error('unsupported'); };
    assert.equal(await access.checkMediaAccess('microphone'), 'Browser manages access');
    navigator.mediaDevices.getUserMedia = async () => { throw Object.assign(Error('blocked'), { name: 'NotAllowedError' }); };
    await assert.rejects(access.requestMediaAccess('microphone'), /blocked/);
  } finally { if (original) Object.defineProperty(global, 'navigator', original); else delete global.navigator; global.isSecureContext = secure; }
});
test('permissions setting follows map source and does not activate a preview or fake stored permission', () => {
  const profile = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8');
  assert.ok(profile.indexOf('<MediaAccessPreference />') > profile.indexOf('<MapSourcePreference />'));
  if (profile.includes('<VoicePreference />')) assert.ok(profile.indexOf('<MediaAccessPreference />') < profile.indexOf('<VoicePreference />'));
  const view = fs.readFileSync('src/components/MediaAccessPreference.tsx', 'utf8');
  assert.match(view, /requestMediaAccess\(kind\)/); assert.match(view, /activeSession/);
  assert.doesNotMatch(view, /localStorage|AsyncStorage|CameraView|<video|MediaRecorder/);
});
