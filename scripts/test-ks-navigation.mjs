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

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-navigation-'));
const originalFetch = globalThis.fetch;
globalThis.fetch = () => { throw Error('Navigation recovery must not access connected services'); };
let number = 0;
async function compile(entry) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', packages: 'external', plugins: [{ name: 'navigation-offline', setup(b) {
    b.onResolve({ filter: /(?:^|\/)lib\/(?:api|supabase)$|^\.\/supabase$/ }, () => { throw Error('Recovery imported a connected client'); });
    b.onResolve({ filter: /\/NewsletterSignup$|^\.\/NewsletterSignup$/ }, () => ({ path: 'newsletter', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export default function NewsletterFixture(){return null;}' }));
  } }] });
  const path = join(directory, `${++number}.mjs`); await writeFile(path, output.outputFiles[0].text); return import(pathToFileURL(path));
}
const render = (Component, location) => renderToStaticMarkup(React.createElement(StaticRouter, { location }, React.createElement(Component)));
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
try {
  // Build the actual nested JSX route tree, retaining layout/leaf identity and redirects.
  // No second route map or catch-all-only link check may hide a missing destination.
  const app = await readFile('src/App.tsx', 'utf8');
  const source = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const routes = [];
  function visit(node, into) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(source) === 'Route') {
        const attrs = opening.attributes.properties;
        const attribute = name => attrs.find(a => ts.isJsxAttribute(a) && a.name.text === name);
        const literal = name => { const value = attribute(name)?.initializer; return value && ts.isStringLiteral(value) ? value.text : undefined; };
        const expression = attribute('element')?.initializer?.expression;
        const tag = expression && ts.isJsxSelfClosingElement(expression) ? expression.tagName.getText(source) : null;
        const to = expression && ts.isJsxSelfClosingElement(expression) ? expression.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.text === 'to')?.initializer : null;
        const route = { ...(literal('path') !== undefined ? { path: literal('path') } : {}), ...(attribute('index') ? { index: true } : {}), handle: { tag, to: to && ts.isStringLiteral(to) ? to.text : null }, children: [] };
        into.push(route);
        if (ts.isJsxElement(node)) for (const child of node.children) visit(child, route.children);
        if (!route.children.length) delete route.children;
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, into));
  }
  visit(source, routes);
  const matching = url => matchRoutes(routes, url);
  const leaf = url => matching(url)?.at(-1).route;
  for (const [url, layouts] of [
    ['/missing-page', ['Layout']], ['/support/not-a-page', ['Layout']],
    ['/client/missing-page', ['Layout', 'C.Layout']], ['/client/support/missing/deep', ['Layout', 'C.Layout']],
    ['/admin/missing-page', ['A.Layout']], ['/admin/crm/missing/deep', ['A.Layout']],
  ]) {
    const matches = matching(url); assert.equal(matches.at(-1).route.handle.tag, 'NotFound', url);
    assert.deepEqual(matches.slice(0, -1).map(match => match.route.handle.tag), layouts, url);
  }
  assert.match(app, /import NotFound from ['"]\.\/pages\/NotFound['"]/);
  console.log('PASS: unknown public, nested customer and admin addresses resolve to recovery inside the actual existing layout boundaries');

  for (const [url, tag] of [
    ['/', 'P.Home'], ['/accessibility', 'P.Accessibility'], ['/privacy', 'P.Privacy'],
    ['/support/ai-chat', 'S.AIChat'], ['/client/support/new', 'C.NewTicket'],
    ['/client/subscription', 'C.Subscription'], ['/admin', 'A.Dashboard'], ['/admin/crm', 'A.CRM'],
    ['/admin/crm/contacts', 'A.Contacts'], ['/content/movie/1', 'P.ContentDetail'],
    ['/support/article/getting-started', 'S.Article'], ['/support/guide/android-tv', 'S.Guide'],
  ]) assert.equal(leaf(url)?.handle.tag, tag, url);
  for (const [url, to] of [['/account', '/client/account'], ['/support/technical', '/support/streaming'], ['/support/device-setup', '/support/devices']]) {
    assert.equal(leaf(url)?.handle.tag, 'Navigate'); assert.equal(leaf(url).handle.to, to);
  }
  assert.match(app, /Accessibility: lazyRetry\(\(\) => import\('\.\/pages\/Accessibility'\)\)/);
  console.log('PASS: exact routes, dynamic content/help destinations and historical redirects outrank catch-alls and keep their existing screens');

  const explicit = nodes => nodes.filter(route => !route.path?.includes('*')).map(route => ({ ...route, ...(route.children ? { children: explicit(route.children) } : {}) }));
  const known = explicit(routes);
  assert.equal(matchRoutes(known, '/deliberately-missing-link'), null, 'A wildcard must not satisfy destination coverage');
  const checkLinks = html => { for (const link of hrefs(html).filter(link => link.startsWith('/'))) assert.ok(matchRoutes(known, link), `Recovery link is missing: ${link}`); };
  const NotFound = (await compile('src/pages/NotFound.tsx')).default;
  const html = render(NotFound, '/missing/%3Cscript%3E?private=do-not-reflect#private-fragment');
  assert.match(html, /<h1[^>]*>Page not found<\/h1>/);
  assert.match(html, /aria-label="Page recovery"/);
  assert.doesNotMatch(html, /do-not-reflect|private-fragment|%3Cscript|<script|onclick=/i);
  assert.deepEqual(hrefs(html), ['/', '/knowledge-base', '/support']); checkLinks(html);
  assert.doesNotMatch(html, /<form|<iframe|<video|<main/);
  console.log('PASS: actual recovery page renders meaningful text and known safe links without reflecting the requested address or triggering an action');

  const Accessibility = (await compile('src/pages/Accessibility.tsx')).default;
  const help = render(Accessibility, '/accessibility'); checkLinks(help);
  assert.match(help, /<h1[^>]*>Accessibility Help<\/h1>/);
  assert.ok(hrefs(help).includes('mailto:support@kristalstream.com'));
  assert.ok(hrefs(help).includes('/client/support/new'));
  assert.match(help, /cannot use the sign-in or ticket form/); assert.match(help, /evaluation.*has not been completed/);
  assert.doesNotMatch(help, /WCAG.*(?:compliant|certified)|fully accessible|guaranteed compatibility/i);
  const Footer = (await compile('src/components/Footer.tsx')).default;
  const footer = render(Footer, '/'); checkLinks(footer);
  assert.ok(hrefs(footer).includes('/accessibility')); assert.ok(hrefs(footer).includes('mailto:support@kristalstream.com'));
  assert.match(footer, /flex flex-wrap justify-center gap-x-6 gap-y-3/);
  console.log('PASS: Accessibility and the actual footer link to real destinations and the owner-specified support inbox; disclosures avoid unsupported certification claims');
  console.log('4 navigation regression groups passed. No real account, database, provider, mail or payment was accessed.');
} finally { globalThis.fetch = originalFetch; await rm(directory, { recursive: true, force: true }); }
