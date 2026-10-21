const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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
});

test('Firestore rules deny code listing and bind approval to one connection', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert.match(rules, /match \/connectionCodes\/\{codeId\}/);
  assert.match(rules, /allow list: if false/);
  assert.match(rules, /accountDetails\.accountType == 'adult'/);
  assert.match(rules, /getAfter\(\/databases\/\$\(database\)\/documents\/connections\/\$\(requestId\)\)/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['ownerShareScore'/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['memberShareScore'/);
});
