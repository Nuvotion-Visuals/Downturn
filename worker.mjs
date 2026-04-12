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

function parseBoolean(val, defaultVal) {
  if (val === undefined || val === null) return defaultVal;
  return val === 'true';
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // API lives at /api, everything else serves the HTML page
  if (url.pathname !== '/api' && request.method !== 'POST') {
    return new Response(HTML_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  try {
    let targetUrl, html;
    let title, links, clean, absoluteUrls;

    if (request.method === 'POST') {
      const body = await request.json();
      html = body.html;
      targetUrl = body.url || '';
      title = parseBoolean(body.title, true);
      links = parseBoolean(body.links, true);
      clean = parseBoolean(body.clean, true);
      absoluteUrls = parseBoolean(body.absoluteUrls, true);
    } else {
      targetUrl = url.searchParams.get('url');
      title = parseBoolean(url.searchParams.get('title'), true);
      links = parseBoolean(url.searchParams.get('links'), true);
      clean = parseBoolean(url.searchParams.get('clean'), true);
      absoluteUrls = parseBoolean(url.searchParams.get('absoluteUrls'), true);
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

    const markdown = convertHtml(html, targetUrl, { title, links, clean, absoluteUrls });

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

// HTML_PAGE is set by the build script for Cloudflare, or loaded from disk for local dev
let HTML_PAGE = '<!-- placeholder: replaced at build time or runtime -->';

// Cloudflare Workers entry point
export default { fetch: handleRequest };

// Local dev server (ignored by Workers runtime)
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('worker.mjs')) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const http = await import('node:http');
  const dir = path.dirname(new URL(import.meta.url).pathname);
  HTML_PAGE = fs.readFileSync(path.join(dir, 'public', 'index.html'), 'utf8');
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
