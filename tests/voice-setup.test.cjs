const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/features/cuboAI/microphoneMeter.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleUnderTest, moduleUnderTest.exports);
const { MicrophoneMeter } = moduleUnderTest.exports;

test('mic meter measures real samples, stops tracks and closes audio; late permissions are released', async () => {
  const nav = Object.getOwnPropertyDescriptor(global, 'navigator');
  const previousAudio = global.AudioContext;
  let stopped = 0, closed = 0, resolvePermission;
  const stream = { getTracks: () => [{ stop: () => stopped++ }] };
  global.AudioContext = class {
    async resume() {} async close() { closed++; }
    createAnalyser() { return { fftSize: 256, getByteTimeDomainData: samples => samples.fill(144) }; }
    createMediaStreamSource() { return { connect() {} }; }
  };
  Object.defineProperty(global, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: async () => stream } } });
  try {
    const meter = new MicrophoneMeter(); let level = 0;
    assert.equal(await meter.start(value => level = value), true);
    await new Promise(resolve => setTimeout(resolve, 120)); assert.ok(level > 0);
    meter.stop(); assert.equal(stopped, 1); assert.equal(closed, 1);
    navigator.mediaDevices.getUserMedia = () => new Promise(resolve => resolvePermission = resolve);
    const pending = meter.start(() => assert.fail('Cancelled meter emitted a level'));
    await Promise.resolve(); meter.stop(); resolvePermission(stream);
    assert.equal(await pending, false); assert.equal(stopped, 2); assert.equal(closed, 2);
  } finally { if (nav) Object.defineProperty(global, 'navigator', nav); else delete global.navigator; global.AudioContext = previousAudio; }
});

test('voice preview has no speech/model integration and setup remains optional', () => {
  const control = fs.readFileSync('src/components/DriveVoiceControl.web.tsx', 'utf8');
  assert.doesNotMatch(control, /getUserMedia|SpeechRecognition|createWorkerFactory/);
  assert.match(control, /Microphone off/);
  const setup = fs.readFileSync('src/components/VoiceSetup.web.tsx', 'utf8');
  assert.match(setup, /Skip & continue/); assert.match(setup, /15000/);
  assert.match(setup, /visibilitychange/); assert.match(setup, /showModal/);
});
