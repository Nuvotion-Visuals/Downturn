import { test, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../lib/http_server.mjs';

function request(server, { method = 'GET', path = '/', body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const opts = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
      headers,
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

test('GET route with query params', async () => {
  const app = createApp();
  let captured;
  app.get('/', (req, res) => {
    captured = req.query;
    res.send('ok');
  });
  const server = app.listen(0);
  after(() => server.close());

  const res = await request(server, { path: '/?url=https%3A%2F%2Fexample.com&title=true' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body, 'ok');
  assert.strictEqual(captured.url, 'https://example.com');
  assert.strictEqual(captured.title, 'true');
});

test('POST route with URL-encoded body', async () => {
  const app = createApp();
  let captured;
  app.post('/', (req, res) => {
    captured = req.body;
    res.send('posted');
  });
  const server = app.listen(0);
  after(() => server.close());

  const body = 'url=https%3A%2F%2Fexample.com&html=%3Cp%3Ehello%3C%2Fp%3E';
  const res = await request(server, {
    method: 'POST',
    path: '/',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body, 'posted');
  assert.strictEqual(captured.url, 'https://example.com');
  assert.strictEqual(captured.html, '<p>hello</p>');
});

test('returns 404 for unknown routes', async () => {
  const app = createApp();
  app.get('/', (req, res) => { res.send('home'); });
  const server = app.listen(0);
  after(() => server.close());

  const res = await request(server, { path: '/unknown' });
  assert.strictEqual(res.status, 404);
});

test('res.status().send() chaining', async () => {
  const app = createApp();
  app.get('/', (req, res) => {
    res.status(400).send('Bad Request');
  });
  const server = app.listen(0);
  after(() => server.close());

  const res = await request(server);
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body, 'Bad Request');
});

test('res.header() sets response headers', async () => {
  const app = createApp();
  app.get('/', (req, res) => {
    res.header('X-Custom', 'test-value');
    res.header('Content-Type', 'text/plain');
    res.send('headers set');
  });
  const server = app.listen(0);
  after(() => server.close());

  const res = await request(server);
  assert.strictEqual(res.headers['x-custom'], 'test-value');
  assert.strictEqual(res.headers['content-type'], 'text/plain');
});

test('middleware runs before route handler', async () => {
  const app = createApp();
  const order = [];
  app.use((req, res, next) => { order.push('mw1'); next(); });
  app.use((req, res, next) => { order.push('mw2'); next(); });
  app.get('/', (req, res) => { order.push('handler'); res.send('ok'); });
  const server = app.listen(0);
  after(() => server.close());

  await request(server);
  assert.deepStrictEqual(order, ['mw1', 'mw2', 'handler']);
});

test('middleware can short-circuit', async () => {
  const app = createApp();
  app.use((req, res, next) => {
    res.status(403).send('Forbidden');
  });
  app.get('/', (req, res) => { res.send('should not reach'); });
  const server = app.listen(0);
  after(() => server.close());

  const res = await request(server);
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body, 'Forbidden');
});

test('trust proxy reads X-Forwarded-For', async () => {
  const app = createApp();
  app.set('trust proxy', 1);
  let capturedIp;
  app.get('/', (req, res) => {
    capturedIp = req.ip;
    res.send('ok');
  });
  const server = app.listen(0);
  after(() => server.close());

  await request(server, { headers: { 'X-Forwarded-For': '203.0.113.50, 70.41.3.18' } });
  assert.strictEqual(capturedIp, '203.0.113.50');
});

test('POST query params are available on req.query', async () => {
  const app = createApp();
  let captured;
  app.post('/', (req, res) => {
    captured = req.query;
    res.send('ok');
  });
  const server = app.listen(0);
  after(() => server.close());

  const res = await request(server, {
    method: 'POST',
    path: '/?title=true&links=false',
    body: 'html=%3Cp%3Ehi%3C%2Fp%3E',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(captured.title, 'true');
  assert.strictEqual(captured.links, 'false');
});
