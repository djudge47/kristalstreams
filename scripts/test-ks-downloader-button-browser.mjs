import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
const { chromium } = await import(pathToFileURL(process.env.KS_PLAYWRIGHT_MODULE));
const require = createRequire(import.meta.url), supplied = require(process.env.KS_CHROMIUM_MODULE), bundled = supplied.default ?? supplied;
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const worker = await readFile('public/sw.js', 'utf8'), apk = 'dist/downloads/KristalStreams.apk';
const bytes = (await stat(apk)).size;
const bundle = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import DownloadApp from './src/pages/DownloadApp';createRoot(document.getElementById('root')).render(<MemoryRouter><DownloadApp/></MemoryRouter>);`,
  resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' } });
const html = `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`;
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://fixture.invalid').pathname;
  if (path === '/sw.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(worker); return; }
  if (path === '/downloads/KristalStreams.apk') {
    for (const route of config.routes) if (route.headers && new RegExp(route.src).test(path)) {
      for (const [key, value] of Object.entries(route.headers)) res.setHeader(key, value);
    }
    res.setHeader('Content-Length', bytes); createReadStream(apk).pipe(res); return;
  }
  res.setHeader('Content-Type', 'text/html'); res.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`, directory = await mkdtemp(join(tmpdir(), 'ks-downloader-button-'));
const browser = await chromium.launch({ executablePath: process.env.KS_BROWSER_EXECUTABLE ?? await bundled.executablePath(), headless: true,
  args: bundled.args.filter(x => !['--single-process', '--disable-web-security', '--allow-running-insecure-content'].includes(x)) });
try {
  for (const webview of [false, true]) {
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: webview ? 960 : 1280, height: 720 },
      ...(webview ? { userAgent: 'Mozilla/5.0 (Linux; Android 9; AFTCube Build/fixture; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.198 Mobile Safari/537.36' } : {}) });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage(); await page.goto(`${origin}/download-app`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    });
    const link = page.getByRole('link', { name: 'Download Android APK', exact: true });
    assert.equal(await link.getAttribute('download'), null);
    const waiting = page.waitForEvent('download', { timeout: 20000 }); await link.click();
    const download = await waiting; assert.equal(download.suggestedFilename(), 'KristalStreams.apk');
    const file = join(directory, `download-${webview}.apk`); await download.saveAs(file);
    assert.equal(await download.failure(), null);
    assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'), '1f31d53f9e95646a2e40fc6fdf8a9f7d770826d1d605e13af6aa353de235f73d');
    const cached = await page.evaluate(async url => Boolean(await caches.match(url)), `${origin}/downloads/KristalStreams.apk?v=2026102601`);
    assert.equal(cached, false);
    console.log(`PASS: ${webview ? 'Android-WebView user-agent' : 'desktop'} plain-link click downloads the full approved APK with the actual service worker active and no installer cache`);
    await context.close();
  }
  console.log('Chromium uses the real component, distribution APK and routing headers. This is not a physical Downloader compatibility certification.');
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true });
}
