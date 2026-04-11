# Downturn

A downturn in dependencies.

Web page to markdown converter. Zero dependencies. One `node` command.

A from-scratch rewrite of [macsplit/urltomarkdown](https://github.com/macsplit/urltomarkdown) by Lee Hanken. The original project used 8 npm packages that pulled in 634,636 lines of JavaScript across 7,427 files (62 MB) through `node_modules/`. Downturn delivers the same API and functionality in 5,613 lines total -- a 99.1% reduction -- with nothing to install.

## How it works

The conversion pipeline:

1. Fetch the page (Node.js built-in `https`)
2. Strip scripts and styles
3. Extract article content (vendored [Mozilla Readability](https://github.com/mozilla/readability))
4. Convert HTML to markdown (vendored [Turndown](https://github.com/mixmark-io/turndown))
5. Apply site-specific filters (Wikipedia, Medium, Stack Overflow, etc.)

The HTML parser is Mozilla's [JSDOMParser](https://github.com/mozilla/readability/blob/main/JSDOMParser.js) — a lightweight DOM built specifically for Readability — extended with `querySelector`, `outerHTML`, `cloneNode`, and void element handling.

The HTTP server is ~90 lines on top of `node:http`. The rate limiter is ~35 lines. The HTML entity decoder is ~130 lines. Everything else is the vendored libraries and the application logic.

## API

### GET

```
GET /?url=https://example.com
```

Query parameters:

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

Supply `html` directly to skip fetching. Query parameters (`title`, `links`, `clean`) work on POST too.

### Response

```
Content-Type: text/markdown
X-Title: URL-encoded page title
Access-Control-Allow-Origin: *
```

Rate limited to 5 requests per 30 seconds per IP.

## Running

```bash
PORT=3000 node index.mjs
```

That's it. No `npm install`.

## Testing

```bash
node --test tests/*.test.mjs
```

298 tests:
- 117 Readability fixtures (real-world pages from Mozilla's test suite)
- 139 Turndown fixtures (HTML-to-markdown conversion cases)
- 32 unit tests for the from-scratch modules (HTTP server, rate limiter, entity decoder)
- 10 application-level tests

## Docker

```bash
docker build -t downturn .
docker run -p 1337:1337 downturn
```

Tests run during the Docker build.

## Project structure

```
index.mjs                              HTTP server, routing
url_to_markdown_processor.mjs          Core pipeline: parse, extract, convert
url_to_markdown_readers.mjs            URL fetching, site-specific readers
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
- [Mozilla Readability](https://github.com/mozilla/readability) (Apache 2.0) — content extraction
- [JSDOMParser](https://github.com/mozilla/readability/blob/main/JSDOMParser.js) (MPL 2.0) — lightweight HTML parser
- [Turndown](https://github.com/mixmark-io/turndown) (MIT) — HTML to markdown conversion

## License

MIT
