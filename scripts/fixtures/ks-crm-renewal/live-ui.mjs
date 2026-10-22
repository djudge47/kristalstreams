import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';

// Actual component hooks/click/fetch path -> actual authenticated shared route ->
// actual executor/ledger -> isolated SQL. Fake provider only, never a browser
// login or a connected database. Effects run to test tab-reload restoration.
export async function runLiveUiChecks({ admin, worker, check, liveFixture }) {
  const originalFetch = globalThis.fetch, originalWindow = globalThis.window, originalStorage = globalThis.sessionStorage;
  const reactPath = createRequire(import.meta.url).resolve('react');
  const dir = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-live-ui-'));
  try {
    const output = await build({ entryPoints: ['src/pages/admin/LiveRenewalControls.tsx'], bundle: true, write: false,
      platform: 'node', format: 'esm', jsx: 'automatic', external: ['react/jsx-runtime'],
      plugins: [{ name: 'live-renewal-fixture', setup(builder) {
        builder.onResolve({ filter: new RegExp('^' + reactPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }, () => ({ path: reactPath, external: true }));
        builder.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
        builder.onResolve({ filter: /\/lib\/supabase$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents: args.path === 'hooks'
          ? `import React from ${JSON.stringify(reactPath)}; export default React;
            export const useState=initial=>{const s=globalThis.__ksLiveHooks,i=s.cursor++;if(!(i in s.values))s.values[i]=initial;return[s.values[i],v=>{s.values[i]=typeof v==='function'?v(s.values[i]):v;}];};
            export const useRef=initial=>{const s=globalThis.__ksLiveHooks,i=s.cursor++;if(!(i in s.values))s.values[i]={current:initial};return s.values[i];};
            export const useEffect=(effect,deps)=>{const s=globalThis.__ksLiveHooks,i=s.cursor++,old=s.values[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))s.effects.push(()=>{old?.cleanup?.();s.values[i]={deps:[...deps],cleanup:effect()};});};`
          : 'export const supabase={auth:{getSession:async()=>({data:{session:{access_token:"fictional-admin"}}})}};' }));
      } }] });
    const path = join(dir, 'component.mjs'); await writeFile(path, output.outputFiles[0].text);
    const { default: Component } = await import(pathToFileURL(path).href);
    globalThis.window = { setTimeout: () => 1, clearTimeout() {} };
    let f, props, storage, requests;
    const render = () => {
      const s = globalThis.__ksLiveHooks; s.cursor = 0; s.effects = [];
      const tree = Component(props); for (const effect of s.effects) effect(); return tree;
    };
    const mount = () => {
      for (const value of globalThis.__ksLiveHooks?.values || []) value?.cleanup?.();
      globalThis.__ksLiveHooks = { cursor: 0, values: [], effects: [] }; render(); return render();
    };
    const connect = fixture => {
      f = fixture; props = { customerId: f.customer, panelId: Number(f.line), username: f.username, hasSourceReview: true };
      storage = new Map(); requests = [];
      globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value), removeItem: key => storage.delete(key) };
      globalThis.fetch = (url, options) => {
        const parsed = new URL(url, 'https://fictional.example.invalid');
        assert.equal(parsed.pathname, '/api/ks-roomba-crm');
        assert.equal(options.headers.Authorization, 'Bearer fictional-admin');
        const body = options.body ? JSON.parse(options.body) : undefined;
        const request = f.request(parsed.searchParams.get('view'), body).then(res =>
          new Response(JSON.stringify(res.body), { status: res.code, headers: { 'Content-Type': 'application/json' } }));
        requests.push(request); return request;
      };
      mount();
    };
    const all = (tree, predicate) => {
      if (!tree || typeof tree !== 'object') return [];
      if (Array.isArray(tree)) return tree.flatMap(node => all(node,predicate));
      return [...(predicate(tree) ? [tree] : []), ...all(tree.props?.children,predicate)];
    };
    const button = label => all(render(), n => n.type === 'button' && JSON.stringify(n.props.children).includes(label))[0];
    const click = async label => {
      const b = button(label); assert.ok(b, label); assert.equal(b.props.disabled, false, label); b.props.onClick();
      await new Promise(resolve => setImmediate(resolve)); await Promise.all(requests); await new Promise(resolve => setImmediate(resolve));
    };
    const confirm = () => {
      const inputs = all(render(), n => n.type === 'input'); assert.equal(inputs.length, 2);
      for (const input of inputs) input.props.onChange({ target: { checked: true } });
    };
    await check('actual live CRM readiness click reports disabled without provider reads or approval controls', async () => {
      const fixture = await liveFixture(admin,worker); fixture.env.KS_CRM_LIVE_RENEWAL_ENABLED = 'false'; connect(fixture);
      assert.equal(requests.length, 0); await click('Check renewal readiness');
      const markup = renderToStaticMarkup(render()); assert.ok(markup.includes('Live renewal is off'));
      assert.equal(button('Confirm and send'), undefined); assert.equal(f.state.snapshots, 0); assert.equal(f.state.calls, 0);
    });
    await check('actual live CRM confirmation path sends one fictional renewal through authenticated HTTP and SQL', async () => {
      connect(await liveFixture(admin,worker)); await click('Check renewal readiness'); confirm(); await click('Prepare fresh');
      assert.ok(renderToStaticMarkup(render()).includes('Cost: 12 provider credits'));
      assert.equal(button('Confirm and send').props.disabled, true); confirm(); await click('Confirm and send');
      assert.ok(renderToStaticMarkup(render()).includes('Renewal verified and CRM expiration saved'));
      assert.equal(f.state.calls, 1); assert.equal(storage.size, 0);
    });
    await check('live preparation requires the displayed customer renewal review before either confirmation is offered', async () => {
      connect(await liveFixture(admin,worker)); props.hasSourceReview = false; await click('Check renewal readiness');
      assert.equal(button('Prepare fresh'), undefined); assert.ok(renderToStaticMarkup(render()).includes('Select Review renewal above'));
      assert.equal(f.state.snapshots, 0); assert.equal(f.state.calls, 0);
    });
    await check('actual tab reload restores the pending signed attempt and checks a lost completion reply without sending again', async () => {
      connect(await liveFixture(admin,worker,{ fault: 'complete_reply_lost' }));
      await click('Check renewal readiness'); confirm(); await click('Prepare fresh'); confirm(); await click('Confirm and send');
      assert.equal(f.state.calls, 1); assert.equal(storage.size, 1);
      f.state.now += 360001; mount();
      assert.equal(button('Check renewal readiness'), undefined); assert.ok(button('Check this renewal attempt'));
      assert.equal(button('Confirm and send'), undefined);
      await click('Check this renewal attempt');
      assert.equal(f.state.calls, 1); assert.equal(storage.size, 0);
      assert.ok(renderToStaticMarkup(render()).includes('Renewal verified and CRM expiration saved'));
    });
  } finally {
    for (const value of globalThis.__ksLiveHooks?.values || []) value?.cleanup?.();
    delete globalThis.__ksLiveHooks; globalThis.fetch = originalFetch; globalThis.window = originalWindow;
    globalThis.sessionStorage = originalStorage; await rm(dir,{ recursive: true, force: true });
  }
}
