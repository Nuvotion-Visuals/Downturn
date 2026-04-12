// Cloudflare Worker + local dev server for Downturn
// Deploy: npx esbuild worker.mjs --bundle --outfile=dist/worker.js --format=esm
// Local:  PORT=4001 node worker.mjs

import processor from './url_to_markdown_processor.mjs';
import filters from './url_to_markdown_common_filters.mjs';
import { JSDOM } from './lib/html_parser.mjs';

const USER_AGENT = 'Mozilla/5.0 (compatible; Downturn/2.0; +https://github.com/tom-leamon/downturn)';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'X-Title',
};

function convertHtml(html, url, { title = true, links = true, clean = true, absoluteUrls = true } = {}) {
  const stripped = filters.strip_style_and_script_blocks(html);
  const document = new JSDOM(stripped);
  const res = { header: () => {} };
  const options = {
    inline_title: title,
    ignore_links: !links,
    improve_readability: clean,
    absolute_urls: absoluteUrls,
  };
  return processor.process_dom(url, document, res, '', options);
}

// Extract navigation links from raw HTML before Readability strips them
function extractNav(html, baseUrl) {
  const doc = new JSDOM(html);
  const root = doc.window.document;
  const nav = [];
  const seen = new Set();

  // Collect links from <nav> elements, then <aside>, then <header>
  const containers = [
    ...root.querySelectorAll('nav'),
    ...root.querySelectorAll('aside'),
    ...root.querySelectorAll('header'),
  ];

  for (const container of containers) {
    const anchors = container.querySelectorAll('a');
    for (const a of anchors) {
      let text = (a.textContent || '');
      text = text.replace(/\.[\w-]+\s*\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
      let href = (a.getAttribute('href') || '').trim();
      if (!text || text.length > 80 || !href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;
      // Resolve relative URLs
      try { href = new URL(href, baseUrl).href; } catch { continue; }
      if (seen.has(href)) continue;
      seen.add(href);
      nav.push({ text, href });
    }
  }

  // Always include site home as first item
  if (baseUrl) {
    try {
      const origin = new URL(baseUrl).origin + '/';
      if (!seen.has(origin)) nav.unshift({ text: 'Home', href: origin });
    } catch {}
  }

  return nav;
}

function parseBoolean(val, defaultVal) {
  if (val === undefined || val === null) return defaultVal;
  return val === 'true';
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Serve static files, then API
  if (url.pathname !== '/api' && request.method !== 'POST') {
    if (STATIC_FILES[url.pathname]) {
      const { content, type } = STATIC_FILES[url.pathname];
      return new Response(content, { headers: { 'Content-Type': type } });
    }
    return new Response(HTML_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  try {
    let targetUrl, html;
    let title, links, images, clean, absoluteUrls, includeNav;

    if (request.method === 'POST') {
      const body = await request.json();
      html = body.html;
      targetUrl = body.url || '';
      title = parseBoolean(body.title, true);
      links = parseBoolean(body.links, true);
      images = parseBoolean(body.images, true);
      clean = parseBoolean(body.clean, true);
      absoluteUrls = parseBoolean(body.absoluteUrls, true);
      includeNav = parseBoolean(body.nav, false);
    } else {
      targetUrl = url.searchParams.get('url');
      title = parseBoolean(url.searchParams.get('title'), true);
      links = parseBoolean(url.searchParams.get('links'), true);
      images = parseBoolean(url.searchParams.get('images'), true);
      clean = parseBoolean(url.searchParams.get('clean'), true);
      absoluteUrls = parseBoolean(url.searchParams.get('absoluteUrls'), true);
      includeNav = parseBoolean(url.searchParams.get('nav'), false);
    }

    if (!html && !targetUrl) {
      return new Response('Missing url parameter', { status: 400, headers: CORS_HEADERS });
    }

    if (!html) {
      const resp = await fetch(targetUrl, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      });
      if (!resp.ok) {
        return new Response(`Upstream ${targetUrl} returned ${resp.status} ${resp.statusText}`, { status: 502, headers: CORS_HEADERS });
      }
      html = await resp.text();
    }

    let markdown = convertHtml(html, targetUrl, { title, links, clean, absoluteUrls });
    if (!images) {
      markdown = markdown.replace(/!\[[^\]]*\]\([^\)]+\)\n*/g, '');
    }

    if (includeNav) {
      const nav = extractNav(html, targetUrl);
      return new Response(JSON.stringify({ markdown, nav }), {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    return new Response(markdown, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  } catch (e) {
    return new Response(`Error: ${e.message}`, { status: 500, headers: CORS_HEADERS });
  }
}

// Static files — loaded from disk for local dev, embedded at build time for Cloudflare
let HTML_PAGE = '<!-- placeholder: replaced at build time or runtime -->';
const STATIC_FILES = {};

// Cloudflare Workers entry point
export default { fetch: handleRequest };

// Local dev server (ignored by Workers runtime)
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('worker.mjs')) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const http = await import('node:http');
  const dir = path.dirname(new URL(import.meta.url).pathname);
  const publicDir = path.join(dir, 'public');
  HTML_PAGE = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  // Load static JS modules
  for (const file of fs.readdirSync(publicDir).filter(f => f.endsWith('.mjs') || f.endsWith('.js') || f.endsWith('.css'))) {
    const ext = path.extname(file);
    const types = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css' };
    STATIC_FILES['/' + file] = { content: fs.readFileSync(path.join(publicDir, file), 'utf8'), type: types[ext] };
  }
  const port = process.env.PORT || 4001;
  http.createServer(async (req, res) => {
    const request = new Request(`http://localhost:${port}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'POST' ? await new Promise(resolve => {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => resolve(body));
      }) : undefined,
    });
    const response = await handleRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  }).listen(port, () => console.log(`Downturn worker running on http://localhost:${port}`));
}
