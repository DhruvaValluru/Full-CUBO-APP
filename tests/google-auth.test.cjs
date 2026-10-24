const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const read = path => fs.readFileSync(path, 'utf8');

const ts = require('typescript');
function loadTypeScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const moduleUnderTest = { exports: {} };
  new Function('module', 'exports', 'require', output)(moduleUnderTest, moduleUnderTest.exports, require);
  return moduleUnderTest.exports;
}

test('Google authentication uses popup on Cloudflare phones and desktops', () => {
  const source = read('src/features/auth/googleSignIn.web.ts');
  assert.match(source, /GoogleAuthProvider/);
  assert.match(source, /prompt: 'select_account'/);
  assert.match(source, /signInWithPopup/);
  assert.doesNotMatch(source, /signInWithRedirect|getRedirectResult|prefersRedirect/);
});

test('only incomplete Google accounts enter continued account creation', () => {
  const { googleAccountNeedsSetup } = loadTypeScript('src/features/auth/googleAccountSetup.ts');
  const details = { birthDate: '2008-10-09', phoneNumber: '+19195550123' };
  assert.equal(googleAccountNeedsSetup(['password'], undefined), false);
  assert.equal(googleAccountNeedsSetup(['password'], details), false);
  assert.equal(googleAccountNeedsSetup(['google.com'], undefined), true);
  assert.equal(googleAccountNeedsSetup(['google.com'], details), false);
  assert.equal(googleAccountNeedsSetup(['google.com'], { ...details, phoneNumber: '' }), false);
});

test('new Google users must finish their private profile before entering CUBO', () => {
  const source = read('src/features/auth/AuthContext.tsx');
  assert.match(source, /provider\.providerId === GoogleAuthProvider\.PROVIDER_ID/);
  assert.match(source, /googleAccountNeedsSetup\(providerIds, existing\.data\(\)\.accountDetails\)/);
  assert.match(source, /setNeedsAccountSetup\(requiresSetup\)/);
  assert.match(source, /completeGoogleAccountSetup/);
  assert.match(source, /accountDetails: validated/);
  assert.match(source, /createdAt: serverTimestamp\(\)/);
  assert.match(source, /await firebaseSignOut\(auth\)/);
});

test('Google account completion screen keeps phone optional and removes redundant success decoration', () => {
  const source = read('src/screens/GoogleAccountSetupScreen.tsx');
  const app = read('App.tsx');
  assert.match(source, /Continue account creation/);
  assert.match(source, /accessibilityLabel="Name"/);
  assert.match(source, /accessibilityLabel="Phone number \(optional\)"/);
  assert.match(source, /accessibilityLabel="Date of birth, month day year"/);
  assert.doesNotMatch(source, /accessibilityLabel="Password"/);
  assert.doesNotMatch(source, /GOOGLE SIGN-UP|shield-checkmark|checkmark-circle/);
  assert.match(source, /await account\.useDifferentAccount\(\)/);
  assert.match(app, /if \(needsAccountSetup\) return <GoogleAccountSetupScreen/);
});

test('switching accounts during Google setup returns directly to regular signup', () => {
  const auth = read('src/features/auth/AuthContext.tsx');
  const flow = read('src/screens/WelcomeFlow.tsx');
  const app = read('App.tsx');
  assert.match(auth, /setSignedOutDestination\('signup'\)/);
  assert.match(auth, /useDifferentAccount/);
  assert.match(app, /signedOutDestination === 'signup' \? 'signup'/);
  assert.match(flow, /useState<'login' \| 'signup'>\(initialMode \?\? 'login'\)/);
  assert.match(flow, /<AuthScreen initialMode=\{authMode\}/);
});

test('optional phone numbers remain valid through client, cloud rules, and profile editing', () => {
  const rules = read('firestore.rules');
  const editor = read('src/components/AccountEditor.tsx');
  const profile = read('src/screens/ProfileScreen.tsx');
  assert.match(rules, /data\.phoneNumber\.size\(\) == 0/);
  assert.match(editor, /Phone number \(optional\)/);
  assert.doesNotMatch(profile, /!accountDetails\?\.phoneNumber/);
});

test('authentication screen keeps one compact Google action without changing email flows', () => {
  const source = read('src/screens/AuthScreen.tsx');
  assert.match(source, /accessibilityLabel="Continue with Google"/);
  assert.match(source, /or continue with/);
  assert.match(source, /Platform\.OS === 'web'/);
  assert.match(source, /auth\/account-exists-with-different-credential/);
  assert.match(source, /if \(mode === 'signup'\) await signUp\(name, email, password/);
  assert.match(source, /else await signIn\(email, password\)/);
  assert.match(source, /accessibilityLabel="Phone number \(optional\)"/);
});
