// Package Expo's static output for Cloudflare Pages; never uploads anything.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
// Pages excludes node_modules directories, including Expo's exported font paths.
// Relocate dependencies and rewrite bundle URLs before anything is uploaded.
const dependencyAssets = path.join(dist, 'assets', 'node_modules');
const vendorAssets = path.join(dist, 'assets', 'vendor');
if (fs.existsSync(dependencyAssets)) {
  fs.cpSync(dependencyAssets, vendorAssets, { recursive: true });
}
function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
for (const file of filesIn(dist)) {
  if (!/\.(js|css|html|json)$/.test(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const updated = source.replaceAll('/assets/node_modules/', '/assets/vendor/');
  if (source !== updated) fs.writeFileSync(file, updated);
}
const htmlPath = path.join(dist, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('</head>')) throw new Error('Export is missing an HTML head.');
if (!html.includes('<!-- CUBO standalone -->')) {
  html = html.replace(/<link\b[^>]*rel="(?:shortcut )?icon"[^>]*>/gi, '');
}
fs.copyFileSync(path.join(root, 'assets', 'cubo-eye-mark.png'), path.join(dist, 'app-icon.png'));
const manifest = {
  id: '/', name: 'CUBO', short_name: 'CUBO',
  description: 'Stay Alert. Stay Alive.', start_url: '/', scope: '/',
  display: 'standalone', background_color: '#FFFFFF', theme_color: '#166B50',
  icons: [{ src: '/app-icon.png', sizes: '1254x1254', type: 'image/png', purpose: 'any' }],
};
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
// Keep zoom accessible, and let Safari account for the notch/home indicator.
html = html.replace(/<meta\s+name="viewport"[^>]*>/i,
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">');
const marker = '<!-- CUBO standalone -->';
if (!html.includes(marker)) html = html.replace('</head>', `${marker}
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" href="/app-icon.png">
<link rel="apple-touch-icon" href="/app-icon.png">
<meta name="theme-color" content="#166B50">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="CUBO">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<style>html,body,#root{height:100%;}body{margin:0;}@supports(height:100dvh){html,body,#root{height:100dvh;}}</style>
</head>`);
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(path.join(dist, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)
  X-Frame-Options: DENY
/
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/manifest.webmanifest
  Cache-Control: no-cache
/_expo/static/js/*
  Cache-Control: no-cache
/assets/vendor/*.ttf
  Content-Type: font/ttf
`);
// No 404.html: Pages falls back to index.html for client-side navigation.
console.log('CUBO web package ready in dist (online-only; no personal-data cache).');
