# Downturn

Convert web pages to markdown. Zero runtime dependencies.

Based on [macsplit/urltomarkdown](https://github.com/macsplit/urltomarkdown) by Lee Hanken. The original pulls in 634,636 lines of JavaScript through `node_modules/`. This is 5,862 lines, a 99.1% reduction.

The bulk of the original's size comes from [jsdom](https://github.com/jsdom/jsdom), a full browser environment simulation (DOM, CSS, events, navigation) used only to parse HTML into a DOM tree. Downturn replaces it with Mozilla's own [JSDOMParser](https://github.com/mozilla/readability/blob/main/JSDOMParser.js), the lightweight parser that Readability was actually designed for, extended with the handful of DOM methods that Turndown needs. The core libraries (Readability, Turndown) are vendored and ported to modern ESM. The result is validated against 415 tests, including Mozilla Readability's own 117 real-world test pages and Turndown's 140 conversion fixtures, both pulled from their upstream repos.

## Install

```bash
npx -y downturn
```

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

Both accept `output_path` to write directly to a file, plus `include_title`, `include_links`, `use_readability` options.

Example agent interactions:
- "Convert this page to markdown" returns the text in context
- "Save https://example.com/docs to docs/reference.md" writes the file directly

## HTTP Server

```bash
PORT=3000 node index.mjs
```

### GET

```
GET /?url=https://example.com
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `url`     | required | URL to convert |
| `title`   | `false` | Prepend page title as H1 |
| `links`   | `true`  | Include hyperlinks (`false` to strip) |
| `clean`   | `true`  | Use Readability to extract content (`false` for raw) |

### POST

```
POST /
Content-Type: application/x-www-form-urlencoded

url=https://example.com&html=<html>...</html>
```

Supply `html` directly to skip fetching. Query parameters work on POST too.

### Response headers

```
Content-Type: text/markdown
X-Title: URL-encoded page title
Access-Control-Allow-Origin: *
```

Rate limited to 5 requests per 30 seconds per IP. Follows redirects up to 5 hops.

## Pipeline

1. Fetch page (`node:https`, follows redirects)
2. Strip scripts and styles
3. Extract article content (Mozilla Readability)
4. Convert to markdown (Turndown)
5. Apply site-specific filters (Wikipedia, Medium, Stack Overflow, etc.)

HTML parsing uses Mozilla's JSDOMParser with extensions for `querySelector`, `outerHTML`, `cloneNode`, and void element handling.

## Testing

```bash
node --test tests/*.test.mjs
```

415 tests covering the full pipeline against 117 real-world pages, plus Readability and Turndown fixture suites.

## Docker

```bash
docker build -t downturn .
docker run -p 1337:1337 downturn
```

## Structure

```
index.mjs                              HTTP server
mcp.mjs                               MCP stdio transport
url_to_markdown_processor.mjs          Core pipeline
url_to_markdown_readers.mjs            URL fetching, redirect following
url_to_markdown_formatters.mjs         Code block and table pre-processing
url_to_markdown_common_filters.mjs     Post-processing filters
url_to_markdown_apple_dev_docs.mjs     Apple developer docs parser
html_table_to_markdown.mjs             HTML table conversion

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
