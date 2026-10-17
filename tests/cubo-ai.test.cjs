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
