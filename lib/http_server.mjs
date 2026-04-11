// Minimal Express-compatible HTTP server — replaces 'express' npm package
// Supports: app.get(), app.post(), app.use(), app.set(), app.listen()
// Enhanced req: .query, .body, .ip, .path
// Enhanced res: .header(), .status(), .send()

import http from 'node:http';

const BODY_LIMIT = 10 * 1024 * 1024; // 10MB

export function createApp() {
  const middlewareFns = [];
  const routes = { GET: new Map(), POST: new Map() };
  const settings = {};

  function handleRequest(req, res) {
    const parsed = new URL(req.url, 'http://localhost');
    req.query = Object.fromEntries(parsed.searchParams);
    req.path = parsed.pathname;

    if (settings['trust proxy']) {
      const forwarded = req.headers['x-forwarded-for'];
      req.ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    } else {
      req.ip = req.socket.remoteAddress;
    }

    res.header = (name, value) => { res.setHeader(name, value); return res; };
    res.status = (code) => { res.statusCode = code; return res; };
    res.send = (body) => { if (!res.headersSent) res.end(body); };

    const fns = [...middlewareFns];
    const handler = routes[req.method]?.get(req.path);

    let idx = 0;
    function next() {
      if (idx < fns.length) {
        const fn = fns[idx++];
        fn(req, res, next);
        return;
      }
      if (req.method === 'POST') {
        parseBody(req, () => dispatch(handler, req, res));
      } else {
        dispatch(handler, req, res);
      }
    }
    next();
  }

  function dispatch(handler, req, res) {
    if (handler) {
      handler(req, res);
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  }

  handleRequest.get = (path, handler) => { routes.GET.set(path, handler); };
  handleRequest.post = (path, handler) => { routes.POST.set(path, handler); };
  handleRequest.use = (fn) => { middlewareFns.push(fn); };
  handleRequest.set = (key, val) => { settings[key] = val; };
  handleRequest.listen = (port, cb) => {
    const server = http.createServer(handleRequest);
    server.listen(port, cb);
    return server;
  };

  return handleRequest;
}

function parseBody(req, cb) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > BODY_LIMIT) {
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      req.body = Object.fromEntries(new URLSearchParams(body));
    } catch {
      req.body = {};
    }
    cb();
  });
}
