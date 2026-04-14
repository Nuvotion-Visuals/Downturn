#!/usr/bin/env node

// MCP (Model Context Protocol) stdio transport for Downturn
// Speaks JSON-RPC over stdin/stdout. No dependencies.
//
// MCP config:
//   { "command": "npx", "args": ["-y", "downturn"] }
//   { "command": "node", "args": ["path/to/mcp.mjs"] }

import { createInterface } from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import processor from './url_to_markdown_processor.mjs';
import filters from './url_to_markdown_common_filters.mjs';
import { JSDOM } from './lib/html_parser.mjs';
import https from 'node:https';
import http from 'node:http';
import { slugify, extractTitle } from './title_utils.mjs';

const SERVICE_USER_AGENT = 'Downturn/2.0';
const TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;

// Fetch a URL, follow redirects, return HTML string
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    let redirects = 0;
    function doFetch(url) {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': SERVICE_USER_AGENT } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (++redirects > MAX_REDIRECTS) { reject(new Error('Too many redirects')); return; }
          doFetch(new URL(res.headers.location, url).href);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
      req.setTimeout(TIMEOUT_MS, () => { req.destroy(); reject(new Error('Timeout')); });
    }
    doFetch(url);
  });
}

// Convert URL to markdown, returns { markdown, html } so callers can extract metadata from the raw HTML
async function urlToMarkdown(url, { title = true, links = true, clean = true, absoluteUrls = true } = {}) {
  // GitHub repo: fetch README directly
  const ghMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (ghMatch) {
    const [, owner, repo] = ghMatch;
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`;
      const md = await fetchUrl(rawUrl);
      const base = `https://github.com/${owner}/${repo}/blob/HEAD/`;
      const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`;
      const codeBlocks = [];
      let markdown = md.replace(/(`{1,3})[\s\S]*?\1/g, (m) => { codeBlocks.push(m); return `\x00CB${codeBlocks.length - 1}\x00`; });
      markdown = markdown.replace(/!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g, (m, alt, path) => `![${alt}](${rawBase}${path})`);
      markdown = markdown.replace(/\[([^\]]+)\]\((?!https?:\/\/)(?!#)([^)]+)\)/g, (m, text, path) => `[${text}](${base}${path})`);
      markdown = markdown.replace(/\x00CB(\d+)\x00/g, (m, i) => codeBlocks[i]);
      return { markdown, html: md };
    } catch {}
  }

  // YouTube: fetch transcript via Android InnerTube API
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
  if (ytMatch) {
    const videoId = ytMatch[1];
    try {
      const YT_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';
      const resp = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': YT_UA },
        body: JSON.stringify({
          context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
          videoId,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const videoTitle = data?.videoDetails?.title || 'YouTube Video';
        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (Array.isArray(tracks) && tracks.length) {
          const track = tracks.find(t => t.languageCode === 'en' && !t.kind) ||
                        tracks.find(t => t.languageCode === 'en') ||
                        tracks.find(t => !t.kind) ||
                        tracks[0];
          const captionResp = await fetch(track.baseUrl, { headers: { 'User-Agent': YT_UA } });
          if (captionResp.ok) {
            const xml = await captionResp.text();
            const segments = [];
            const srv3Re = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
            let m;
            while ((m = srv3Re.exec(xml)) !== null) {
              const ms = parseInt(m[1]);
              let text = m[3].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\n/g, ' ').trim();
              if (!text) continue;
              const totalSecs = Math.floor(ms / 1000);
              const mins = Math.floor(totalSecs / 60);
              const secs = (totalSecs % 60).toString().padStart(2, '0');
              segments.push({ time: `${mins}:${secs}`, text });
            }
            if (!segments.length) {
              const classicRe = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
              while ((m = classicRe.exec(xml)) !== null) {
                const s = parseFloat(m[1]);
                let text = m[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\n/g, ' ').trim();
                if (!text) continue;
                const mins = Math.floor(s / 60);
                const secs = Math.floor(s % 60).toString().padStart(2, '0');
                segments.push({ time: `${mins}:${secs}`, text });
              }
            }
            if (segments.length) {
              const langName = track.name?.runs?.[0]?.text || track.name?.simpleText || track.languageCode || '';
              const autoGen = track.kind === 'asr' ? ' (auto-generated)' : '';
              let markdown = `# ${videoTitle}\n\n`;
              markdown += `[Watch on YouTube](https://www.youtube.com/watch?v=${videoId})\n\n`;
              markdown += `**Transcript** — ${langName}${autoGen}\n\n---\n\n`;
              for (const seg of segments) {
                markdown += `**${seg.time}** ${seg.text}\n\n`;
              }
              return { markdown, html: '' };
            }
          }
        }
      }
    } catch {}
  }

  const html = await fetchUrl(url);
  const stripped = filters.strip_style_and_script_blocks(html);
  const document = new JSDOM(stripped);
  const res = { header: () => {} };
  const options = {
    inline_title: title,
    ignore_links: !links,
    improve_readability: clean,
    absolute_urls: absoluteUrls,
  };
  return { markdown: processor.process_dom(url, document, res, '', options), html };
}

// Convert HTML string to markdown, returns { markdown, html } for metadata extraction
function htmlToMarkdown(htmlStr, url = '', { title = true, links = true, clean = true, absoluteUrls = true } = {}) {
  const stripped = filters.strip_style_and_script_blocks(htmlStr);
  const document = new JSDOM(stripped);
  const res = { header: () => {} };
  const options = {
    inline_title: title,
    ignore_links: !links,
    improve_readability: clean,
    absolute_urls: absoluteUrls,
  };
  return { markdown: processor.process_dom(url, document, res, '', options), html: htmlStr };
}

// MCP protocol
const PROTOCOL_VERSION = '2024-11-05';

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(msg + '\n');
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  process.stdout.write(msg + '\n');
}

function sendNotification(method, params) {
  const msg = JSON.stringify({ jsonrpc: '2.0', method, params });
  process.stdout.write(msg + '\n');
}

async function handleMessage(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  const { id, method, params } = msg;

  if (method === 'initialize') {
    sendResponse(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: 'downturn', version: '2.0.0' },
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return; // no-op, client confirms init
  }

  if (method === 'tools/list') {
    sendResponse(id, {
      tools: [
        {
          name: 'url_to_markdown',
          description: 'Fetch a web page and convert it to markdown. Extracts the main article content, strips navigation and ads. GitHub repo URLs return the README. YouTube URLs return the transcript.',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'The URL to fetch and convert. Supports web pages, GitHub repos, and YouTube videos.' },
              output_path: { type: 'string', description: 'Full file path to write the markdown to. Overrides output_dir.' },
              output_dir: { type: 'string', description: 'Directory to write the markdown to. Filename is auto-generated from the page title (h1 → og:title → <title> → URL slug).' },
              include_title: { type: 'boolean', description: 'Prepend the page title as an H1 heading', default: true },
              include_links: { type: 'boolean', description: 'Include hyperlinks in the output', default: true },
              include_images: { type: 'boolean', description: 'Include images in the output', default: true },
              use_readability: { type: 'boolean', description: 'Use Readability to extract article content', default: true },
              absolute_urls: { type: 'boolean', description: 'Resolve relative URLs to absolute using the page URL', default: true },
            },
            required: ['url'],
          },
        },
        {
          name: 'html_to_markdown',
          description: 'Convert an HTML string to markdown.',
          inputSchema: {
            type: 'object',
            properties: {
              html: { type: 'string', description: 'The HTML string to convert' },
              url: { type: 'string', description: 'Base URL for resolving relative links', default: '' },
              output_path: { type: 'string', description: 'Full file path to write the markdown to. Overrides output_dir.' },
              output_dir: { type: 'string', description: 'Directory to write the markdown to. Filename is auto-generated from the page title (h1 → og:title → <title> → URL slug).' },
              include_title: { type: 'boolean', description: 'Prepend the page title as an H1 heading', default: true },
              include_links: { type: 'boolean', description: 'Include hyperlinks in the output', default: true },
              include_images: { type: 'boolean', description: 'Include images in the output', default: true },
              use_readability: { type: 'boolean', description: 'Use Readability to extract article content', default: true },
              absolute_urls: { type: 'boolean', description: 'Resolve relative URLs to absolute using the base URL', default: true },
            },
            required: ['html'],
          },
        },
      ],
    });
    return;
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments || {};

    try {
      let result;
      if (toolName === 'url_to_markdown') {
        if (!args.url) {
          sendError(id, -32602, 'Missing required parameter: url');
          return;
        }
        result = await urlToMarkdown(args.url, {
          title: args.include_title ?? true,
          links: args.include_links ?? true,
          clean: args.use_readability ?? true,
          absoluteUrls: args.absolute_urls ?? true,
        });
      } else if (toolName === 'html_to_markdown') {
        if (!args.html) {
          sendError(id, -32602, 'Missing required parameter: html');
          return;
        }
        result = htmlToMarkdown(args.html, args.url || '', {
          title: args.include_title ?? true,
          links: args.include_links ?? true,
          clean: args.use_readability ?? true,
          absoluteUrls: args.absolute_urls ?? true,
        });
      } else {
        sendError(id, -32601, `Unknown tool: ${toolName}`);
        return;
      }

      let { markdown, html: sourceHtml } = result;
      if (args.include_images === false) {
        markdown = markdown.replace(/!\[[^\]]*\]\([^\)]+\)\n*/g, '');
      }

      // Resolve output path: explicit output_path wins, then output_dir with auto-naming
      let outPath = null;
      if (args.output_path) {
        outPath = path.resolve(args.output_path);
      } else if (args.output_dir) {
        const pageTitle = extractTitle(sourceHtml);
        let slug = pageTitle ? slugify(pageTitle) : null;
        if (!slug && args.url) {
          // Fallback: slug from URL pathname
          try {
            const pathname = new URL(args.url).pathname.replace(/\/$/, '');
            slug = slugify(pathname.split('/').pop() || 'page');
          } catch {
            slug = 'page';
          }
        }
        slug = slug || 'page';
        outPath = path.resolve(args.output_dir, slug + '.md');
      }

      if (outPath) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, markdown);
        sendResponse(id, {
          content: [{ type: 'text', text: `Wrote ${markdown.length} chars to ${outPath}` }],
        });
      } else {
        sendResponse(id, {
          content: [{ type: 'text', text: markdown }],
        });
      }
    } catch (e) {
      sendResponse(id, {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      });
    }
    return;
  }

  if (id) {
    sendError(id, -32601, `Unknown method: ${method}`);
  }
}

// Read JSON-RPC messages from stdin
const rl = createInterface({ input: process.stdin });
rl.on('line', handleMessage);
