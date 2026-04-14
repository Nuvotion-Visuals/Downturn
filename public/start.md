# Downturn

A markdown web browser. Convert any web page to clean markdown and browse the web in a distraction-free reader. Edit with live preview, open local files and folders, manage bookmarks and history.

## Getting Started

Type a URL, search term, or domain in the address bar and press **Enter**. Click any link in the preview to navigate. **Ctrl+Click** opens a link in a new tab.

## Browse the Web

Paste any URL and get a clean markdown version of the page. Readability extracts the article content, stripping navigation and clutter. All relative URLs are resolved to absolute so images and links work.

## Search

Type any text to search the web. Results render as markdown with clickable links to browse further.

## Tabs

Open multiple pages at once. Each tab preserves its own content, scroll position, and navigation state. Drag tabs to reorder, middle-click to close. Tabs persist across page refreshes.

## Edit Markdown

The markdown pane is always editable. Type or modify content and see the preview update live in the split view.

## Local Files

Open `.md` files directly with the file icon, or open an entire folder to browse a file tree in the sidebar. Ctrl+S saves back to the original file, or triggers Save As for new content. Works in Firefox and Safari using a standard file picker fallback.

## Site Navigation

The sidebar extracts navigation links from the original page. A home link to the site root is always included. Toggle the sidebar with the sidebar icon.

## Bookmarks and History

Click the bookmark icon to save the current page. History is recorded automatically. Both are searchable in the sidebar tabs. The URL bar autocompletes from your history and bookmarks as you type.

## View Modes

Toggle between **Both** (split view), **Markdown** (editor only), or **Preview** (rendered output only) using the buttons in the bottom bar.

## Themes and Typography

Choose between **Dark**, **Light**, and **Black** (OLED) themes in the right sidebar. Automatically matches your system preference. Customize editor and preview fonts from your installed system fonts, with a visual font picker that renders each option in its own typeface. Adjust font size, line height, and line width to your preference.

## Mobile

Downturn works as a PWA on mobile devices. The layout adapts for touch with larger tap targets, a simplified toolbar, and swipe-from-edge navigation. The sidebar slides in as an overlay with navigation, back/forward, refresh, home, and file controls.

## Browser Extension

Available as a Chrome and Firefox extension. Click the icon to convert the current page to markdown instantly — no server needed. Edit the result, copy to clipboard, or download as a `.md` file.

## Zen Mode

Click the expand icon in the bottom bar to hide all UI chrome and focus on the content. A floating exit button in the corner brings everything back.

## Copy and Download

**Copy** puts the raw markdown on your clipboard. **Download** saves it as a `.md` file named after the page title. **Open in browser** opens the original URL in a regular tab.

## Options

Access conversion options via the gear icon:

- **Include title** -- prepend the page title as an H1 heading
- **Include links** -- keep hyperlinks in the output
- **Include images** -- keep images in the output
- **Use Readability** -- extract article content (disable for raw conversion)
- **Absolute URLs** -- resolve relative URLs to absolute

## About

Downturn also works as an MCP server for AI agents and a standalone HTTP API. Deploy to Cloudflare Workers with `npx wrangler deploy`. Install from npm with `npx -y downturn`.

[GitHub](https://github.com/Nuvotion-Visuals/Downturn)

Built on [Mozilla Readability](https://github.com/mozilla/readability) and [Turndown](https://github.com/mixmark-io/turndown).
