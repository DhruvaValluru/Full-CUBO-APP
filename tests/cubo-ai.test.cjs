const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file) {
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', 'require', output)(module, module.exports, name => load(path.resolve(path.dirname(file), name + '.ts')));
  return module.exports;
}
const { readState, writeState, accountKey, weekStart } = load('src/features/cuboAI/localState.ts');
const { CuboAISession } = load('src/features/cuboAI/session.ts');
const storage = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) }; };
const monday = Date.UTC(2026, 9, 12);

test('vehicle factual questions bypass inference and persist the fresh account answer', async () => {
  let currentUid = 'alice', car = '2021 Toyota Prius', calls = 0;
  const store = storage();
  const session = new CuboAISession({ uid: 'alice', currentUid: () => currentUid, isDriving: () => false, store, now: () => monday,
    appContext: () => JSON.stringify({ selectedVehicle: car, vehicleCount: 1 }),
    loadModel: async () => ({ reply: async () => { calls++; return 'model response'; }, dispose() {} }) });
  await session.prepare(true);
  for (const question of ['What is my vehicle?', 'what vehicle do i have', 'Which car do I own?', 'Show me my vehicles']) {
    assert.match((await session.send(question)).content, /2021 Toyota Prius/);
  }
  car = 'Honda Civic'; assert.match((await session.send('What is my car?')).content, /Honda Civic/);
  assert.equal(calls, 0); assert.equal(session.state().used, 5);
  assert.match(session.state().messages.at(-1).content, /Honda Civic/);
  currentUid = 'bob'; await assert.rejects(session.send('What is my vehicle?'), /account changed/);
  assert.equal(readState(store, 'bob', monday).messages.length, 0);
  await session.dispose();
});

test('vehicle lookup handles unavailable data and does not hijack advice or other peoples questions', () => {
  const { accountAnswer } = load('src/features/cuboAI/accountAnswers.ts');
  assert.match(accountAnswer('What is my vehicle?', '{}'), /loading or unavailable/);
  assert.match(accountAnswer('What is my vehicle?', '{'), /unavailable/);
  assert.match(accountAnswer('What is my vehicle?', '{"selectedVehicle":"none saved"}'), /no vehicles saved/);
  for (const q of ['What is my vehicle worth?', 'What is my child’s vehicle?', 'How do I change my car?', 'Is my car safe?', 'Tell me about cars']) assert.equal(accountAnswer(q, '{}'), null);
});

test('account context includes selected car and only measured scores, excludes private raw fields', () => {
  const { accountContext } = load('src/features/cuboAI/appContext.ts');
  const input = { name: 'Alice', vehiclesReady: true, calibration: 'completed',
    vehicles: [{ make: 'Toyota', model: 'Prius', year: '2021', nickname: 'Daily', primary: true, plate: 'SECRET' }],
    sessions: [{ endedAt: 'today', focusScore: 80, attentionMeasured: true, distanceMiles: 2, location: 'SECRET' }, { endedAt: 'today', focusScore: 100, distanceMiles: 1 }] };
  const text = accountContext(input), data = JSON.parse(text);
  assert.equal(data.selectedVehicle, '2021 Toyota Prius');
  assert.equal(data.averageFocusOutOf100, 80);
  assert.equal(data.completedTrips, 2);
  assert.equal(text.includes('SECRET'), false);
  assert.equal(JSON.parse(accountContext({ ...input, vehiclesReady: false })).selectedVehicle, 'loading/unavailable');
  assert.equal(JSON.parse(accountContext({ ...input, sessions: [] })).averageFocusOutOf100, null);
  const huge = accountContext({ ...input, name: '"'.repeat(1000), vehicles: Array.from({ length: 100 }, () => ({ make: '"'.repeat(1000), model: '\\'.repeat(1000), year: '2021', nickname: '"'.repeat(1000), primary: false })) });
  assert.ok(huge.length <= 800); assert.doesNotThrow(() => JSON.parse(huge));
});

test('each reply uses fresh own-account snapshot rather than stale model knowledge', async () => {
  let car = 'Toyota Prius', received;
  const session = new CuboAISession({ uid: 'alice', currentUid: () => 'alice', isDriving: () => false, store: storage(), now: () => monday,
    appContext: () => JSON.stringify({ selectedVehicle: car }),
    loadModel: async () => ({ reply: async messages => { received = messages; return 'Your saved car.'; }, dispose() {} }) });
  await session.prepare(true); await session.send('Explain my vehicle summary briefly');
  assert.match(received[0].content, /Toyota Prius/);
  car = 'Honda Civic'; await session.send('And now?');
  assert.match(received[0].content, /Honda Civic/);
  assert.doesNotMatch(received[0].content, /Toyota Prius/);
  await session.dispose();
});
test('automatic setup is account/model scoped and records interrupted loading separately', () => {
  const { startupKeys, startupState } = load('src/features/cuboAI/startup.ts');
  const store = storage(), keys = startupKeys('alice', 'llama');
  assert.deepEqual(startupState(store, 'alice', 'llama'), { configured: false, interruptedLoad: false });
  store.setItem(keys.ready, 'yes');
  assert.equal(startupState(store, 'alice', 'llama').configured, true);
  assert.equal(startupState(store, 'bob', 'llama').configured, false);
  assert.equal(startupState(store, 'alice', 'other').configured, false);
  store.setItem(keys.loading, 'yes');
  assert.equal(startupState(store, 'alice', 'llama').interruptedLoad, true);
  store.removeItem(keys.loading);
  assert.equal(startupState(store, 'alice', 'llama').interruptedLoad, false);
});
test('worker cancellation immediately terminates a pending model load', async () => {
  const { createWorkerFactory } = load('src/features/cuboAI/workerClient.ts');
  const originalWindow = global.window, originalWorker = global.Worker;
  const originalNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  let instance;
  global.window = { isSecureContext: true };
  Object.defineProperty(global, 'navigator', { configurable: true, value: { gpu: {} } });
  global.Worker = class { constructor() { instance = this; this.terminated = false; } postMessage(data) { this.request = data; } terminate() { this.terminated = true; } };
  try {
    const runtime = createWorkerFactory('test-model');
    const loading = runtime.load(() => {}); runtime.stop();
    await assert.rejects(loading, /stopped/); assert.equal(instance.terminated, true);
    await assert.rejects(runtime.load(() => {}), /closed/);
  } finally {
    global.window = originalWindow; global.Worker = originalWorker;
    if (originalNavigator) Object.defineProperty(global, 'navigator', originalNavigator); else delete global.navigator;
  }
});

test('worker sends bounded replies through message transport, never a page engine', async () => {
  const { createWorkerFactory } = load('src/features/cuboAI/workerClient.ts');
  const originalWindow = global.window, originalWorker = global.Worker;
  const originalNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  global.window = { isSecureContext: true };
  Object.defineProperty(global, 'navigator', { configurable: true, value: { gpu: {} } });
  global.Worker = class { postMessage(data) { queueMicrotask(() => this.onmessage({ data: { id: data.id, result: data.kind === 'load' ? 'ready' : 'A reply' } })); } terminate() {} };
  try {
    const runtime = createWorkerFactory('test-model'); const model = await runtime.load(() => {});
    assert.equal(await model.reply([{ role: 'user', content: 'Hi' }]), 'A reply');
    await model.dispose();
    await assert.rejects(model.reply([]), /unavailable/);
  } finally {
    global.window = originalWindow; global.Worker = originalWorker;
    if (originalNavigator) Object.defineProperty(global, 'navigator', originalNavigator); else delete global.navigator;
  }
});

test('mobile runtime keeps the original cached model and bounds context allocations', () => {
  const screen = fs.readFileSync('src/screens/CuboAIScreen.web.tsx', 'utf8');
  const worker = fs.readFileSync('src/features/cuboAI/inference.worker.ts', 'utf8');
  assert.doesNotMatch(screen, /import\('@mlc-ai\/web-llm'\)/);
  assert.match(screen, /Llama-3.2-1B-Instruct-q4f32_1-MLC/);
  assert.match(worker, /context_window_size: 2048/);
  assert.match(worker, /max_tokens: 128/);
  assert.match(worker, /hasModelInCache/);
  assert.match(screen, /localStorage.setItem\(recoveryKey, text\)/);
});
test('confirmed corrupt history recovery isolates account and conservatively retains allowance', () => {
  const { clearAccountState } = load('src/features/cuboAI/localState.ts');
  const store = storage(); store.setItem(accountKey('alice'), '{broken');
  const bob = readState(store, 'bob', monday); bob.memory = 'private'; writeState(store, bob);
  const result = clearAccountState(store, 'alice', monday);
  assert.equal(result.used, 100); assert.deepEqual(result.messages, []);
  assert.equal(readState(store, 'bob', monday).memory, 'private');
  assert.equal(readState(store, 'alice', monday + 7 * 86400000).used, 0);
});

test('voice transcript is bounded, stops recognition, and does not auto-send', () => {
  const { CuboAIVoice } = load('src/features/cuboAI/browserVoice.ts');
  let recognition, heard = '', aborted = 0;
  const original = global.window;
  global.window = { SpeechRecognition: class { constructor() { recognition = this; } start() {} abort() { aborted++; } } };
  try {
    const voice = new CuboAIVoice(() => true);
    assert.throws(() => voice.listen(false, () => {}, () => {}), /Confirm/);
    voice.listen(true, text => { heard = text; }, () => {});
    recognition.onresult({ results: [[{ transcript: 'hello' }]] });
    assert.equal(heard, 'hello'); assert.equal(aborted, 1);
    voice.dispose();
    assert.throws(() => voice.listen(true, () => {}, () => {}), /unavailable/);
  } finally { global.window = original; }
});
function setup(reply = async () => 'Hello') {
  let uid = 'alice', driving = false, disposals = 0;
  const store = storage();
  const session = new CuboAISession({ uid, store, currentUid: () => uid, isDriving: () => driving, now: () => monday, loadModel: async () => ({ reply, dispose: () => { disposals++; } }) });
  return { session, store, switchAccount: () => { uid = 'bob'; }, drive: () => { driving = true; }, disposals: () => disposals };
}
test('UTC weekly reset retains messages and memory; clock rollback does not reset', () => {
  const store = storage(); const data = readState(store, 'alice', monday);
  data.used = 99; data.memory = 'Keep answers short'; data.messages = [{ role: 'user', content: 'Hi', at: monday, source: 'voice' }]; writeState(store, data);
  const next = readState(store, 'alice', monday + 7 * 86400000);
  assert.equal(next.used, 0); assert.deepEqual(next.messages, data.messages); assert.equal(next.memory, data.memory);
  assert.equal(readState(store, 'alice', monday - 1).used, 99); assert.equal(weekStart(monday + 6 * 86400000), monday);
});
test('account keys isolate history and corrupt/foreign records fail closed', () => {
  const store = storage(); const alice = readState(store, 'alice', monday); alice.memory = 'Private'; writeState(store, alice);
  assert.equal(readState(store, 'bob', monday).memory, '');
  store.setItem(accountKey('bob'), JSON.stringify(alice)); assert.throws(() => readState(store, 'bob', monday));
  store.setItem(accountKey('bob'), '{'); assert.throws(() => readState(store, 'bob', monday));
});
test('download requires consent and text/voice consume the same allowance', async () => {
  const { session } = setup(); await assert.rejects(session.prepare(false)); await session.prepare(true);
  await session.send('Hello', 'text'); await session.send('Hi again', 'voice');
  assert.equal(session.state().used, 2); assert.equal(session.state().messages[2].source, 'voice');
  session.remember('My preferred name is Sam'); session.clearHistory();
  assert.equal(session.state().used, 2); assert.equal(session.state().messages.length, 0); assert.equal(session.state().memory, '');
});
test('quota blocks inference and failures count without saving fabricated replies', async () => {
  const x = setup(async () => { throw Error('GPU lost'); }); await x.session.prepare(true);
  await assert.rejects(x.session.send('Hello')); assert.equal(x.session.state().used, 1); assert.equal(x.session.state().messages.length, 0);
  writeState(x.store, { ...x.session.state(), used: 100 }); await assert.rejects(x.session.send('Hello'), /allowance/);
});
test('account switch during generation cannot publish or persist the late reply', async () => {
  let resolve; const x = setup(() => new Promise(r => { resolve = r; })); await x.session.prepare(true);
  const pending = x.session.send('Private question'); x.switchAccount(); resolve('Private answer');
  await assert.rejects(pending, /account changed/);
  assert.equal(readState(x.store, 'alice', monday).messages.length, 0); assert.equal(readState(x.store, 'bob', monday).messages.length, 0);
  await x.session.dispose(); assert.equal(x.disposals(), 1);
});
test('drive start blocks sending and concurrent requests are rejected', async () => {
  let resolve; const x = setup(() => new Promise(r => { resolve = r; })); await x.session.prepare(true);
  const pending = x.session.send('Hi'); await assert.rejects(x.session.send('Second'), /current reply/);
  x.drive(); resolve('Answer'); await assert.rejects(pending, /drive has ended/);
});
test('clear during generation discards the answer and storage errors stop inference', async () => {
  let resolve; const x = setup(() => new Promise(r => { resolve = r; })); await x.session.prepare(true);
  const pending = x.session.send('Hi'); x.session.clearHistory(); resolve('Old answer'); await assert.rejects(pending, /cleared/);
  x.store.setItem = () => { throw Error('Quota exceeded'); };
  await assert.rejects(x.session.send('Hi'), /Quota exceeded/);
});
test('chat persistence never imports Firebase and screen is registered', () => {
  for (const name of ['localState', 'session', 'browserVoice', 'webllmAdapter']) assert.doesNotMatch(fs.readFileSync(`src/features/cuboAI/${name}.ts`, 'utf8'), /from ['"]firebase|fetch\(/);
  assert.match(fs.readFileSync('App.tsx', 'utf8'), /name="CuboAI"/);
});

test('usage circle follows requested thresholds and never goes negative', () => {
  const { usageBadge } = load('src/features/cuboAI/presentation.ts');
  assert.equal(usageBadge(0).background, '#137858');
  assert.equal(usageBadge(20).background, '#D87920');
  assert.equal(usageBadge(40).background, '#F0CC51');
  assert.equal(usageBadge(80).background, '#BD2929');
  assert.equal(usageBadge(110).percent, 0);
});

test('unmeasured trips do not become invented focus scores', () => {
  const { drivingContext } = load('src/features/cuboAI/presentation.ts');
  assert.match(drivingContext([{ endedAt: 'today', attentionMeasured: false, focusScore: 100, distanceMiles: 1 }]), /unavailable/);
  assert.match(drivingContext([{ endedAt: 'today', attentionMeasured: true, focusScore: 85, distanceMiles: 1 }]), /85\/100/);
});
test('logout while loading disposes the late model and never makes it usable', async () => {
  let resolve, uid = 'alice', disposed = 0;
  const session = new CuboAISession({ uid, currentUid: () => uid, isDriving: () => false, store: storage(), loadModel: () => new Promise(r => { resolve = r; }) });
  const pending = session.prepare(true); uid = null; await session.dispose();
  resolve({ reply: async () => 'No', dispose: () => { disposed++; } });
  await assert.rejects(pending, /account changed/); assert.equal(disposed, 1);
});
test('prompt contains only current account notes and bounded recent context', async () => {
  let prompt;
  const x = setup(async messages => { prompt = messages; return 'Okay'; });
  x.session.remember('Alice prefers short answers');
  const bob = readState(x.store, 'bob', monday); bob.memory = 'Bob private note'; writeState(x.store, bob);
  await x.session.prepare(true); await x.session.send('Explain CUBO');
  assert.match(JSON.stringify(prompt), /Alice prefers/); assert.doesNotMatch(JSON.stringify(prompt), /Bob private/);
});
