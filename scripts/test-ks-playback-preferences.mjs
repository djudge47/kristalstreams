import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-preferences-'));
const originals = new Map();
function replace(name, value) { if (!originals.has(name)) originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, writable: true, configurable: true }); }
const a = '88888888-8888-4888-8888-888888888801', b = '88888888-8888-4888-8888-888888888802';
let current = a, getUser, writes = [], reads = [], storageFails = false;
const values = new Map([['client_settings', '{"default_quality":"4k","autoplay_enabled":false}'], ['ks_notifications_enabled', 'true']]);
const callbacks = new Set();
const target = new EventTarget();
Object.assign(target, { localStorage: {
  getItem(key) { reads.push(key); return values.get(key) ?? null; },
  setItem(key, value) { if (storageFails) throw Error('Fictional blocked storage'); writes.push(key); values.set(key, value); },
}, matchMedia: () => ({ matches: false }) });
replace('window', target);
replace('StorageEvent', class extends Event { constructor(type, options) { super(type); this.key = options.key; } });
replace('document', { addEventListener() {}, removeEventListener() {}, fullscreenElement: null, body: { style: {} } });
replace('__preferencesAuth', { auth: {
  getUser: () => getUser(),
  onAuthStateChange(callback) { callbacks.add(callback); return { data: { subscription: { unsubscribe() { callbacks.delete(callback); } } } }; },
}, from() { throw Error('Preferences must not claim profile synchronization or edit profile fields'); } });
const user = () => ({ data: { user: current ? { id: current, is_anonymous: false } : null }, error: null });
getUser = async () => user();
const emit = id => { current = id; for (const callback of [...callbacks]) callback(id ? 'SIGNED_IN' : 'SIGNED_OUT', id ? { user: { id } } : null); };
let hooks;
const same = (a, b) => a && b && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
replace('__preferenceHooks', {
  useState(initial) { const i = hooks.stateIndex++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; return [hooks.states[i], value => { hooks.states[i] = typeof value === 'function' ? value(hooks.states[i]) : value; }]; },
  useRef(initial) { const i = hooks.refIndex++; return hooks.refs[i] ?? (hooks.refs[i] = { current: hooks.injectRefs?.[i] ?? initial }); },
  useEffect(effect, deps) { const i = hooks.effectIndex++; if (!same(hooks.effects[i]?.deps, deps)) { const old = hooks.effects[i]; hooks.effects[i] = { deps }; hooks.pending.push(() => { old?.cleanup?.(); hooks.effects[i].cleanup = effect(); }); } },
  useCallback(callback, deps) { const i = hooks.callbackIndex++; if (!same(hooks.callbacks[i]?.deps, deps)) hooks.callbacks[i] = { callback, deps }; return hooks.callbacks[i].callback; },
});
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const memo=React.memo;export const {useState,useRef,useEffect,useCallback}=globalThis.__preferenceHooks;`;
replace('__hlsInstances', []);
const hlsSource = `export default class FixtureHls {
 static isSupported(){return globalThis.__hlsSupported;} static Events={MANIFEST_PARSED:'manifest',ERROR:'error'};static ErrorTypes={NETWORK_ERROR:'network',MEDIA_ERROR:'media'};
 levels=[{height:2160},{height:480},{height:1080},{height:720}];currentLevel=-1;events={};destroyed=false;
 constructor(){globalThis.__hlsInstances.push(this);}loadSource(src){this.src=src;}attachMedia(video){this.video=video;}on(event,callback){this.events[event]=callback;}destroy(){this.destroyed=true;}startLoad(){}recoverMediaError(){}
}`;
replace('__hlsSupported', true);
replace('__playerPreferences', { loading: false, error: null, preferences: { quality: '720p', autoplay: false } });
let fileNumber = 0;
async function compile(entry, player = false) {
  const built = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react/jsx-runtime', 'lucide-react'], plugins: [{ name: 'preferences-offline', setup(build) {
    build.onResolve({ filter: /^file:/ }, args => ({ path: args.path, external: true }));
    build.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
    build.onResolve({ filter: /(?:\/lib\/supabase$|^\.\/supabase$)/ }, () => ({ path: 'auth', namespace: 'fixture' }));
    build.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
    build.onResolve({ filter: /\/lib\/notifications$/ }, () => { throw Error('Settings must not subscribe or display a test notification'); });
    if (player) {
      build.onResolve({ filter: /\/lib\/usePlaybackPreferences$/ }, () => ({ path: 'preferences', namespace: 'fixture' }));
      build.onResolve({ filter: /^hls.js$/ }, () => ({ path: 'hls', namespace: 'fixture' }));
    }
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'hooks' ? hookSource : args.path === 'auth' ? 'export const supabase=globalThis.__preferencesAuth;' : args.path === 'preferences' ? 'export const usePlaybackPreferences=()=>globalThis.__playerPreferences;' : args.path === 'hls' ? hlsSource : 'export const Link=()=>null;' }));
  } }] });
  const path = join(directory, `${++fileNumber}.mjs`); await writeFile(path, built.outputFiles[0].text); return import(pathToFileURL(path));
}
function unmount() { for (const effect of hooks?.effects ?? []) effect?.cleanup?.(); }
function reset(injectRefs) { unmount(); hooks = { states: [], refs: [], effects: [], callbacks: [], pending: [], stateIndex: 0, refIndex: 0, effectIndex: 0, callbackIndex: 0, injectRefs }; }
function render(Component, props) { hooks.stateIndex = 0; hooks.refIndex = 0; hooks.effectIndex = 0; hooks.callbackIndex = 0; const tree = Component(props); for (const effect of hooks.pending.splice(0)) effect(); return tree; }
const drain = async () => { for (let n = 0; n < 10; n++) await new Promise(resolve => setImmediate(resolve)); };
const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
const text = element => typeof element === 'string' ? element : React.isValidElement(element) ? React.Children.toArray(element.props.children).map(text).join('') : '';
try {
  const api = await compile('src/lib/playback-preferences.ts');
  assert.notEqual(api.playbackPreferencesKey(a), api.playbackPreferencesKey(b));
  for (const value of ['{}', '{"version":1,"quality":"8k","autoplay":true}', '{"version":1,"quality":"auto","autoplay":"false"}', 'x'.repeat(2049)]) assert.throws(() => api.parsePlaybackPreferences(value));
  assert.throws(() => api.playbackPreferencesKey('../other-account'));
  assert.equal(api.preferredVideoLevel([2160, 480, 1080, 720], '720p'), 3);
  assert.equal(api.preferredVideoLevel([360, 720], '1080p'), 1);
  assert.equal(api.preferredVideoLevel([1080, 720], '480p'), 1);
  assert.equal(api.preferredVideoLevel([0, NaN], '4k'), -1);
  assert.equal(api.preferredVideoLevel([480, 720], 'auto'), -1);
  console.log('PASS: versioned per-account keys, strict stored values and real available-rendition selection');
  const { usePlaybackPreferences } = await compile('src/lib/usePlaybackPreferences.ts');
  reset(); render(usePlaybackPreferences); await drain(); let state = render(usePlaybackPreferences);
  assert.equal(state.accountId, a); assert.equal(state.preferences, null);
  assert.ok(!reads.includes('client_settings') && !reads.includes('ks_notifications_enabled'));
  let release; getUser = () => new Promise(resolve => { release = resolve; });
  const first = state.save({ quality: '720p', autoplay: false });
  assert.equal(await state.save({ quality: '4k', autoplay: true }), false);
  release(user()); await first; getUser = async () => user(); state = render(usePlaybackPreferences);
  assert.equal(writes.length, 1); assert.deepEqual(state.preferences, { quality: '720p', autoplay: false });
  emit(b); state = render(usePlaybackPreferences); assert.equal(state.preferences, null); assert.equal(state.loading, true);
  await drain(); state = render(usePlaybackPreferences); assert.equal(state.accountId, b); assert.equal(state.preferences, null);
  emit(a); await drain(); state = render(usePlaybackPreferences); assert.deepEqual(state.preferences, { quality: '720p', autoplay: false });
  console.log('PASS: actual hook ignores ownerless legacy keys, coalesces saves and clears/restores only the signed-in account’s choices');
  const before = writes.length;
  getUser = () => new Promise(resolve => { release = resolve; });
  const pending = state.save({ quality: '4k', autoplay: true });
  getUser = async () => user(); emit(b); release({ data: { user: { id: a } }, error: null });
  assert.equal(await pending, false); await drain(); state = render(usePlaybackPreferences);
  assert.equal(writes.length, before); assert.equal(state.accountId, b); assert.equal(state.preferences, null);
  storageFails = true; assert.equal(await state.save({ quality: 'auto', autoplay: true }), false); state = render(usePlaybackPreferences);
  assert.match(state.error, /not saved/); storageFails = false;
  getUser = async () => ({ data: { user: { id: a } }, error: null });
  assert.equal(await state.save({ quality: 'auto', autoplay: true }), false); state = render(usePlaybackPreferences);
  assert.equal(state.accountId, null); assert.equal(state.preferences, null);
  getUser = async () => user();
  console.log('PASS: delayed old-account saves, blocked storage and a mismatched fresh Auth owner cannot produce a write or retain the old account');
  emit(a); await drain(); state = render(usePlaybackPreferences);
  values.set(api.playbackPreferencesKey(a), '{"version":1,"quality":"480p","autoplay":true}');
  window.dispatchEvent(new StorageEvent('storage', { key: api.playbackPreferencesKey(b) })); state = render(usePlaybackPreferences); assert.equal(state.preferences.quality, '720p');
  window.dispatchEvent(new StorageEvent('storage', { key: api.playbackPreferencesKey(a) })); state = render(usePlaybackPreferences); assert.equal(state.preferences.quality, '480p');
  values.set(api.playbackPreferencesKey(a), '{broken');
  window.dispatchEvent(new CustomEvent(api.playbackPreferencesEvent, { detail: a })); state = render(usePlaybackPreferences); assert.equal(state.preferences, null); assert.match(state.error, /could not be read/);
  const Settings = (await compile('src/pages/client/ClientSettings.tsx')).default;
  values.delete(api.playbackPreferencesKey(a)); reset(); render(Settings); await drain(); render(Settings); let tree = render(Settings);
  const quality = () => nodes(tree).find(element => element.type === 'select');
  quality().props.onChange({ target: { value: '1080p' } }); tree = render(Settings);
  await nodes(tree).find(element => element.type === 'form').props.onSubmit({ preventDefault() {} }); tree = render(Settings); tree = render(Settings);
  assert.match(text(tree), /saved for your account in this browser/); assert.match(text(tree), /do not sync to other browsers/);
  assert.match(text(tree), /translation preferences are not available/);
  storageFails = true; await nodes(tree).find(element => element.type === 'form').props.onSubmit({ preventDefault() {} }); tree = render(Settings);
  assert.doesNotMatch(text(tree), /Playback preferences saved/); assert.match(text(tree), /were not saved/); storageFails = false;
  emit(b); await drain(); tree = render(Settings); assert.equal(quality().props.value, 'auto', 'First render for the next account must not flash the previous draft');
  unmount(); assert.equal(callbacks.size, 0);
  console.log('PASS: storage events are owner-filtered, malformed values show recovery, and the actual form reports saves/failures with no old-account draft flash');
  const Notifications = (await compile('src/components/NotificationSettings.tsx')).default;
  for (const permission of ['unsupported', 'default', 'granted', 'denied']) {
    if (permission === 'unsupported') delete window.Notification; else window.Notification = { permission, requestPermission() { throw Error('Unexpected permission prompt'); } };
    reset(); render(Notifications); tree = render(Notifications);
    assert.match(text(tree), /Automatic website push alerts are not currently available/);
    assert.doesNotMatch(text(tree), /Notifications are enabled|Enabled on this device|Enable Notifications/);
  }
  console.log('PASS: unsupported/granted/denied notification states never claim working delivery or request permission, subscribe or send a test');
  const Player = (await compile('src/components/VideoPlayer.tsx', true)).default.type;
  let plays = 0, pauses = 0;
  const video = { play() { plays++; return Promise.resolve(); }, pause() { pauses++; }, canPlayType() { return ''; }, addEventListener() {}, removeEventListener() {} };
  reset([video, {}]); render(Player, { src: 'https://fixture.invalid/stream.m3u8', autoplay: true });
  let hls = globalThis.__hlsInstances.at(-1); hls.events.manifest(); tree = render(Player, { src: 'https://fixture.invalid/stream.m3u8', autoplay: true });
  assert.equal(plays, 0); assert.ok(pauses > 0); assert.equal(hls.currentLevel, 3);
  assert.ok(nodes(tree).some(element => element.props['aria-label'] === 'Video quality: 720p'));
  globalThis.__playerPreferences = { loading: false, error: null, preferences: { quality: '480p', autoplay: true } };
  render(Player, { src: 'https://fixture.invalid/stream.m3u8', autoplay: true }); assert.equal(hls.destroyed, true);
  hls = globalThis.__hlsInstances.at(-1); hls.events.manifest(); assert.equal(hls.currentLevel, 1); assert.equal(plays, 1);
  globalThis.__playerPreferences = { loading: true, error: null, preferences: null };
  render(Player, { src: 'https://fixture.invalid/stream.m3u8', autoplay: true }); assert.equal(hls.destroyed, true);
  const oldPlays = plays; hls.events.manifest(); assert.equal(plays, oldPlays, 'A stale manifest cannot restart playback after an account change');
  globalThis.__playerPreferences = { loading: false, error: null, preferences: { quality: '4k', autoplay: false } };
  render(Player, { src: 'https://fixture.invalid/video.mp4', autoplay: true }); assert.equal(plays, oldPlays);
  window.matchMedia = () => ({ matches: true });
  document.body.style.overflow = 'scroll'; document.body.style.overscrollBehavior = 'contain';
  reset([video, {}]);
  tree = render(Player, { src: 'https://fixture.invalid/video.mp4', autoplay: true, immersive: false });
  assert.equal(document.body.style.overflow, 'scroll');
  assert.equal(document.body.style.overscrollBehavior, 'contain');
  assert.ok(tree.props.className.includes('aspect-video w-full'));
  assert.ok(!tree.props.className.includes('100dvh'));
  console.log('PASS: actual player consumes saved quality/autoplay, pauses while account preferences change and discards stale HLS callbacks');
  console.log('6 playback/settings regression groups passed. No connected database, profile update, permission prompt, push subscription, notification or media request occurred.');
} finally {
  unmount();
  for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  await rm(directory, { recursive: true, force: true });
}
