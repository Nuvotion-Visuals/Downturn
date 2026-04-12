# Welcome to Downturn

A markdown web browser. Fetch any web page as clean, readable markdown — no ads, no popups, no JavaScript clutter.

## Getting Started

Type a URL in the address bar and press **Enter** to browse any website in markdown.

Click any link in the preview to navigate to that page. Use **Ctrl+Click** to open a link in a new tab.

## Features

### Browse the Web in Markdown

Paste any URL and get a clean markdown version of the page. Readability extracts the article content, stripping navigation, ads, and clutter. All relative URLs are resolved to absolute so images and links work.

### Tabs

Open multiple pages at once. Each tab preserves its own content, scroll position, and navigation state. Tabs persist across page refreshes.

### Site Navigation

The sidebar extracts navigation links from the original page. Click the hamburger menu to toggle it. A **Home** link to the site root is always included.

### Edit Markdown

The markdown pane is always editable. Type or modify content and see the preview update live. Use **Ctrl+S** to save your changes to a file.

### Local Files

Open `.md` files directly with the file button, or open an entire folder to browse a file tree in the sidebar. Changes save back to the original file with **Ctrl+S**.

### View Modes

Toggle between **Both** (split view), **Markdown** (editor only), or **Preview** (rendered output only) using the buttons in the bottom bar.

### Copy and Download

**Copy** puts the raw markdown on your clipboard. **Download** saves it as a `.md` file named after the page title. **Open in browser** opens the original URL in a regular tab.

## Options

Access conversion options via the gear icon:

- **Include title** — prepend the page title as an H1 heading
- **Include links** — keep hyperlinks in the output
- **Include images** — keep images in the output
- **Use Readability** — extract article content (disable for raw conversion)
- **Absolute URLs** — resolve relative URLs to absolute

## About

Downturn converts web pages to markdown with zero runtime dependencies. It also works as an MCP server for AI agents and an HTTP API.

Built on [Mozilla Readability](https://github.com/mozilla/readability) and [Turndown](https://github.com/mixmark-io/turndown).
