const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const read = path => fs.readFileSync(path, 'utf8');

test('Google authentication uses a phone-safe redirect and desktop popup', () => {
  const source = read('src/features/auth/googleSignIn.web.ts');
  assert.match(source, /GoogleAuthProvider/);
  assert.match(source, /prompt: 'select_account'/);
  assert.match(source, /signInWithRedirect/);
  assert.match(source, /signInWithPopup/);
  assert.match(source, /display-mode: standalone/);
});

test('new Google users must finish their private profile before entering CUBO', () => {
  const source = read('src/features/auth/AuthContext.tsx');
  assert.match(source, /provider\.providerId === GoogleAuthProvider\.PROVIDER_ID/);
  assert.match(source, /return !hasCompleteAccountDetails\(existing\.data\(\)\.accountDetails\)/);
  assert.match(source, /setNeedsAccountSetup\(requiresSetup\)/);
  assert.match(source, /completeGoogleAccountSetup/);
  assert.match(source, /accountDetails: validated/);
  assert.match(source, /createdAt: serverTimestamp\(\)/);
  assert.match(source, /await firebaseSignOut\(auth\)/);
});

test('Google account completion screen collects only name, phone, and birth date', () => {
  const source = read('src/screens/GoogleAccountSetupScreen.tsx');
  const app = read('App.tsx');
  assert.match(source, /Continue account creation/);
  assert.match(source, /accessibilityLabel="Name"/);
  assert.match(source, /accessibilityLabel="Phone number"/);
  assert.match(source, /accessibilityLabel="Date of birth, month day year"/);
  assert.doesNotMatch(source, /accessibilityLabel="Password"/);
  assert.match(app, /if \(needsAccountSetup\) return <GoogleAccountSetupScreen/);
});

test('authentication screen exposes one compact accessible Google action', () => {
  const source = read('src/screens/AuthScreen.tsx');
  assert.match(source, /accessibilityLabel="Continue with Google"/);
  assert.match(source, /or continue with/);
  assert.match(source, /Platform\.OS === 'web'/);
  assert.match(source, /auth\/account-exists-with-different-credential/);
});
