const { build } = require('esbuild');
const path = require('node:path');
build({ entryPoints: [path.join(__dirname, '../src/features/cuboAI/inference.worker.ts')], outfile: path.join(__dirname, '../dist/cubo-ai-worker.js'), bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], minify: true, legalComments: 'eof' }).catch(error => { console.error(error); process.exitCode = 1; });
