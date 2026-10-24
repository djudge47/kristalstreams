import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
assert.equal(require('react-router-dom/package.json').version, '7.18.4');
assert.equal(require('react-router/package.json').version, '7.18.4');
assert.equal(require('postcss-selector-parser/package.json').version, '6.1.5');
assert.equal(lock.packages['node_modules/postcss-selector-parser'].integrity,
  'sha512-TEHFzb5KRDKaOgJ4TYE+0jyJtFbjLvkdVOu0fZ2b6MTWzoqZd4Le+61aEppWkvTlYePgOX4ATL1wsAIPMLTw6Q==');
assert.equal(typeof require('react-router-dom').StaticRouter, 'function');
console.log('PASS: installed router versions and the maintainer’s patched parser match the reviewed lockfile; the v7 static-router export is available.');

// GHSA-rj75-hqrm-r3gf: a shallow 400 KB selector formerly took ~34 seconds.
// Run the real installed parser in a separate process so a regression is bounded.
const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
  import assert from 'node:assert/strict';
  import parser from 'postcss-selector-parser';
  const selector = '.a#b'.repeat(100000);
  const ast = parser().astSync(selector);
  assert.equal(ast.nodes[0].nodes.length, 200000);
  assert.equal(ast.toString(), selector);
  const corpus = [':is(.a,#b) > [data-x="a b"]::before', '.hover\\\\:bg-red-500:hover', '.a:has(> img[src*="leagues-cup-2026"])', '.w-1\\\\/4.flex-shrink-0'];
  for (const input of corpus) assert.equal(parser().processSync(input), input);
  console.log(JSON.stringify({ bytes: selector.length, nodes: ast.nodes[0].nodes.length }));
`], { encoding: 'utf8', timeout: 15000, maxBuffer: 100000 });
assert.equal(child.error, undefined, 'Patched selector parsing exceeded the bounded regression runtime');
assert.equal(child.status, 0, child.stderr);
assert.deepEqual(JSON.parse(child.stdout), { bytes: 400000, nodes: 200000 });
console.log('PASS: actual parser completes the 400 KB flat-selector security regression within 15 seconds and preserves escaped/nested selectors.');

// Baseline: reviewed Subscription ownership/mobile repair, October 24, 2026.
// Eight unused legacy subscription rules removed; every shared rule unchanged.
// An intentional future styling change must replace this baseline after review.
const expected = 'c4d0cdb8af063ddae829b2f656eee490d594122774f6c94a5971b60136eab241';
const files = (await readdir('dist/assets')).filter(name => name.endsWith('.css'));
assert.equal(files.length, 1, 'Review changes to CSS splitting before accepting a new baseline');
const css = await readFile(`dist/assets/${files[0]}`);
assert.equal(createHash('sha256').update(css).digest('hex'), expected,
  'Generated stylesheet differs from the approved mobile/desktop baseline');
console.log('PASS: the complete generated stylesheet matches the fixed reviewed baseline.');
