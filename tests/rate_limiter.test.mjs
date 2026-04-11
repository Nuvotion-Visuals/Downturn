import { test } from 'node:test';
import assert from 'node:assert';
import { createRateLimiter } from '../lib/rate_limiter.mjs';

function mockReqRes(ip = '127.0.0.1') {
  const headers = {};
  return {
    req: { ip, socket: { remoteAddress: ip } },
    res: {
      statusCode: 200,
      setHeader(name, value) { headers[name] = value; },
      end(body) { this._body = body; },
      _body: null,
      _headers: headers,
    },
  };
}

test('allows requests under the limit', () => {
  const limiter = createRateLimiter({ windowMs: 30000, max: 5, message: 'Rate limit exceeded', headers: true });
  let called = false;

  for (let i = 0; i < 5; i++) {
    const { req, res } = mockReqRes();
    called = false;
    limiter(req, res, () => { called = true; });
    assert.strictEqual(called, true, `request ${i + 1} should be allowed`);
  }
});

test('blocks request exceeding max', () => {
  const limiter = createRateLimiter({ windowMs: 30000, max: 3, message: 'Too many', headers: true });

  for (let i = 0; i < 3; i++) {
    const { req, res } = mockReqRes();
    limiter(req, res, () => {});
  }

  const { req, res } = mockReqRes();
  let nextCalled = false;
  limiter(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 429);
  assert.strictEqual(res._body, 'Too many');
});

test('sets RateLimit headers when headers option is true', () => {
  const limiter = createRateLimiter({ windowMs: 30000, max: 5, message: 'nope', headers: true });
  const { req, res } = mockReqRes();
  limiter(req, res, () => {});

  assert.strictEqual(res._headers['RateLimit-Limit'], '5');
  assert.strictEqual(res._headers['RateLimit-Remaining'], '4');
  assert.ok(res._headers['RateLimit-Reset']);
});

test('does not set headers when headers option is false', () => {
  const limiter = createRateLimiter({ windowMs: 30000, max: 5, message: 'nope', headers: false });
  const { req, res } = mockReqRes();
  limiter(req, res, () => {});

  assert.strictEqual(res._headers['RateLimit-Limit'], undefined);
});

test('tracks different IPs separately', () => {
  const limiter = createRateLimiter({ windowMs: 30000, max: 2, message: 'blocked', headers: false });

  // IP A: 2 requests (at limit)
  for (let i = 0; i < 2; i++) {
    const { req, res } = mockReqRes('10.0.0.1');
    limiter(req, res, () => {});
  }

  // IP B: should still be allowed
  const { req, res } = mockReqRes('10.0.0.2');
  let called = false;
  limiter(req, res, () => { called = true; });
  assert.strictEqual(called, true);

  // IP A: should be blocked
  const { req: reqA, res: resA } = mockReqRes('10.0.0.1');
  let calledA = false;
  limiter(reqA, resA, () => { calledA = true; });
  assert.strictEqual(calledA, false);
  assert.strictEqual(resA.statusCode, 429);
});

test('remaining count decreases with each request', () => {
  const limiter = createRateLimiter({ windowMs: 30000, max: 3, message: 'nope', headers: true });

  for (let i = 0; i < 3; i++) {
    const { req, res } = mockReqRes();
    limiter(req, res, () => {});
    assert.strictEqual(res._headers['RateLimit-Remaining'], String(3 - (i + 1)));
  }
});
