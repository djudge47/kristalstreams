import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { matchRoutes } from 'react-router-dom';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-website-playback-'));
const oldFetch = globalThis.fetch;
globalThis.fetch = () => { throw Error('Catalog/sample tests must not fetch provider, media or account data'); };
let slots = [], index = 0;
globalThis.__catalogTestHooks = {
  useState(initial) { const i = index++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = index++; return slots[i] ?? (slots[i] = { current: initial }); },
  useEffect() {}, // Layout/timer effects are outside these browse/content assertions.
};
const reactPath = import.meta.resolve('react');
const hookSource = `import React from ${JSON.stringify(reactPath)};export default React;export const {useState,useRef,useEffect}=globalThis.__catalogTestHooks;`;
const routerSource = `import React from ${JSON.stringify(reactPath)};export const useParams=()=>globalThis.__catalogTestParams;export const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);`;
const mediaSource = `import React from ${JSON.stringify(reactPath)};export default function FixturePlayer(props){return React.createElement('div',{'data-sample-player':'true','data-source':props.src,'data-title':props.title});}`;
let number = 0;
async function compile(entry, api = false) {
  const built = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react/jsx-runtime', 'lucide-react', 'zustand'], define: { 'import.meta.env': JSON.stringify({ DEV: false }) }, plugins: [{ name: 'catalog-boundaries', setup(b) {
    b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true }));
    b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
    b.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
    b.onResolve({ filter: /\/components\/VideoPlayer$/ }, () => ({ path: 'media', namespace: 'fixture' }));
    b.onResolve({ filter: /supabase$/ }, () => {
      if (!api) throw Error('Public catalog and demo must not depend on account access');
      return { path: 'db', namespace: 'fixture' };
    });
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: a.path === 'hooks' ? hookSource : a.path === 'router' ? routerSource : a.path === 'media' ? mediaSource : 'export const supabase=new Proxy({}, {get(){throw Error("Unexpected connected access");}});' }));
  } }] });
  const path = join(directory, `${++number}.mjs`); await writeFile(path, built.outputFiles[0].text); return import(pathToFileURL(path));
}
const render = (Component, reset = false) => { if (reset) slots = []; index = 0; return Component(); };
const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
const text = element => typeof element === 'string' ? element : React.isValidElement(element) ? React.Children.toArray(element.props.children).map(text).join('') : '';
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
try {
  const catalog = await compile('src/lib/catalog-preview.ts');
  const Detail = (await compile('src/pages/ContentDetail.tsx')).default;
  const Slider = (await compile('src/components/TrendingSlider.tsx')).default;
  const Demo = (await compile('src/pages/PlayerDemo.tsx')).default;
  const browse = renderToStaticMarkup(render(Slider, true));
  assert.equal(catalog.catalogPreviewItems.length, 8);
  assert.match(browse, /Catalog Preview/); assert.match(browse, /current availability/);
  const checkedLinks = [...hrefs(browse)];
  const unique = new Set(hrefs(browse).filter(url => url.startsWith('/content/')));
  assert.equal(unique.size, 8);
  for (const item of catalog.catalogPreviewItems) {
    const url = `/content/${item.type}/${item.id}`; assert.ok(unique.has(url));
    globalThis.__catalogTestParams = { type: item.type, id: String(item.id) };
    const tree = render(Detail, true), html = renderToStaticMarkup(tree);
    assert.equal(nodes(tree).find(node => node.type === 'h1').props.children, item.title);
    assert.match(html, /Catalog Preview/); assert.match(html, /example title information/);
    assert.ok(hrefs(html).includes('/support/getting-started'));
    assert.ok(hrefs(html).includes('/player-demo'));
    assert.ok(!nodes(tree).some(node => node.type === 'video' || node.props.src?.endsWith('.m3u8')));
    assert.doesNotMatch(html, /Watch Now|My List|test-streams|\/10|Season[s]?<|Episodes/);
    checkedLinks.push(...hrefs(html));
  }
  assert.doesNotMatch(JSON.stringify(catalog.catalogPreviewItems), /streamUrl|\.m3u8|test-streams/);
  console.log('PASS: all eight shared catalog examples have keyboard-accessible detail links, clear viewing guidance and no title-associated sample stream');
  for (const params of [{ type: 'movie', id: '501junk' }, { type: 'tv', id: '501' }, { type: 'movie', id: '0501' }, { type: 'movie', id: '999' }, { type: 'movie', id: '9007199254740993' }, {}]) {
    globalThis.__catalogTestParams = params;
    const html = renderToStaticMarkup(render(Detail));
    assert.match(html, /Title preview not found/); assert.ok(hrefs(html).includes('/'));
    assert.doesNotMatch(html, /How to watch your service/);
  }
  globalThis.__catalogTestParams = { type: 'tv', id: '505' };
  assert.equal(nodes(render(Detail)).find(node => node.type === 'h1').props.children, 'Severance');
  console.log('PASS: partial IDs, wrong types and missing titles recover safely; changing routes cannot retain a previous title');
  let tree = render(Demo, true);
  assert.match(text(tree), /Sample Video Only/); assert.match(text(tree), /does not confirm streaming access/);
  assert.ok(!nodes(tree).some(node => node.props.src));
  nodes(tree).find(node => node.type === 'button' && text(node) === 'Open Sample Player').props.onClick(); tree = render(Demo);
  const player = nodes(tree).find(node => node.props.src);
  assert.equal(player.props.src, 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  assert.equal(player.props.title, 'Big Buck Bunny · Sample Video'); assert.equal(player.props.poster, undefined); assert.equal(player.props.immersive, false);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Blender Foundation/); assert.match(html, /CC BY 3.0/); assert.match(html, /Mux/);
  assert.ok(!catalog.catalogPreviewItems.some(item => player.props.title.includes(item.title)));
  checkedLinks.push(...hrefs(html).filter(url => url.startsWith('/')));
  nodes(tree).find(node => node.type === 'button' && text(node) === 'Close Sample Player').props.onClick(); tree = render(Demo);
  assert.ok(!nodes(tree).some(node => node.props.src));
  assert.match(text(tree), /Open Sample Player/);
  console.log('PASS: the credited sample has its own route and labels, mounts only after an explicit click and is removed on close');
  const api = await compile('src/lib/api.ts', true);
  assert.equal(api.getStreamUrl, undefined);
  const apiSource = await readFile('src/lib/api.ts', 'utf8');
  assert.doesNotMatch(apiSource, /test-streams|mockStreamUrl|VITE_API_ENDPOINT|VITE_API_KEY|\/stream\//);
  console.log('PASS: the unused browser-key/undocumented-stream helper and silent sample fallback are absent from the actual API module');
  const source = ts.createSourceFile('App.tsx', await readFile('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const paths = [];
  function visit(node, parents = []) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(source) === 'Route') {
        const attribute = opening.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.text === 'path');
        const value = attribute && ts.isStringLiteral(attribute.initializer) ? attribute.initializer.text : '';
        const segments = value.startsWith('/') ? [value] : [...parents, value];
        paths.push('/' + segments.join('/').split('/').filter(Boolean).join('/'));
        ts.forEachChild(node, child => visit(child, segments)); return;
      }
    }
    ts.forEachChild(node, child => visit(child, parents));
  }
  visit(source);
  for (const url of new Set(checkedLinks)) assert.ok(matchRoutes(paths.filter(path => !path.includes('*')).map(path => ({ path })), url), `Missing actual route for ${url}`);
  assert.ok(paths.includes('/player-demo'));
  console.log('PASS: every rendered internal catalog/detail/sample recovery link matches an actual App route');
  console.log('5 website-playback regression groups passed. No Auth, provider, database, entitlement, media or payment operation occurred.');
} finally {
  globalThis.fetch = oldFetch;
  delete globalThis.__catalogTestHooks;
  delete globalThis.__catalogTestParams;
  await rm(directory, { recursive: true, force: true });
}
