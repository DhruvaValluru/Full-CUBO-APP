const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function loadIdentity() {
  const module = { exports: {} };
  const source = fs.readFileSync('src/features/connections/connectionIdentity.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', 'require', code)(module, module.exports, require);
  return module.exports;
}

test('Home and Account expose the separated Family and Friends flow', () => {
  const home = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');
  const profile = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8');
  const screen = fs.readFileSync('src/screens/ConnectionsScreen.tsx', 'utf8');
  assert.match(home, />Family \/ Friends</);
  assert.match(home, />Enter Code</);
  assert.match(home, />Create Code</);
  assert.match(profile, /title="Family"/);
  assert.doesNotMatch(profile, /Family safety/);
  assert.match(profile, /title="Drive Activity"/);
  assert.match(profile, /title="Camera Calibration"/);
  assert.match(screen, /Friend connections only share/);
  assert.match(screen, /Minor accounts can enter a Family code|A minor can enter a Family code/);
  assert.match(screen, /enterCode\(code, kind\)/);
  assert.match(screen, /This is a.*code|Codes only work in their matching section/);
});

test('join codes require approval and friend sharing stays opt-in', () => {
  const provider = fs.readFileSync('src/features/connections/ConnectionContext.tsx', 'utf8');
  assert.match(provider, /status: 'pending'/);
  assert.match(provider, /status: 'approved'/);
  assert.match(provider, /ownerShareScore: false/);
  assert.match(provider, /memberShareLocation: false/);
  assert.match(provider, /15 \* 60 \* 1000/);
  assert.match(provider, /requestForegroundPermissionsAsync/);
  assert.doesNotMatch(provider, /watchPositionAsync/);
  assert.match(provider, /This person is already in your/);
  assert.match(provider, /dedupeConnections/);
  assert.match(provider, /averageScore[\s\S]*: 100/);
  assert.match(provider, /ScoreMeasured/);
  assert.match(provider, /sessions\.some\(item => item\.attentionMeasured\)/);
});

test('family and friend pairs use separate stable IDs and duplicates collapse', () => {
  const { connectionPairId, dedupeConnections } = loadIdentity();
  assert.equal(connectionPairId('friend', 'user-b', 'user-a'), 'friend_user-a_user-b');
  assert.equal(connectionPairId('friend', 'user-a', 'user-b'), 'friend_user-a_user-b');
  assert.equal(connectionPairId('family', 'user-a', 'user-b'), 'family_user-a_user-b');
  const stamp = value => ({ toMillis: () => value });
  const old = { id: 'random-one', kind: 'friend', ownerUid: 'user-a', memberUid: 'user-b', updatedAt: stamp(1) };
  const latest = { ...old, id: 'random-two', updatedAt: stamp(2) };
  assert.deepEqual(dedupeConnections([old, latest]).map(item => item.id), ['random-two']);
});

test('Firestore rules deny code listing and bind approval to one connection', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert.match(rules, /match \/connectionCodes\/\{codeId\}/);
  assert.match(rules, /allow list: if false/);
  assert.match(rules, /accountDetails\.accountType == 'adult'/);
  assert.match(rules, /connectionPairId\(kind, firstUid, secondUid\)/);
  assert.match(rules, /connectionId == connectionPairId/);
  assert.match(rules, /requestId == connectionPairId/);
  assert.match(rules, /data.kind == 'family'.*data.code.matches\('\^F-/s);
  assert.match(rules, /data.kind == 'friend'.*data.code.matches\('\^R-/s);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['ownerShareScore'/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['memberShareScore'/);
  assert.match(rules, /ownerScoreMeasured/);
  assert.match(rules, /memberScoreMeasured/);
});
