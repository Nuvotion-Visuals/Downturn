# Downturn

Fetch web pages and convert them to clean markdown. Zero runtime dependencies.

Use it as an MCP server, HTTP API, or as a markdown web browser — paste a URL, read the page as markdown, click links to keep browsing.

Based on [macsplit/urltomarkdown](https://github.com/macsplit/urltomarkdown) by Lee Hanken — the original pulls in 634,636 lines of JavaScript through `node_modules/`. This is 6,051 lines, a 99.0% reduction.

## Web UI

```bash
node worker.mjs
```

Open `http://localhost:4001` in your browser. Paste a URL, hit Enter, browse the web in markdown. Click any link to navigate to that page.

Features:
- Split view (markdown + rendered preview), or toggle to single pane
- Browser back/forward navigation via URL hash
- Copy markdown to clipboard, download as `.md`
- Configurable: title, links, readability, absolute URL resolution
- Deploys to Cloudflare Workers — bundle with `npx esbuild worker.mjs --bundle --outfile=dist/worker.js --format=esm --external:node:http`

## MCP Server

```json
{
  "mcpServers": {
    "downturn": {
      "command": "npx",
      "args": ["-y", "downturn"]
    }
  }
}
```

Tools:
- **`url_to_markdown`** fetches a URL and returns markdown
- **`html_to_markdown`** converts an HTML string to markdown

| Parameter | Default | Description |
|-----------|---------|-------------|
| `output_path` | | Full file path to write markdown to |
| `output_dir` | | Directory to write to; filename is auto-generated from the page title (h1, og:title, title tag, or URL slug) |
| `include_title` | `true` | Prepend the page title as an H1 heading |
| `include_links` | `true` | Include hyperlinks in the output |
| `use_readability` | `true` | Use Readability to extract article content |
| `absolute_urls` | `true` | Resolve relative URLs (images, links) to absolute using the page URL |

## HTTP API

```bash
PORT=3000 node index.mjs
```

```
GET /?url=https://example.com&title=true&links=true&clean=true
```

```
POST /
Content-Type: application/x-www-form-urlencoded

url=https://example.com&html=<html>...</html>
```

Returns `Content-Type: text/markdown` with CORS headers. Rate limited to 5 requests per 30 seconds per IP.

## Pipeline

1. Fetch page (follows redirects)
2. Strip scripts and styles
3. Extract article content (Mozilla Readability)
4. Convert to markdown (Turndown)
5. Resolve relative URLs to absolute
6. Apply site-specific filters (Wikipedia, Medium, Stack Overflow, etc.)

## Testing

```bash
node --test tests/*.test.mjs
```

472 tests covering the full pipeline, MCP integration, title extraction, and URL resolution.

## Structure

```
worker.mjs                             Cloudflare Worker + local dev server
index.mjs                              HTTP API server
mcp.mjs                                MCP stdio transport
title_utils.mjs                        Title extraction and filename slugification
url_to_markdown_processor.mjs          Core pipeline
url_to_markdown_readers.mjs            URL fetching, redirect following
url_to_markdown_formatters.mjs         Code block and table pre-processing
url_to_markdown_common_filters.mjs     Post-processing filters
url_to_markdown_apple_dev_docs.mjs     Apple developer docs parser
html_table_to_markdown.mjs             HTML table conversion
public/index.html                      Web UI (single file, inline CSS/JS)

lib/
  html_parser.mjs                      DOM parser (vendored JSDOMParser)
  readability.mjs                      Content extraction (vendored Readability)
  turndown.mjs                         HTML to markdown (vendored Turndown)
  html_entities.mjs                    HTML entity decoder
  http_server.mjs                      HTTP server on node:http
  rate_limiter.mjs                     Sliding window rate limiter
```

## Credits

- [Lee Hanken](https://github.com/macsplit/urltomarkdown), original project
- [Mozilla Readability](https://github.com/mozilla/readability) (Apache 2.0)
- [JSDOMParser](https://github.com/mozilla/readability/blob/main/JSDOMParser.js) (MPL 2.0)
- [Turndown](https://github.com/mixmark-io/turndown) (MIT)

## License

MIT
