import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { matchRoutes } from 'react-router-dom';
import ts from 'typescript';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-admin-modules-'));
const originals = new Map();
function replace(name, value) { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, writable: true, configurable: true }); }
replace('fetch', () => { throw Error('Unavailable modules must not call a service'); });
replace('window', { innerWidth: 1280 });
let hooks, authResult, location = '/admin/modules', redirects = [], authReads = 0;
const same = (a, b) => a && b && a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
replace('__adminModuleHooks', {
  useState(initial) { const i = hooks.stateIndex++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; return [hooks.states[i], value => { hooks.states[i] = typeof value === 'function' ? value(hooks.states[i]) : value; }]; },
  useEffect(effect, deps) { const i = hooks.effectIndex++; if (!same(hooks.effects[i]?.deps, deps)) { const old = hooks.effects[i]; hooks.effects[i] = { deps }; hooks.pending.push(() => { old?.cleanup?.(); hooks.effects[i].cleanup = effect(); }); } },
});
replace('__adminModuleAuth', { auth: {
  getUser() { authReads++; return authResult(); }, signOut() { throw Error('Rendering module navigation must not sign out an account'); },
}, from() { throw Error('Module navigation must not read or write a table'); }, functions: { invoke() { throw Error('Module navigation must not invoke provider services'); } } });
const navigate = (...args) => redirects.push(args);
replace('__adminModuleRouter', { useLocation: () => ({ pathname: location, search: '', hash: '' }), useNavigate: () => navigate });
const hooksSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useEffect}=globalThis.__adminModuleHooks;`;
let number = 0;
async function compile(entry, layout = false) {
  const built = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', packages: 'external', plugins: [{ name: 'admin-modules-offline', setup(b) {
    b.onResolve({ filter: /(?:^|\/)lib\/(?:api|supabase)$|^\.\/supabase$/ }, () => {
      if (!layout) throw Error('Unavailable module imported a connected client');
      return { path: 'auth', namespace: 'fixture' };
    });
    if (layout) {
      b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
      b.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
    }
    b.onResolve({ filter: /^file:/ }, args => ({ path: args.path, external: true }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'auth' ? 'export const supabase=globalThis.__adminModuleAuth;' : args.path === 'hooks' ? hooksSource : `import React from ${JSON.stringify(import.meta.resolve('react'))};export const {useLocation,useNavigate}=globalThis.__adminModuleRouter;export const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);export const Outlet=()=>React.createElement('div',{'data-outlet':'fixture'});` }));
  } }] });
  const path = join(directory, `${++number}.mjs`); await writeFile(path, built.outputFiles[0].text); return import(pathToFileURL(path));
}
const render = (Component, path) => renderToStaticMarkup(React.createElement(StaticRouter, { location: path }, React.createElement(Component)));
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
const drain = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
function unmount() { for (const effect of hooks?.effects ?? []) effect?.cleanup?.(); }
function fresh() { unmount(); hooks = { states: [], effects: [], pending: [], stateIndex: 0, effectIndex: 0 }; redirects = []; }
function renderLayout(Component) { hooks.stateIndex = 0; hooks.effectIndex = 0; const tree = Component(); for (const effect of hooks.pending.splice(0)) effect(); return tree; }
try {
  const { unavailableAdminModules: modules, unavailableAdminModule, adminShortcuts } = await compile('src/lib/admin-modules.ts');
  assert.equal(modules.length, 8); assert.equal(new Set(modules.map(module => module.path)).size, 8);
  const Page = (await compile('src/pages/admin/AdminModuleUnavailable.tsx')).default;
  for (const module of modules) {
    for (const path of [module.path, module.path.toUpperCase() + '/']) {
      assert.equal(unavailableAdminModule(path)?.path, module.path);
      const html = render(Page, path + '?private=do-not-reflect#secret');
      assert.ok(html.includes(`>${escape(module.title)}</h1>`));
      assert.match(html, /Unavailable module/); assert.match(html, /No records were loaded or saved/);
      assert.deepEqual(hrefs(html), ['/admin/crm', '/admin/modules']);
      assert.doesNotMatch(html, /No customers found|No slides yet|No contacts found|Coming soon|<form|<input|<button|<table|do-not-reflect|#secret/);
    }
  }
  assert.equal(unavailableAdminModule('/admin/analytics/extra'), undefined);
  assert.equal(unavailableAdminModule('/admin/analytics-lookalike'), undefined);
  const Modules = (await compile('src/pages/admin/AdminModules.tsx')).default;
  const index = render(Modules, '/admin/modules');
  assert.equal((index.match(/<li\b/g) ?? []).length, 8); assert.match(index, /does not mean your saved customer records are empty/);
  assert.deepEqual(new Set(hrefs(index)), new Set(['/admin/crm', ...modules.map(module => module.path)]));
  console.log('PASS: all eight actual module pages and the availability list disclose unfinished workflows with no fake empty data, editing controls, service access or reflected URL values');

  // Extract route identity and ancestry from the real App JSX, using no duplicate route map.
  const app = await readFile('src/App.tsx', 'utf8');
  const source = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const routes = [];
  function visit(node, parents = [], layouts = []) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(source) === 'Route') {
        const attr = name => opening.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.text === name)?.initializer;
        const value = attr('path'), path = value && ts.isStringLiteral(value) ? value.text : '';
        const parts = path.startsWith('/') ? [path] : [...parents, path];
        const expression = attr('element')?.expression;
        const tag = expression && ts.isJsxSelfClosingElement(expression) ? expression.tagName.getText(source) : '';
        const to = expression && ts.isJsxSelfClosingElement(expression) ? expression.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.text === 'to')?.initializer : null;
        const full = '/' + parts.join('/').split('/').filter(Boolean).join('/');
        routes.push({ path: full, handle: { tag, layouts, to: to && ts.isStringLiteral(to) ? to.text : null } });
        if (ts.isJsxElement(node)) for (const child of node.children) visit(child, parts, [...layouts, tag]);
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, parents, layouts));
  }
  visit(source);
  const leaf = path => matchRoutes(routes.filter(route => !route.path.includes('*')), path)?.at(-1).route;
  for (const module of modules) { const route = leaf(module.path); assert.equal(route.handle.tag, 'A.UnavailableModule'); assert.ok(route.handle.layouts.includes('A.Layout')); }
  assert.equal(leaf('/admin/modules').handle.tag, 'A.Modules'); assert.ok(leaf('/admin/modules').handle.layouts.includes('A.Layout'));
  assert.equal(leaf('/admin/customers').handle.tag, 'Navigate'); assert.equal(leaf('/admin/customers').handle.to, '/admin/crm');
  assert.equal(leaf('/admin/crm').handle.tag, 'A.CRM');
  for (const obsolete of ['Customers', 'Analytics', 'SliderManager', 'DemoReelManager', 'ProgramManager', 'Contacts', 'Companies', 'Deals', 'Activities']) {
    assert.ok(!app.includes(`import('./pages/admin/${obsolete}')`), `Obsolete workflow still reachable: ${obsolete}`);
  }
  for (const link of [...hrefs(index), ...hrefs(render(Page, modules[0].path))]) assert.ok(leaf(link), link);
  console.log('PASS: actual App routes retain admin layout protection, redirect Customers to the maintained CRM and exclude obsolete broken editors from lazy loading');

  const Layout = (await compile('src/pages/admin/AdminLayout.tsx', true)).default;
  authResult = async () => ({ data: { user: { id: 'fictional-admin', email: 'djudge47@gmail.com' } }, error: null });
  fresh(); location = '/admin/analytics'; let tree = renderLayout(Layout);
  assert.ok(!nodes(tree).some(node => node.props.id === 'admin-navigation'));
  await drain(); tree = renderLayout(Layout);
  const navigation = nodes(tree).find(node => node.props.id === 'admin-navigation');
  const links = nodes(navigation).filter(node => node.props.to);
  assert.deepEqual(new Set(links.map(node => node.props.to)), new Set(['/admin', '/admin/roomba', '/admin/setup', '/admin/crm', '/admin/tickets', '/admin/modules']));
  assert.equal(links.find(node => node.props.to === '/admin/modules').props['aria-current'], 'page');
  assert.equal(links.find(node => node.props.to === '/admin/crm').props['aria-current'], undefined);
  window.innerWidth = 375; links.find(node => node.props.to === '/admin/modules').props.onClick(); tree = renderLayout(Layout);
  assert.ok(nodes(tree).some(node => node.props['aria-label'] === 'Expand admin navigation'));
  for (const node of nodes(tree).filter(node => node.props.to)) assert.ok(node.props['aria-label'], 'Collapsed navigation must retain accessible labels');
  for (const failure of [null, { email: 'fictional-other@example.invalid' }]) {
    fresh(); authResult = async () => ({ data: { user: failure }, error: null }); renderLayout(Layout); await drain();
    assert.equal(renderLayout(Layout), null); assert.equal(redirects.length, 1); assert.equal(redirects[0][0], '/login');
  }
  fresh(); authResult = async () => { throw Error('Fictional Auth outage'); }; renderLayout(Layout); await drain(); assert.equal(renderLayout(Layout), null); assert.equal(redirects[0][0], '/login');
  fresh(); let release; authResult = () => new Promise(resolve => { release = resolve; }); renderLayout(Layout); unmount(); release({ data: { user: null }, error: null }); await drain(); assert.equal(redirects.length, 0);
  assert.ok(authReads > 0);
  console.log('PASS: actual sidebar renders only reviewed destinations after the existing owner check, highlights legacy module paths, keeps mobile/collapsed labels and preserves unauthorized/error/unmount handling');

  const Shortcuts = (await compile('src/components/AdminShortcuts.tsx')).default;
  const shortcuts = render(Shortcuts, '/dashboard');
  assert.deepEqual(hrefs(shortcuts), adminShortcuts.map(item => item.path));
  assert.ok(hrefs(shortcuts).includes('/admin/modules')); assert.ok(!hrefs(shortcuts).some(path => unavailableAdminModule(path)));
  for (const path of hrefs(shortcuts)) assert.ok(leaf(path));
  const dashboard = await readFile('src/pages/Dashboard.tsx', 'utf8'); assert.match(dashboard, /isAdmin && <AdminShortcuts \/>/);
  assert.match(dashboard, /import AdminShortcuts from ['"]\.\.\/components\/AdminShortcuts['"]/);
  assert.doesNotMatch(shortcuts, /<button|onclick=/i); assert.match(shortcuts, /aria-label="Admin shortcuts"/);
  console.log('PASS: actual dashboard shortcuts expose the maintained workspace and clearly labeled availability destination through real links, preserving their admin-only rendering condition');
  console.log('4 admin-module regression groups passed. All identities and Auth responses were fictional; no real customer, database write, provider, mail or payment operation occurred.');
} finally {
  unmount();
  for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  await rm(directory, { recursive: true, force: true });
}
