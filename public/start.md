# Welcome to Downturn

A markdown web browser. Convert any web page to clean markdown and browse the web in a distraction-free reader. Edit with live preview, open local files and folders, manage bookmarks and history.

## Getting Started

Type a URL, search term, or domain in the address bar and press **Enter**. Click any link in the preview to navigate. **Ctrl+Click** opens a link in a new tab.

## Browse the Web

Paste any URL and get a clean markdown version of the page. Readability extracts the article content, stripping navigation and clutter. All relative URLs are resolved to absolute so images and links work. Code blocks are syntax highlighted.

## Search

Type any text to search Wikipedia. Results render as markdown with clickable links to browse further.

## Tabs

Open multiple pages at once. Each tab preserves its own content, scroll position, and navigation state. Drag tabs to reorder, middle-click to close. Tabs persist across page refreshes.

## Edit Markdown

The markdown pane is always editable. Type or modify content and see the preview update live in the split view.

## Local Files

Open `.md` files directly with the file icon, or open an entire folder to browse a file tree in the sidebar. Ctrl+S saves back to the original file, or triggers Save As for new content.

## Site Navigation

The sidebar extracts navigation links from the original page. A home link to the site root is always included. Toggle the sidebar with the sidebar icon.

## Bookmarks and History

Click the bookmark icon to save the current page. History is recorded automatically. Both are searchable in the sidebar tabs. The URL bar autocompletes from your history and bookmarks as you type.

## View Modes

Toggle between **Both** (split view), **Markdown** (editor only), or **Preview** (rendered output only) using the buttons in the bottom bar.

## Themes

Choose between **Dark**, **Light**, and **Black** (OLED) themes in the right sidebar. Automatically matches your system preference. Editor and preview fonts are customizable from your installed system fonts.

## Copy and Download

**Copy** puts the raw markdown on your clipboard. **Download** saves it as a `.md` file named after the page title. **Open in browser** opens the original URL in a regular tab.

## Options

Access conversion options via the gear icon:

- **Include title** — prepend the page title as an H1 heading
- **Include links** — keep hyperlinks in the output
- **Include images** — keep images in the output
- **Use Readability** — extract article content (disable for raw conversion)
- **Absolute URLs** — resolve relative URLs to absolute

## About

Downturn also works as an MCP server for AI agents and a standalone HTTP API. Deploy to Cloudflare Workers with `npx wrangler deploy`.

Built on [Mozilla Readability](https://github.com/mozilla/readability) and [Turndown](https://github.com/mixmark-io/turndown).
