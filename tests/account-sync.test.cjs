const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function transpile(file, stubs = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('module', 'exports', 'require', code)(module, module.exports, request => request in stubs ? stubs[request] : require(request));
  return module.exports;
}

const firestore = { doc: () => ({}), onSnapshot: () => () => {}, serverTimestamp: () => ({}), setDoc: async () => {} };
const account = transpile('src/features/sync/accountSync.ts', { 'firebase/firestore': firestore, '../../lib/firebase': { db: {} } });

test('account envelopes are versioned, bounded and unicode-aware', () => {
  const payload = account.encodeAccountPayload('vehicles', { label: 'CUBO 🚙' });
  assert.deepEqual(account.decodeAccountPayload('vehicles', { schemaVersion: 1, payload }), { label: 'CUBO 🚙' });
  assert.equal(account.utf8Bytes('A🚙'), 5);
  assert.throws(() => account.encodeAccountPayload('vehicles', 'x'.repeat(61_000)), /too large/);
  assert.throws(() => account.decodeAccountPayload('vehicles', { schemaVersion: 2, payload }), /invalid/);
});

test('fresh installs take cloud state while offline edits and deletions remain local', () => {
  const normalize = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  const prepare = value => value;
  const merge = (local, remote) => [...new Set([...remote, ...local])];
  const cloud = ['cloud'];
  const fresh = account.reconcileAccountValue('vehicles', ['demo'], cloud, null, normalize, prepare, merge, false);
  assert.deepEqual(fresh.value, cloud);
  const migrated = account.reconcileAccountValue('vehicles', ['old-device'], cloud, null, normalize, prepare, merge, true);
  assert.deepEqual(migrated.value, ['cloud', 'old-device']);
  const previous = account.encodeAccountPayload('vehicles', ['kept', 'deleted-later']);
  const offlineDelete = account.reconcileAccountValue('vehicles', ['kept'], ['kept', 'deleted-later'], previous, normalize, prepare, merge, true);
  assert.equal(offlineDelete.deviceHasOfflineChanges, true);
  assert.deepEqual(offlineDelete.value, ['kept']);
  const clean = account.reconcileAccountValue('vehicles', ['kept', 'deleted-later'], ['new-cloud'], previous, normalize, prepare, merge, true);
  assert.equal(clean.deviceHasOfflineChanges, false);
  assert.deepEqual(clean.value, ['new-cloud']);
});

test('drive and assistant cloud copies stay bounded', () => {
  const policy = { makeBlockingPolicy: (uid, name, current = {}) => ({ targetUid: uid, targetName: name, enabled: !!current.enabled, lockedByParent: !!current.lockedByParent, selectedIds: Array.isArray(current.selectedIds) ? current.selectedIds : [], updatedAt: current.updatedAt || '' }) };
  const domains = transpile('src/features/sync/domainData.ts', { '../appBlocking/policy': policy, './accountSync': account });
  const route = Array.from({ length: 1000 }, (_, index) => ({ latitude: 35 + index / 100000, longitude: -79, speedMph: 20, recordedAt: new Date().toISOString() }));
  const trips = Array.from({ length: 70 }, (_, index) => ({ id: `trip-${index}`, driverName: 'Driver', vehicleName: 'Toyota Prius', startedAt: new Date(Date.now() - index * 1000).toISOString(), endedAt: new Date(Date.now() - index * 1000 + 500).toISOString(), durationSeconds: 60, distanceMiles: 1, focusScore: 90, events: [], route, voiceTranscript: Array.from({ length: 80 }, () => ({ role: 'user', text: 'hello'.repeat(200), elapsedSeconds: 1 })) }));
  const compact = domains.compactDriveSessions(trips);
  assert.ok(compact.length <= 50);
  assert.ok(compact.every(trip => trip.route.length <= 100));
  assert.ok(account.utf8Bytes(JSON.stringify({ version: 1, data: compact })) <= 680_000);
  const assistant = domains.compactAssistantState({ version: 1, owner: 'uid', week: 1, used: 4, memory: 'note', messages: Array.from({ length: 200 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', source: 'text', content: 'x'.repeat(8000), at: index })) });
  assert.ok(account.utf8Bytes(JSON.stringify({ version: 1, data: assistant })) <= 480_000);
});

test('all synced records are owner scoped and wired without media payloads', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert.match(rules, /match \/users\/\{userId\}[\s\S]*match \/sync\/\{domain\}/);
  assert.match(rules, /allow read: if isOwner\(userId\)/);
  assert.match(rules, /allow create, update: if isOwner\(userId\)/);
  assert.match(rules, /data\.payload\.size\(\) <= 700000/);
  const accountSource = fs.readFileSync('src/features/sync/accountSync.ts', 'utf8');
  for (const domain of ['vehicles', 'places', 'insurance', 'blockedApps', 'drives', 'assistant']) assert.match(accountSource, new RegExp(`['\"]${domain}['\"]`));
  for (const forbidden of ['cameraFrames', 'microphoneAudio', 'modelCache', 'devicePermissions']) assert.doesNotMatch(accountSource, new RegExp(forbidden));
  const bridge = fs.readFileSync('src/features/sync/useAccountSyncBridge.ts', 'utf8');
  assert.match(bridge, /cubo-account-sync:v1:/);
  assert.match(bridge, /deviceHasOfflineChanges/);
  assert.match(bridge, /mergeInitial/);
  const wiring = [
    'src/features/vehicles/VehicleContext.tsx', 'src/features/places/PlacesContext.tsx',
    'src/features/insurance/InsuranceContext.tsx', 'src/features/appBlocking/AppBlockingContext.tsx',
    'src/features/drives/DriveContext.tsx', 'src/screens/CuboAIScreen.web.tsx',
  ];
  for (const file of wiring) assert.match(fs.readFileSync(file, 'utf8'), /useAccountSyncBridge/);
});
