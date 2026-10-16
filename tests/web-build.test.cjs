const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dist = path.resolve(__dirname, '../dist');
function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
test('fonts and dependency assets survive Pages upload exclusions', () => {
  const vendor = filesIn(path.join(dist, 'assets/vendor'));
  for (const font of ['Manrope_400Regular', 'Manrope_500Medium', 'Manrope_600SemiBold', 'Manrope_700Bold', 'Manrope_800ExtraBold', 'Ionicons']) {
    const asset = vendor.find(file => path.basename(file).startsWith(font + '.') && file.endsWith('.ttf'));
    assert.ok(asset, `Missing deployable ${font} font`);
    assert.ok(fs.statSync(asset).size > 1000);
  }
  const bundles = filesIn(path.join(dist, '_expo')).filter(file => file.endsWith('.js'));
  assert.ok(bundles.length);
  for (const bundle of bundles) {
    const source = fs.readFileSync(bundle, 'utf8');
    assert.ok(!source.includes('/assets/node_modules/'), 'Bundle points into excluded node_modules');
    for (const match of source.matchAll(/"(\/assets\/vendor\/[^"?]+)"/g)) {
      // Metro may use a directory prefix plus an asset filename at runtime.
      assert.ok(fs.existsSync(path.join(dist, match[1])), `Missing exported asset ${match[1]}`);
    }
  }
});
test('export contains install metadata and accessible viewport', () => {
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.match(html, /rel="manifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /viewport-fit=cover/);
  assert.doesNotMatch(html, /user-scalable=no/);
  assert.match(html, /<script[^>]+src=/);
});
test('manifest uses local icon and same-origin launch', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  for (const icon of manifest.icons) {
    const bytes = fs.readFileSync(path.join(dist, icon.src));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
  }
});
test('headers allow camera and GPS only from this app', () => {
  const headers = fs.readFileSync(path.join(dist, '_headers'), 'utf8');
  assert.match(headers, /camera=\(self\)/);
  assert.match(headers, /geolocation=\(self\)/);
  assert.match(headers, /Cache-Control: no-cache/);
});
