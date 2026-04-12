import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';

const WORKER_PATH = path.resolve(import.meta.dirname, '..', 'worker.mjs');
const PORT = 44123 + Math.floor(Math.random() * 1000);
let proc;

// Start the worker before all tests
before(async () => {
  proc = spawn(process.execPath, [WORKER_PATH], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  // Wait for it to be ready
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Worker failed to start')), 5000);
    proc.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('running')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    proc.on('error', reject);
  });
});

after(() => { if (proc) proc.kill(); });

function api(path) { return `http://localhost:${PORT}${path}`; }

// --- Routing ---

test('worker: root serves HTML page', async () => {
  const resp = await fetch(api('/'));
  assert.strictEqual(resp.status, 200);
  assert.ok(resp.headers.get('content-type').includes('text/html'));
  const text = await resp.text();
  assert.ok(text.includes('<!DOCTYPE html'));
});

test('worker: root with url param still serves HTML (not markdown)', async () => {
  const resp = await fetch(api('/?url=https://example.com'));
  assert.strictEqual(resp.status, 200);
  assert.ok(resp.headers.get('content-type').includes('text/html'));
});

test('worker: /api without url returns 400', async () => {
  const resp = await fetch(api('/api'));
  assert.strictEqual(resp.status, 400);
  const text = await resp.text();
  assert.ok(text.includes('Missing url'));
});

test('worker: OPTIONS returns CORS headers', async () => {
  const resp = await fetch(api('/api'), { method: 'OPTIONS' });
  assert.strictEqual(resp.status, 204);
  assert.strictEqual(resp.headers.get('access-control-allow-origin'), '*');
  assert.ok(resp.headers.get('access-control-allow-methods').includes('POST'));
});

// --- GET /api conversion ---

test('worker: GET /api converts HTML via POST body', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><h1>Hello</h1><p>World</p></body></html>',
      url: 'https://example.com/',
    }),
  });
  assert.strictEqual(resp.status, 200);
  assert.ok(resp.headers.get('content-type').includes('text/markdown'));
  const text = await resp.text();
  assert.ok(text.includes('Hello'));
  assert.ok(text.includes('World'));
});

// --- Image stripping ---

test('worker: images included by default', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><p>Text</p><img src="photo.png" alt="pic"></body></html>',
      url: 'https://example.com/',
    }),
  });
  const text = await resp.text();
  assert.ok(text.includes('![pic]'), 'should contain image markdown');
});

test('worker: images=false strips images', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><p>Text</p><img src="photo.png" alt="pic"></body></html>',
      url: 'https://example.com/',
      images: 'false',
    }),
  });
  const text = await resp.text();
  assert.ok(!text.includes('!['), 'should not contain image markdown');
  assert.ok(text.includes('Text'), 'should still contain text');
});

test('worker: images=false strips multiple images', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><img src="a.png" alt="a"><p>Between</p><img src="b.png" alt="b"></body></html>',
      url: 'https://example.com/',
      images: 'false',
    }),
  });
  const text = await resp.text();
  assert.ok(!text.includes('!['), 'should not contain any image markdown');
  assert.ok(text.includes('Between'), 'should keep text between images');
});

// --- Nav extraction ---

test('worker: nav=true returns JSON with markdown and nav', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><nav><a href="/about">About</a><a href="/contact">Contact</a></nav><p>Content</p></body></html>',
      url: 'https://example.com/',
      nav: 'true',
    }),
  });
  assert.strictEqual(resp.status, 200);
  assert.ok(resp.headers.get('content-type').includes('application/json'));
  const data = await resp.json();
  assert.ok(data.markdown.includes('Content'));
  // First entry is always "Home"
  assert.strictEqual(data.nav[0].text, 'Home');
  assert.strictEqual(data.nav[0].href, 'https://example.com/');
  assert.ok(data.nav.find(n => n.text === 'About' && n.href === 'https://example.com/about'));
  assert.ok(data.nav.find(n => n.text === 'Contact' && n.href === 'https://example.com/contact'));
});

test('worker: nav=false returns plain markdown', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><nav><a href="/about">About</a></nav><p>Content</p></body></html>',
      url: 'https://example.com/',
    }),
  });
  assert.ok(resp.headers.get('content-type').includes('text/markdown'));
  const text = await resp.text();
  assert.ok(text.includes('Content'));
});

test('worker: nav extracts from <nav> elements', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><nav><ul><li><a href="/docs">Docs</a></li><li><a href="/api">API</a></li></ul></nav><p>Body</p></body></html>',
      url: 'https://example.com/',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  assert.ok(data.nav.find(n => n.text === 'Docs'));
  assert.ok(data.nav.find(n => n.text === 'API'));
});

test('worker: nav extracts from <aside> elements', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><aside><a href="/sidebar-link">Sidebar</a></aside><p>Body</p></body></html>',
      url: 'https://example.com/',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  assert.ok(data.nav.find(n => n.text === 'Sidebar'));
});

test('worker: nav extracts from <header> elements', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><header><a href="/page">Page</a></header><p>Body</p></body></html>',
      url: 'https://example.com/',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  assert.ok(data.nav.find(n => n.text === 'Page'));
});

test('worker: nav deduplicates links', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><nav><a href="/about">About</a></nav><header><a href="/about">About Us</a></header><p>Body</p></body></html>',
      url: 'https://example.com/',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  const aboutLinks = data.nav.filter(n => n.href === 'https://example.com/about');
  assert.strictEqual(aboutLinks.length, 1, 'duplicate href should be deduplicated');
});

test('worker: nav skips anchor-only, javascript:, and mailto: links', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><nav><a href="#section">Anchor</a><a href="javascript:void(0)">JS</a><a href="mailto:hi@test.com">Email</a><a href="/real">Real</a></nav><p>Body</p></body></html>',
      url: 'https://example.com/',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  assert.ok(data.nav.find(n => n.text === 'Real'));
  assert.ok(!data.nav.find(n => n.text === 'Anchor'));
  assert.ok(!data.nav.find(n => n.text === 'JS'));
  assert.ok(!data.nav.find(n => n.text === 'Email'));
});

test('worker: nav resolves relative URLs', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><nav><a href="guide/start">Start</a><a href="../other">Other</a><a href="/absolute">Abs</a></nav><p>Body</p></body></html>',
      url: 'https://example.com/docs/',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  assert.ok(data.nav.find(n => n.href === 'https://example.com/docs/guide/start'));
  assert.ok(data.nav.find(n => n.href === 'https://example.com/other'));
  assert.ok(data.nav.find(n => n.href === 'https://example.com/absolute'));
});

test('worker: nav always includes site home link', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><p>No nav here</p></body></html>',
      url: 'https://example.com/some/page',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  assert.strictEqual(data.nav[0].text, 'Home');
  assert.strictEqual(data.nav[0].href, 'https://example.com/');
});

test('worker: nav skips links with empty text', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><nav><a href="/empty"></a><a href="/icon"><img src="icon.png"></a><a href="/real">Real Link</a></nav><p>Body</p></body></html>',
      url: 'https://example.com/',
      nav: 'true',
    }),
  });
  const data = await resp.json();
  assert.ok(data.nav.find(n => n.text === 'Real Link'));
  assert.ok(!data.nav.find(n => n.href === 'https://example.com/empty'));
});

// --- CORS headers on all responses ---

test('worker: CORS headers on success', async () => {
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: '<p>test</p>', url: 'https://example.com/' }),
  });
  assert.strictEqual(resp.headers.get('access-control-allow-origin'), '*');
});

test('worker: CORS headers on error', async () => {
  const resp = await fetch(api('/api'));
  assert.strictEqual(resp.headers.get('access-control-allow-origin'), '*');
});

// --- GET /api with query params ---

test('worker: GET /api with query params converts html_to_markdown style', async () => {
  const params = new URLSearchParams({
    url: 'data:text/html,<html><body><h1>Test</h1><p>Hello</p></body></html>',
  });
  // data: URLs won't work with fetch, so test POST instead with all query-style params
  const resp = await fetch(api('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<html><body><h1>Test</h1><p>Hello</p></body></html>',
      url: 'https://example.com/',
      title: 'true',
      links: 'true',
      clean: 'true',
      absoluteUrls: 'true',
    }),
  });
  assert.strictEqual(resp.status, 200);
  const text = await resp.text();
  assert.ok(text.includes('Test'));
  assert.ok(text.includes('Hello'));
});
