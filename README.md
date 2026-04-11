# Downturn

A downturn in dependencies.

Web page to markdown converter. Zero dependencies. One `node` command.

A from-scratch rewrite of [macsplit/urltomarkdown](https://github.com/macsplit/urltomarkdown) by Lee Hanken. The original project used 8 npm packages that pulled in 634,636 lines of JavaScript across 7,427 files (62 MB) through `node_modules/`. Downturn delivers the same API and functionality in under 6,000 lines total -- a 99.1% reduction -- with nothing to install.

## MCP Server (for AI agents)

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

Two tools are exposed:
- **`url_to_markdown`** — fetch a URL and return markdown
- **`html_to_markdown`** — convert an HTML string to markdown

Both support options: `include_title`, `include_links`, `use_readability`.

## HTTP Server

```bash
PORT=3000 node index.mjs
```

No `npm install`. No `node_modules`.

### GET

```
GET /?url=https://example.com
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `url`     | required | URL to convert |
| `title`   | `false` | Prepend page title as H1 |
| `links`   | `true`  | Include hyperlinks (`false` to strip) |
| `clean`   | `true`  | Use Readability to extract content (`false` for raw conversion) |

### POST

```
POST /
Content-Type: application/x-www-form-urlencoded

url=https://example.com&html=<html>...</html>
```

Supply `html` directly to skip fetching. Query parameters work on POST too.

### Response

```
Content-Type: text/markdown
X-Title: URL-encoded page title
Access-Control-Allow-Origin: *
```

Rate limited to 5 requests per 30 seconds per IP. Follows redirects up to 5 hops.

## How it works

1. Fetch the page (Node.js built-in `https`, follows redirects)
2. Strip scripts and styles
3. Extract article content ([Mozilla Readability](https://github.com/mozilla/readability))
4. Convert HTML to markdown ([Turndown](https://github.com/mixmark-io/turndown))
5. Apply site-specific filters (Wikipedia, Medium, Stack Overflow, etc.)

The HTML parser is Mozilla's [JSDOMParser](https://github.com/mozilla/readability/blob/main/JSDOMParser.js) -- a lightweight DOM built for Readability -- extended with `querySelector`, `outerHTML`, `cloneNode`, void element handling, and a fix for the original's infinite loop on unclosed comments.

## Testing

```bash
node --test tests/*.test.mjs
```

415 tests:
- 117 golden file tests (full pipeline on real-world pages, verified against original)
- 117 Readability fixtures (content extraction on real HTML)
- 140 Turndown fixtures (HTML-to-markdown conversion)
- 32 unit tests (HTTP server, rate limiter, entity decoder)
- 9 application-level tests

## Docker

```bash
docker build -t downturn .
docker run -p 1337:1337 downturn
```

## Project structure

```
index.mjs                              HTTP server, routing
mcp.mjs                               MCP stdio transport for AI agents
url_to_markdown_processor.mjs          Core pipeline: parse, extract, convert
url_to_markdown_readers.mjs            URL fetching, redirect following
url_to_markdown_formatters.mjs         Pre-process code blocks and tables
url_to_markdown_common_filters.mjs     Post-process markdown (site filters)
url_to_markdown_apple_dev_docs.mjs     Apple developer docs JSON parser
html_table_to_markdown.mjs             HTML tables to markdown tables

lib/
  html_parser.mjs                      DOM parser (vendored JSDOMParser + extensions)
  readability.mjs                      Content extraction (vendored Mozilla Readability)
  turndown.mjs                         HTML to markdown (vendored Turndown)
  html_entities.mjs                    HTML entity decoder
  http_server.mjs                      Express-compatible HTTP server
  rate_limiter.mjs                     Sliding window rate limiter
```

## Credits

- Original project by [Lee Hanken](https://github.com/macsplit/urltomarkdown)
- [Mozilla Readability](https://github.com/mozilla/readability) (Apache 2.0) -- content extraction
- [JSDOMParser](https://github.com/mozilla/readability/blob/main/JSDOMParser.js) (MPL 2.0) -- lightweight HTML parser
- [Turndown](https://github.com/mixmark-io/turndown) (MIT) -- HTML to markdown conversion

## License

MIT
