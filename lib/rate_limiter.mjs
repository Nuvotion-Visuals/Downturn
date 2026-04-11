// Sliding window rate limiter — replaces 'express-rate-limit' npm package

export function createRateLimiter({ windowMs = 60000, max = 5, message = 'Too many requests', headers = true } = {}) {
  const hits = new Map(); // ip → [timestamp, ...]

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      const active = timestamps.filter(t => now - t < windowMs);
      if (active.length === 0) hits.delete(ip);
      else hits.set(ip, active);
    }
  }, windowMs);
  cleanup.unref();

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter(t => now - t < windowMs);
    timestamps.push(now);
    hits.set(ip, timestamps);

    if (headers) {
      res.setHeader('RateLimit-Limit', String(max));
      res.setHeader('RateLimit-Remaining', String(Math.max(0, max - timestamps.length)));
      res.setHeader('RateLimit-Reset', String(Math.ceil((timestamps[0] + windowMs) / 1000)));
    }

    if (timestamps.length > max) {
      res.statusCode = 429;
      res.end(message);
      return;
    }
    next();
  };
}
