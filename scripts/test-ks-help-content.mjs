import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { matchRoutes } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server.js';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-help-'));
const originalFetch = globalThis.fetch;
globalThis.fetch = () => { throw Error('Public help must not access connected services'); };
let number = 0;
async function compile(entry, routerFixture = false) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm',
    platform: 'node', jsx: 'automatic', packages: 'external', external: ['react', 'react/jsx-runtime'], plugins: [{ name: 'public-help-boundary', setup(b) {
      b.onResolve({ filter: /(?:^|\/)lib\/(?:api|supabase)$|^\.\/supabase$/ }, () => { throw Error('Help imported a database or analytics client'); });
      if (routerFixture) {
        b.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `
          import React from 'react';
          export const useParams=()=>({slug:globalThis.__ksHelpSlug});
          export const useSearchParams=()=>[new URLSearchParams(globalThis.__ksHelpParams), value=>{globalThis.__ksHelpParams=value.toString();}];
          export const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);
        ` }));
      }
    } }] });
  const path = join(directory, `${++number}.mjs`);
  await writeFile(path, output.outputFiles[0].text);
  return import(pathToFileURL(path));
}
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const render = (Component, location = '/knowledge-base') => renderToStaticMarkup(React.createElement(StaticRouter, { location }, React.createElement(Component)));
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
try {
  const catalog = await compile('src/lib/help-content.ts');
  const KnowledgeBase = (await compile('src/pages/KnowledgeBase.tsx')).default;
  const DeviceSetup = (await compile('src/pages/support/DeviceSetup.tsx')).default;
  const Article = (await compile('src/pages/support/Article.tsx', true)).default;
  const Guide = (await compile('src/pages/support/Guide.tsx', true)).default;
  const { helpArticles, setupGuides, helpCategories, supportDocuments } = catalog;
  assert.equal(helpArticles.length, 5);
  assert.equal(setupGuides.length, 4);
  const all = render(KnowledgeBase);
  const devices = render(DeviceSetup, '/support/devices');
  const checkedLinks = [...hrefs(all), ...hrefs(devices)];
  for (const [documents, Component, kind] of [[helpArticles, Article, 'article'], [setupGuides, Guide, 'guide']]) {
    for (const document of documents) {
      const link = `/support/${kind}/${document.slug}`;
      assert.ok((kind === 'article' ? hrefs(all) : hrefs(devices)).includes(link), link);
      globalThis.__ksHelpSlug = document.slug;
      const html = render(Component, link);
      assert.ok(html.includes(`>${escape(document.title)}</h1>`));
      for (const section of document.sections) {
        assert.ok(html.includes(escape(section.heading)));
        assert.ok(html.includes(escape(section.content)));
      }
      assert.doesNotMatch(html, /\d+ views|helpful votes|Last updated:|Estimated time:|Difficulty:/i);
      checkedLinks.push(...hrefs(html));
    }
    globalThis.__ksHelpSlug = 'unknown-document';
    const unknown = render(Component);
    assert.match(unknown, /not found<\/h1>/);
    assert.ok(!unknown.includes(escape(documents.at(-1).description)), 'Unknown slugs cannot retain previous content');
    globalThis.__ksHelpSlug = documents[0].slug;
    assert.ok(render(Component).includes(escape(documents[0].title)), 'A valid next slug recovers immediately');
  }
  console.log('PASS: all five listed articles and four guides render real content, preserve legacy slugs and recover from unknown slugs');

  for (const category of helpCategories) {
    const html = render(KnowledgeBase, `/knowledge-base?category=${category.slug}`);
    assert.deepEqual(hrefs(html).filter(url => url.startsWith('/support/article/')), helpArticles.filter(item => item.category === category.slug).map(item => `/support/article/${item.slug}`));
  }
  for (const [query, slug] of [['REFUND', 'billing-and-renewals'], ['soundbar', 'streaming-troubleshooting'], ['  website account  ', 'account-setup']]) {
    assert.ok(hrefs(render(KnowledgeBase, `/knowledge-base?q=${encodeURIComponent(query)}`)).includes(`/support/article/${slug}`));
  }
  for (const location of ['/knowledge-base?q=not-a-real-match', '/knowledge-base?category=unknown', '/knowledge-base?category=billing&q=soundbar']) {
    const html = render(KnowledgeBase, location);
    assert.match(html, /No articles match/);
    assert.ok(hrefs(html).includes('/knowledge-base'));
  }
  const InteractiveKnowledgeBase = (await compile('src/pages/KnowledgeBase.tsx', true)).default;
  globalThis.__ksHelpParams = 'category=billing';
  const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
  const input = nodes(InteractiveKnowledgeBase()).find(element => element.type === 'input');
  input.props.onChange({ target: { value: 'refund & renewal' } });
  assert.equal(new URLSearchParams(globalThis.__ksHelpParams).get('q'), 'refund & renewal');
  assert.equal(new URLSearchParams(globalThis.__ksHelpParams).get('category'), 'billing');
  input.props.onChange({ target: { value: '' } });
  assert.equal(new URLSearchParams(globalThis.__ksHelpParams).has('q'), false);
  assert.match(render(KnowledgeBase), /for="help-search"/);
  console.log('PASS: topic filtering, section-text search, URL-safe input updates and empty-result recovery work');

  for (const [file, key] of [['GettingStarted', 'gettingStarted'], ['Billing', 'billing'], ['StreamingHelp', 'streaming'], ['TVSetup', 'tv'], ['MobileSetup', 'mobile'], ['ComputerSetup', 'computer'], ['ConsoleSetup', 'console']]) {
    const Component = (await compile(`src/pages/support/${file}.tsx`)).default;
    const html = render(Component);
    for (const section of supportDocuments[key].sections) assert.ok(html.includes(escape(section.content)));
    checkedLinks.push(...hrefs(html));
  }
  console.log('PASS: seven established support pages use the same maintained guide content');

  for (const [file, heading, availability] of [
    ['SystemStatus', 'System Status', 'Live status unavailable'],
    ['StatusHistory', 'Status History', 'Incident history unavailable'],
    ['Maintenance', 'Maintenance Schedule', 'Schedule unavailable'],
    ['Issues', 'Known Issues', 'Issue information unavailable'],
  ]) {
    const Component = (await compile(`src/pages/support/${file}.tsx`)).default;
    const html = render(Component);
    assert.ok(html.includes(`>${heading}</h1>`));
    assert.ok(html.includes(availability));
    assert.ok(hrefs(html).includes('/support'), 'Unavailable information must offer support navigation');
    assert.doesNotMatch(html, /All Systems Operational|99\.9%|No major incidents|No Known Issues|Last checked:|Updated \d|Tuesday 3-5|No major maintenance|notify users via email/i);
    if (file === 'SystemStatus') {
      assert.equal([...html.matchAll(/>Not verified<\/span>/g)].length, 5);
      assert.doesNotMatch(html, /text-green-|animate-pulse/);
    }
    checkedLinks.push(...hrefs(html));
  }
  for (const file of ['src/components/DemoReel.tsx', 'src/pages/Testimonials.tsx', 'src/pages/Reselling.tsx']) {
    assert.doesNotMatch(await readFile(file, 'utf8'), /99\.9%/);
  }
  console.log('PASS: four status pages identify unavailable evidence, offer support and omit simulated uptime, incident and maintenance claims');

  for (const file of ['ChatHistory', 'AIHelp', 'AIFaq']) {
    const Component = (await compile(`src/pages/support/${file}.tsx`)).default;
    const html = render(Component);
    assert.doesNotMatch(html, /stored locally in your browser|stored for reference|trained on Kristal Streams|available around the clock|AI can diagnose/);
    assert.ok(hrefs(html).includes('/client/support/new'));
    if (file === 'ChatHistory') {
      assert.match(html, /Saved chat history is unavailable/);
      assert.match(html, /does not undo a submitted request/);
    }
    checkedLinks.push(...hrefs(html));
  }
  console.log('PASS: AI help/history pages describe temporary conversation handling and support handoff without false archive/training claims');

  // Extract actual JSX route paths rather than inventing a duplicate route fixture.
  const source = ts.createSourceFile('App.tsx', await readFile('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const routePaths = [], redirects = new Map();
  function visit(node, parents = []) {
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node))) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(source) === 'Route') {
        const attributes = opening.attributes.properties;
        const path = attributes.find(a => ts.isJsxAttribute(a) && a.name.text === 'path');
        const value = path && ts.isStringLiteral(path.initializer) ? path.initializer.text : '';
        const segments = value.startsWith('/') ? [value] : [...parents, value];
        const full = '/' + segments.join('/').split('/').filter(Boolean).join('/');
        routePaths.push(full);
        const element = attributes.find(a => ts.isJsxAttribute(a) && a.name.text === 'element');
        const expression = element?.initializer?.expression;
        if (expression && ts.isJsxSelfClosingElement(expression) && expression.tagName.getText(source) === 'Navigate') {
          const to = expression.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.text === 'to');
          if (to && ts.isStringLiteral(to.initializer)) redirects.set(full, to.initializer.text);
        }
        ts.forEachChild(node, child => visit(child, segments));
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, parents));
  }
  visit(source);
  // A catch-all must not make a broken help destination pass this contract.
  for (const url of new Set(checkedLinks)) assert.ok(matchRoutes(routePaths.filter(path => !path.includes('*')).map(path => ({ path })), new URL(url, 'https://fixture.invalid').pathname), `Missing App route: ${url}`);
  assert.equal(redirects.get('/support/technical'), '/support/streaming');
  assert.equal(redirects.get('/support/device-setup'), '/support/devices');
  console.log('PASS: every rendered help link has an actual App route; both historical topic URLs redirect to working pages');
  console.log('6 public-help regression scenarios passed. No database, analytics or external service was called.');
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.__ksHelpSlug;
  delete globalThis.__ksHelpParams;
  await rm(directory, { recursive: true, force: true });
}
