const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const read = file => fs.readFileSync(file, 'utf8');
const jsx = (type, props) => ({ type, props });
function tabHarness({ index = 0, activeSession = null, prevented = false } = {}) {
  const calls = [];
  const deps = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native': { View: 'View', Text: 'Text', StyleSheet: { create: v => v }, Keyboard: { dismiss: () => calls.push('dismiss') } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 34 }) },
    '../features/drives/DriveContext': { useDrives: () => ({ activeSession }) },
    './MotionPressable': { MotionPressable: 'Button' },
    '../theme/AppearanceContext': { useAppearance: () => ({ colors: {} }) },
  };
  const m = { exports: {} };
  const code = ts.transpileModule(read('src/components/TabBar.tsx'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(id => { assert.ok(deps[id], id); return deps[id]; }, m, m.exports);
  const routes = ['Home', 'Map', 'Activity', 'Garage', 'Account'].map(name => ({ name, key: name + '-key' }));
  const view = m.exports.TabBar({
    state: { index, routes },
    navigation: {
      emit: event => { calls.push(event); return { defaultPrevented: prevented }; },
      navigate: (...args) => calls.push(args),
    },
  });
  return { calls, view, buttons: view?.props.children };
}
test('every bottom tab remains reachable and selects only its intended route', () => {
  for (let current = 0; current < 5; current++) {
    for (let target = 0; target < 5; target++) {
      const { buttons, calls, view } = tabHarness({ index: current });
      assert.equal(view.props.pointerEvents, undefined);
      assert.equal(view.props.style[1].bottom, 34);
      assert.equal(buttons[target].props.accessibilityState.selected, current === target);
      buttons[target].props.onPress();
      assert.equal(calls[0].type, 'tabPress');
      if (current === target) assert.equal(calls.length, 1, 'reselect must not push a duplicate screen');
      else {
        assert.equal(calls[1], 'dismiss');
        assert.deepEqual(calls[2], [buttons[target].props.accessibilityLabel, undefined]);
      }
    }
  }
});
test('tab navigation respects prevented presses, long presses, and active drive lock', () => {
  const { buttons, calls } = tabHarness({ prevented: true });
  buttons[1].props.onPress();
  assert.equal(calls.length, 1);
  buttons[1].props.onLongPress();
  assert.deepEqual(calls[1], { type: 'tabLongPress', target: 'Map-key' });
  assert.equal(tabHarness({ activeSession: { id: 'drive' } }).view, null);
});
test('scrolling detail pages cannot leave primary navigation hidden', () => {
  assert.doesNotMatch(read('src/components/ScreenShell.tsx'), /setHidden|useNavChrome/);
  assert.doesNotMatch(read('src/components/TabBar.tsx'), /useNavChrome|pointerEvents=\{hidden/);
  assert.doesNotMatch(read('App.tsx'), /NavChromeProvider/);
});
test('stack history has a back button, tab history does not add one', () => {
  assert.match(read('src/screens/DrivesScreen.tsx'), /onBack=\{route.name === 'Drives' \? \(\) => navigation.goBack\(\) : undefined\}/);
  assert.match(read('src/components/AppHeader.tsx'), /accessibilityRole="button" accessibilityLabel="Go back"/);
  assert.match(read('src/screens/FamilyScreen.tsx'), /navigation.canGoBack\(\) \? navigation.goBack\(\) : navigation.reset/);
});
test('web and reduced-motion tabs detach immediately; font failures do not block startup', () => {
  const app = read('App.tsx');
  assert.match(app, /animateTabs = Platform.OS !== 'web' && !reduced/);
  assert.match(app, /animation: animateTabs \? 'shift' : 'none'/);
  assert.match(app, /transitionSpec: animateTabs \?/);
  assert.match(app, /fontsReady = fontsLoaded \|\| !!fontError/);
  assert.doesNotMatch(app, /!fontsLoaded/);
});
test('saved-place screen releases GPS and suggestions when it loses focus', () => {
  const saved = read('src/screens/SavedPlaceScreen.tsx');
  assert.match(saved, /useDriveLocation\(focused\)/);
  assert.match(saved, /usePlaceSuggestions\(query, gps.point, focused\)/);
});
test('responsive phone frame preserves the app subtree across every width change', () => {
  let width = 390;
  const child = { type: 'AppState', props: {} };
  const deps = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { useEffect: () => {}, useState: value => [typeof value === 'function' ? value() : value, () => {}] },
    'react-native': { View: 'View', Text: 'Text', StyleSheet: { create: v => v }, useWindowDimensions: () => ({ width, height: 844 }) },
    '../theme/AppearanceContext': { useAppearance: () => ({ colors: {}, mode: 'light' }) },
    '../theme/theme': { shadows: { phone: {} } },
  };
  const m = { exports: {} };
  const code = ts.transpileModule(read('src/components/PhoneFrame.web.tsx'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(id => { assert.ok(deps[id], id); return deps[id]; }, m, m.exports);
  function ancestry(node, path = []) {
    if (node === child) return path;
    if (!node || typeof node !== 'object') return null;
    const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
    for (let i = 0; i < children.length; i++) {
      const found = ancestry(children[i], [...path, node.type + ':' + i]);
      if (found) return found;
    }
    return null;
  }
  const phone = ancestry(m.exports.PhoneFrame({ children: child }));
  assert.ok(phone);
  for (width of [1200, 599, 600, 844, 390]) assert.deepEqual(ancestry(m.exports.PhoneFrame({ children: child })), phone);
});
test('selected controls expose their state to web assistive technology', () => {
  assert.match(read('src/components/MotionPressable.tsx'), /aria-selected=\{accessibilityState\?\.selected\}/);
});

