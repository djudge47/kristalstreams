import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// Exercise the real component's event handlers with hook/router/Auth doubles.
// This does not simulate browser layout or authenticate a real account.
const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-login-flow-'));
try {
  const result = await build({ entryPoints: ['src/pages/Login.tsx'], bundle: true, write: false,
    format: 'esm', platform: 'node', jsx: 'transform', plugins: [{ name: 'isolated-login', setup(builder) {
      builder.onResolve({ filter: /^(react|react-router-dom)$|\/lib\/supabase$/ }, args => ({ path: args.path, namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents:
        args.path === 'react' ? `
          export default {createElement:(type,props,...children)=>({type,props:{...props,children}})};
          export const useEffect=()=>{};
          export function useState(initial){const f=globalThis.ksLoginFixture,i=f.cursor++;
            if(!(i in f.state))f.state[i]=typeof initial==='function'?initial():initial;
            return [f.state[i],value=>{f.state[i]=typeof value==='function'?value(f.state[i]):value;}];}
        ` : args.path === 'react-router-dom' ? `
          export const Link='link';
          export const useLocation=()=>globalThis.ksLoginFixture.location;
          export const useNavigate=()=>globalThis.ksLoginFixture.navigate;
        ` : `
          export const hasSupabaseConfig=globalThis.ksLoginFixture.configured;
          export const supabase={auth:{
            signInWithPassword:(...args)=>globalThis.ksLoginFixture.signIn(...args),
            resetPasswordForEmail:(...args)=>globalThis.ksLoginFixture.reset(...args)}};
        ` }));
    } }],
  });
  const file = join(directory, 'login.mjs'); await writeFile(file, result.outputFiles[0].text);
  let run = 0;
  async function fixture({ configured = true, from = '/admin/roomba', signIn, reset } = {}) {
    const f = { configured, cursor: 0, state: [], location: { state: { from } }, navigations: [],
      navigate: (...args) => f.navigations.push(args),
      signIn: signIn ?? (async () => ({ data: { session: { user: { id: 'fixture' } } }, error: null })),
      reset: reset ?? (async () => ({ error: null })),
    };
    globalThis.ksLoginFixture = f;
    const { default: Login } = await import(`${pathToFileURL(file).href}?case=${run++}`);
    f.render = () => { f.cursor = 0; return Login(); };
    f.render(); return f;
  }
  function nodes(tree) {
    if (!tree || typeof tree !== 'object') return [];
    return [tree, ...(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)];
  }
  const form = f => nodes(f.render()).find(node => node.type === 'form');
  const text = f => JSON.stringify(f.render());
  const submit = async f => form(f).props.onSubmit({ preventDefault() {} });
  const retryEnabled = f => {
    const button = nodes(f.render()).find(node => node.type === 'button' && node.props.type === 'submit');
    assert.equal(button.props.disabled, false);
  };
  let count = 0;
  async function check(label, action) { await action(); count++; console.log(`PASS: ${label}`); }

  await check('a successful sign-in returns to Admin → Roomba', async () => {
    const f = await fixture(); await submit(f);
    assert.deepEqual(f.navigations, [['/admin/roomba', { replace: true }]]);
  });
  await check('the existing free-trial return still works', async () => {
    const f = await fixture({ from: '/free-trial' }); await submit(f);
    assert.equal(f.navigations[0][0], '/free-trial');
  });
  await check('returned invalid-credential errors keep the user on the form and allow retry', async () => {
    const f = await fixture({ signIn: async () => ({ data: { session: null }, error: { message: 'Invalid login credentials' } }) });
    await submit(f); assert.equal(f.navigations.length, 0); assert.match(text(f), /Invalid email or password/); retryEnabled(f);
  });
  await check('a rejected sign-in request clears the loading state without navigating', async () => {
    const f = await fixture({ signIn: async () => { throw new Error('fixture connection failure'); } });
    await submit(f); assert.equal(f.navigations.length, 0); assert.match(text(f), /Could not connect to account sign-in/); retryEnabled(f);
  });
  await check('a response without a session cannot claim sign-in success', async () => {
    const f = await fixture({ signIn: async () => ({ data: { session: null }, error: null }) });
    await submit(f); assert.equal(f.navigations.length, 0); assert.match(text(f), /Sign-in did not complete/); retryEnabled(f);
  });
  await check('missing Preview configuration shows a useful error without an Auth request', async () => {
    let calls = 0;
    const f = await fixture({ configured: false, signIn: async () => { calls++; throw new Error('must not call'); } });
    await submit(f); assert.equal(calls, 0); assert.match(text(f), /sign-in is unavailable on this preview/); retryEnabled(f);
  });
  await check('password recovery links to its dedicated public page without invoking Auth', async () => {
    let calls = 0;
    const f = await fixture({ reset: async () => { calls++; throw new Error('must not call from Login'); } });
    const link = nodes(f.render()).find(node => node.type === 'link' && node.props.to === '/forgot-password');
    assert.ok(link); assert.equal(calls, 0); assert.equal(nodes(f.render()).filter(node => node.type === 'form').length, 1);
  });
  console.log(`${count} isolated login-handler checks passed. No browser or live Auth request.`);
} finally { delete globalThis.ksLoginFixture; await rm(directory, { recursive: true, force: true }); }
