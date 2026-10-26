import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-download-'));
const originals = new Map();
function replace(name, value) { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, writable: true, configurable: true }); }
replace('fetch', () => { throw Error('Device setup must not invoke connected services'); });
let hooks, standalone = false;
const listeners = new Map();
replace('window', { scrollTo() {}, matchMedia: () => ({ matches: standalone }),
  addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
  removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
  dispatchEvent(event) { for (const callback of [...(listeners.get(event.type) ?? [])]) callback(event); return !event.defaultPrevented; },
});
replace('__downloadHooks', {
  useState(initial) { const i = hooks.stateIndex++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; return [hooks.states[i], value => { hooks.states[i] = typeof value === 'function' ? value(hooks.states[i]) : value; }]; },
  useRef(initial) { const i = hooks.refIndex++; return hooks.refs[i] ?? (hooks.refs[i] = { current: initial }); },
  useEffect(effect) { if (!hooks.mounted) { hooks.mounted = true; hooks.pending.push(() => { hooks.cleanup = effect(); }); } },
});
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useEffect}=globalThis.__downloadHooks;`;
const offlinePlugin = { name: 'download-offline', setup(b) {
  b.onResolve({ filter: /(?:^|\/)lib\/(?:api|supabase)$|^\.\/supabase$/ }, () => { throw Error('Download page imported a connected client'); });
  b.onResolve({ filter: /^file:/ }, args => ({ path: args.path, external: true }));
  b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
  b.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'hooks' ? hookSource : `import React from ${JSON.stringify(import.meta.resolve('react'))};export const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);` }));
} };
const output = await build({ entryPoints: ['src/pages/DownloadApp.tsx'], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', packages: 'external', plugins: [offlinePlugin] });
const file = join(directory, 'page.mjs'); await writeFile(file, output.outputFiles[0].text);
const Component = (await import(pathToFileURL(file))).default;
const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
const text = element => typeof element === 'string' ? element : React.isValidElement(element) ? React.Children.toArray(element.props.children).map(text).join('') : '';
const markup = tree => renderToStaticMarkup(tree);
const button = tree => nodes(tree).find(node => node.type === 'button');
function unmount() { hooks?.cleanup?.(); }
function fresh(value = false) { unmount(); standalone = value; hooks = { states: [], refs: [], pending: [], stateIndex: 0, refIndex: 0, mounted: false }; }
function render() { hooks.stateIndex = 0; hooks.refIndex = 0; const tree = Component(); for (const effect of hooks.pending.splice(0)) effect(); return tree; }
function offer(prompt = async () => {}, userChoice = Promise.resolve({ outcome: 'accepted' })) {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice }); window.dispatchEvent(event); return event;
}
try {
  fresh(); render(); let tree = render();
  assert.match(text(tree), /Build 2026102001/); assert.match(text(tree), /Download Android APK/); assert.match(text(tree), /keep your current installation and saved users/);
  assert.match(text(tree), /Signing out of the website does not sign out of the TV app/);
  assert.match(text(tree), /does not install or update the Android streaming app/);
  assert.equal(button(tree), undefined);
  const html = markup(tree);
  assert.match(html, /href="\/downloads\/KristalStreams\.apk\?v=2026102001"/);
  assert.doesNotMatch(html, /download=/);
  assert.doesNotMatch(html, /temporarily unavailable|Version 9506|Android 7\.0|Supported devices|<video|<iframe/);
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.ok(hrefs.includes('mailto:support@kristalstream.com'));
  const app = await readFile('src/App.tsx', 'utf8');
  const exactPaths = new Set([...app.matchAll(/<Route path="([^"]+)"/g)].map(match => '/' + match[1].split('/').filter(Boolean).join('/')));
  for (const href of hrefs.filter(link => link.startsWith('/') && !link.startsWith('/downloads/'))) assert.ok(exactPaths.has(href), `Device setup destination missing: ${href}`);
  console.log('PASS: actual page restores the approved Android APK download, preserves saved-user guidance and keeps website shortcuts separate');

  fresh(true); render(); tree = render(); assert.match(text(tree), /Website shortcut available/); assert.equal(button(tree), undefined);
  const ignored = offer(() => { throw Error('An installed context must not prompt again'); }); assert.equal(ignored.defaultPrevented, false);
  fresh(); render(); window.dispatchEvent(new Event('appinstalled')); tree = render(); assert.match(text(tree), /Website shortcut available/);
  assert.doesNotMatch(text(tree), /Android app installed|streaming app installed/i);
  console.log('PASS: standalone and actual appinstalled events confirm only website shortcut availability; they never certify native installation');

  fresh(); render(); let calls = 0, release;
  const offered = offer(() => { calls++; return new Promise(resolve => { release = resolve; }); }); assert.equal(offered.defaultPrevented, true);
  tree = render(); const click = button(tree).props.onClick; const first = click(), duplicate = click(); tree = render();
  assert.equal(calls, 1); assert.equal(button(tree).props.disabled, true);
  release(); await Promise.all([first, duplicate]); tree = render();
  assert.match(text(tree), /installation requested/); assert.doesNotMatch(text(tree), /Website shortcut available/); assert.equal(button(tree), undefined);
  window.dispatchEvent(new Event('appinstalled')); tree = render(); assert.match(text(tree), /Website shortcut available/); assert.doesNotMatch(text(tree), /installation requested/);
  console.log('PASS: duplicate install clicks prompt once, busy state disables the control, accepted choice is only a request and completion waits for browser evidence');

  fresh(); render(); offer(async () => {}, Promise.resolve({ outcome: 'dismissed' })); tree = render(); await button(tree).props.onClick(); tree = render();
  assert.match(text(tree), /was dismissed/); assert.doesNotMatch(text(tree), /Website shortcut available/);
  fresh(); render(); offer(async () => { throw Error('Fictional raw service detail'); }); tree = render(); await button(tree).props.onClick(); tree = render();
  assert.match(text(tree), /could not be installed/); assert.doesNotMatch(text(tree), /Fictional raw|Website shortcut available/);
  fresh(); render(); let finish;
  offer(() => new Promise(resolve => { finish = resolve; })); tree = render(); const waiting = button(tree).props.onClick(); const states = [...hooks.states]; unmount(); finish(); await waiting;
  assert.deepEqual(hooks.states, states); assert.ok([...listeners.values()].every(set => set.size === 0));
  fresh(); render(); let confirm;
  offer(() => new Promise(resolve => { confirm = resolve; })); tree = render(); const installing = button(tree).props.onClick(); window.dispatchEvent(new Event('appinstalled')); confirm(); await installing; tree = render();
  assert.match(text(tree), /Website shortcut available/); assert.doesNotMatch(text(tree), /installation requested/);
  console.log('PASS: dismissed/failed requests are truthful and sanitized, completion during a pending prompt wins, and unmount removes listeners and discards late UI updates');
  const promoOutput = await build({ entryPoints: ['src/components/InstallPrompt.tsx'], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', packages: 'external', plugins: [offlinePlugin] });
  const promoFile = join(directory, 'prompt.mjs'); await writeFile(promoFile, promoOutput.outputFiles[0].text);
  const Prompt = (await import(pathToFileURL(promoFile))).default;
  let timerCallback, cleared = 0;
  window.setTimeout = callback => { timerCallback = callback; return 1; };
  window.clearTimeout = () => { cleared++; };
  replace('localStorage', { getItem() { throw Error('fictional blocked storage'); }, setItem() { throw Error('fictional blocked storage'); } });
  const renderPrompt = () => { hooks.stateIndex = 0; hooks.refIndex = 0; const tree = Prompt(); for (const effect of hooks.pending.splice(0)) effect(); return tree; };
  fresh(); assert.equal(renderPrompt(), null); timerCallback(); tree = renderPrompt();
  assert.match(markup(tree), /Apps &amp; Device Setup/); assert.match(markup(tree), /href="\/download-app"/);
  assert.match(text(tree), /Keep your current app and saved users/);
  assert.doesNotMatch(markup(tree), /\.apk|Get APK|build 9506|Direct verified|unknown sources/);
  nodes(tree).find(node => node.type === 'button').props.onClick(); assert.equal(renderPrompt(), null);
  unmount(); assert.equal(cleared, 1);
  fresh(true); assert.equal(renderPrompt(), null);
  console.log('PASS: global setup reminder links only to reviewed help, preserves installed apps, dismisses with blocked storage and cleans its timer; standalone mode stays quiet');
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  const attachment = config.routes.find(rule => rule.headers?.['Content-Disposition']);
  assert.ok(attachment && attachment.continue === true);
  assert.equal(attachment.headers['Content-Disposition'], 'attachment; filename="KristalStreams.apk"');
  assert.equal(attachment.headers['Content-Type'], 'application/vnd.android.package-archive');
  assert.ok(config.routes.indexOf(attachment) < config.routes.findIndex(rule => rule.handle === 'filesystem'));
  assert.ok(new RegExp(attachment.src).test('/downloads/KristalStreams.apk'));
  assert.ok(!new RegExp(attachment.src).test('/client/dashboard'));
  const workerEvents = new Map(), intercepted = [], deleted = [];
  let workerFetches = 0;
  runInNewContext(await readFile('public/sw.js', 'utf8'), {
    URL, self: { location: { origin: 'https://fixture.invalid' }, clients: { claim: async () => {} },
      addEventListener: (name, handler) => workerEvents.set(name, handler) },
    fetch: async () => { workerFetches++; return { status: 200, clone: () => ({}) }; },
    caches: { open: async () => ({ put: async () => {} }),
      keys: async () => ['kristal-streams-v5', 'kristal-runtime-v5', 'kristal-streams-v8', 'kristal-runtime-v8'],
      delete: async name => { deleted.push(name); } },
  });
  for (const path of ['/downloads/KristalStreams.apk', '/downloads/KristalStreams.apk?v=2026102001', '/api/example']) {
    workerEvents.get('fetch')({ request: { method: 'GET', url: `https://fixture.invalid${path}` }, respondWith: () => assert.fail('Installer/API requests must bypass offline caching') });
  }
  assert.equal(workerFetches, 0);
  workerEvents.get('fetch')({ request: { method: 'GET', url: 'https://fixture.invalid/assets/example.js' }, respondWith: p => intercepted.push(p) });
  await Promise.all(intercepted); assert.equal(workerFetches, 1);
  let activated;
  workerEvents.get('activate')({ waitUntil: p => { activated = p; } }); await activated;
  assert.deepEqual(deleted.sort(), ['kristal-runtime-v5', 'kristal-streams-v5']);
  console.log('PASS: ordinary APK navigation receives attachment headers; installer requests bypass the real service worker and old offline caches are removed');
  console.log('6 device-setup/download regression groups passed. No real installer, browser prompt, connected account, provider, mail or payment was accessed.');
} finally {
  unmount(); for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  await rm(directory, { recursive: true, force: true });
}
