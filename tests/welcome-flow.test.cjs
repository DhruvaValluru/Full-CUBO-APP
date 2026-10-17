const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('carousel bundles six distinct compact JPEG photographs', () => {
  const source = read('src/components/WelcomeCarousel.tsx');
  const assets = [...source.matchAll(/require\('\.\.\/\.\.\/(assets\/[^']+)'\)/g)].map(match => match[1]);
  assert.equal(assets.length, 6);
  const hashes = assets.map(asset => {
    const bytes = fs.readFileSync(path.join(root, asset));
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    assert.ok(bytes.length < 500000, `${asset} should remain mobile-sized`);
    return crypto.createHash('sha256').update(bytes).digest('hex');
  });
  assert.equal(new Set(hashes).size, 6);
  assert.match(source, /pagingEnabled/);
  assert.match(source, /accessibilityState=\{\{ selected: page === index \}\}/);
  assert.doesNotMatch(source, /setInterval/);
});

test('shared welcome flow replaces instant screen swap and supports reduced motion/back', () => {
  const flow = read('src/screens/WelcomeFlow.tsx');
  const app = read('App.tsx');
  assert.match(app, /if \(!user\) return <WelcomeFlow \/>/);
  assert.doesNotMatch(app, /hasStarted/);
  assert.match(flow, /duration: reduced \? 140 : login \? 440 : 340/);
  assert.match(flow, /hardwareBackPress/);
  assert.match(flow, /if \(locked.current/);
  assert.match(flow, /return \(\) => animation.stop\(\)/);
  assert.match(flow, /if \(!login\) setMounted\(false\)/);
});
