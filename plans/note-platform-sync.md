# Note Platform with Optional Sync

## Goal

Extend Downturn into a note-taking platform where notes, hierarchies, wiki-links, and archived web pages all live in IndexedDB as the primary store, with an optional self-hosted sync server that mirrors data across devices.

## Non-Goals

- Multi-user / multi-tenant — single user only, auth is a shared secret
- Real-time collaboration or CRDT-based merging
- Graph visualization of note links
- Server-side search (search runs client-side over the local IndexedDB copy)
- Version history (can be layered later via git-on-server, not in scope)

## Current State

### Files

- `public/db.mjs` — IndexedDB wrapper (settings, tabs, history, bookmarks, cache)
- `public/index.html` — monolithic 2012-line UI (tabs, sidebar, editor, preview, nav)
- `public/ui.mjs` — pure markdown-to-HTML renderer (206 lines)
- `worker.mjs` — Cloudflare Worker + local dev server, handles `/api` and `/api/search`
- `index.mjs` — standalone HTTP API server (legacy, used in Dockerfile)
- `Dockerfile` — minimal `node:alpine`, runs `index.mjs`, exposes port 1337
- `public/sw.js` — service worker for PWA offline support
- `package.json` — v2.1.6, no runtime dependencies

### Observations

- **CS1**: All persistent data is client-side IndexedDB. Five stores: `settings`, `tabs`, `history`, `bookmarks`, `cache`. No server-side persistence.
  - Evidence: `public/db.mjs:1-208` — full IndexedDB implementation, no server calls
- **CS2**: The `cache` store holds converted web pages (`{ url, markdown, nav, timestamp }`) with 7-day TTL pruning. There is no concept of user-created notes that persist permanently.
  - Evidence: `public/db.mjs:187-208` — cache get/set/clear/prune functions
- **CS3**: The sidebar has three modes: nav links (extracted from web pages), history list, and bookmarks list. There is no file/folder tree for user content.
  - Evidence: `public/index.html` — sidebar rendering logic
- **CS4**: The markdown renderer (`ui.mjs`) handles standard markdown but does not recognize `[[wiki-link]]` syntax.
  - Evidence: `public/ui.mjs:1-206` — no wiki-link pattern in `inline()` or `markdownToHtml()`
- **CS5**: Navigation uses `navigate(targetUrl)` which fetches from the API server or reads from cache. There is no local-note URL scheme.
  - Evidence: `public/index.html:1120-1219` — `navigate()` function, always fetches from `API_BASE`
- **CS6**: The server (`worker.mjs`) is stateless — it converts URLs to markdown and serves static files. No write endpoints exist.
  - Evidence: `worker.mjs:76-302` — `handleRequest()` only handles GET/POST for URL conversion
- **CS7**: The Dockerfile copies only `*.mjs` and `lib/`, runs `index.mjs`. No volumes, no compose file, no auth.
  - Evidence: `Dockerfile:1-14`
- **CS8**: The editor is always editable (`rawPane` is a textarea), but edits are ephemeral — they update the in-memory tab state and live preview but are not saved anywhere unless the user manually uses Ctrl+S for local files.
  - Evidence: `public/index.html` — rawPane input event handler updates preview, no auto-persist

### Interfaces (preserve these)

- `GET /api?url=...` — URL-to-markdown conversion API (used by frontend, MCP, extension)
- `GET /api/search?q=...` — Brave search API
- `POST /api` with `{ html, url }` — HTML-to-markdown conversion
- `db.mjs` exports: `getSettings`, `saveSettings`, `getTabs`, `saveTabs`, `addHistory`, `getHistory`, `searchHistory`, `addBookmark`, `removeBookmark`, `isBookmarked`, `getBookmarks`, `getCache`, `setCache`, `clearCache`, `pruneCache`
- `ui.mjs` exports: `esc`, `inline`, `markdownToHtml`
- MCP tool interface in `mcp.mjs` (`url_to_markdown`, `html_to_markdown`)

## Target State

- **TS1**: A `notes` IndexedDB store holds user-created markdown notes with path-based hierarchy (e.g., `projects/downturn/ideas`). Notes have: `path`, `content`, `created`, `modified`, `version`, `baseVersion`, `deleted` (soft-delete flag).
  - Addresses: CS1, CS2, CS8
- **TS2**: A "Save to Notes" action archives the current converted web page as a permanent note, with metadata recording the source URL and archive date.
  - Addresses: CS2, CS5
- **TS3**: The sidebar has a "Notes" tab showing a collapsible folder tree. Users can create, rename, move, and delete notes and folders from the tree.
  - Addresses: CS3
- **TS4**: The markdown renderer recognizes `[[note-path]]` and `[[note-path|display text]]` syntax, rendering them as clickable links that navigate to the referenced note.
  - Addresses: CS4
- **TS5**: A `backlinks` IndexedDB store tracks which notes link to which. The sidebar shows backlinks for the currently viewed note.
  - Addresses: CS4
- **TS6**: Notes are navigable via a `note://` URL scheme (e.g., `note://projects/downturn/ideas`). The `navigate()` function loads notes from IndexedDB instead of fetching from the API.
  - Addresses: CS5
- **TS7**: An optional sync server (new entry point `sync.mjs`) provides REST endpoints for pushing/pulling notes. Clients compare versions and flag conflicts (show both versions, user picks). The server stores notes as flat files on a Docker volume.
  - Addresses: CS1, CS6, CS7
- **TS8**: A `docker-compose.yml` runs the sync server with a persistent volume and bearer-token auth.
  - Addresses: CS7
- **TS9**: Settings, bookmarks, and history sync alongside notes when a sync server is configured. Tabs remain client-only.
  - Addresses: CS1

## Open Questions

- **Q1**: Should the note path use `/` separators (filesystem-like) or `.` separators (namespace-like)?
  - Option A: `/` — familiar, maps directly to filesystem on sync server
  - Option B: `.` — avoids URL-encoding issues, Obsidian-like
  - Recommendation: `/` — direct filesystem mapping simplifies the sync server and feels natural for a tree view

- **Q2**: How should "Save to Notes" choose the default path for an archived web page?
  - Option A: Flat `archive/` folder with auto-generated name from page title
  - Option B: User picks the destination via a modal
  - Recommendation: Default to `archive/<slugified-title>` with a modal to override

- **Q3**: Should the sync server also serve the frontend (replacing `worker.mjs` for self-hosted), or run as a separate sidecar?
  - Option A: Combined — one process serves UI + sync API
  - Option B: Separate — sync server is a distinct process/container, frontend served separately
  - Recommendation: Combined — simpler Docker setup, one port to expose. The sync routes are just additional endpoints in the same server.

## Tasks

### Phase 1: Notes IndexedDB store and CRUD

Add a `notes` store to IndexedDB and basic create/read/update/delete operations. No UI yet — just the data layer with tests.

- [ ] **T1.1**: Add `notes` IndexedDB store with schema
  - Evidence: CS1 — no notes store exists
  - Files: `public/db.mjs`
  - Details: Bump `DB_VERSION` to 2. Store schema: `{ path (keyPath), content, parentPath, sourceUrl, archivedAt, created, modified, version, baseVersion, deleted }`. Create index on `parentPath` for folder listing. Create index on `modified` for recent-notes queries.

- [ ] **T1.2**: Add note CRUD functions to db.mjs
  - Evidence: CS1, CS8 — no note persistence functions
  - Files: `public/db.mjs`
  - Details: Export functions: `getNote(path)`, `saveNote(path, content, meta)` (auto-sets modified/version), `deleteNote(path)` (soft-delete: sets `deleted: true`, increments version), `listNotes(parentPath)` (returns children of a folder), `getAllNotes()` (for sync manifest), `searchNotes(query)` (text search over path + content). `saveNote` must increment `version` and set `baseVersion` to the previous version.

- [ ] **T1.3**: Add `backlinks` IndexedDB store
  - Evidence: CS4 — no backlink tracking
  - Files: `public/db.mjs`
  - Details: Store schema: `{ id (autoIncrement), fromPath, toPath }`. Index on `toPath` for "what links here" queries. Export: `updateBacklinks(fromPath, linkTargets[])` (deletes old entries for `fromPath`, inserts new), `getBacklinks(toPath)` (returns array of `fromPath` values).

- [ ] **T1.4**: Write tests for note CRUD and backlinks
  - Evidence: CS1
  - Files: `tests/db.test.mjs`
  - Details: Test saveNote/getNote round-trip, version incrementing, soft delete, listNotes filtering by parentPath, searchNotes matching, backlink update and query. Use a mock or in-memory IndexedDB (e.g., `fake-indexeddb` or test against the actual functions with setup/teardown).

**Phase 1 success criteria**: `npm test` passes including new db tests. The `notes` and `backlinks` stores have full CRUD coverage. No UI changes — the app works exactly as before.

### Phase 2: Note navigation and rendering

Wire notes into the navigation system and add wiki-link rendering.

- [ ] **T2.1**: Add `note://` URL scheme to `navigate()`
  - Evidence: CS5 — navigate only handles http URLs and search
  - Files: `public/index.html`
  - Details: In `navigate()`, detect `note://` prefix. Load note from IndexedDB via `db.getNote(path)`. Display content in rawPane/previewPane. Set tab state. Skip the API fetch entirely. Also handle `normalizeUrl()` to not mangle `note://` paths.

- [ ] **T2.2**: Add wiki-link syntax to markdown renderer
  - Evidence: CS4 — renderer does not handle `[[links]]`
  - Files: `public/ui.mjs`
  - Details: In `inline()`, before other link processing, replace `[[path|text]]` with `<a href="note://path">text</a>` and `[[path]]` with `<a href="note://path">path</a>` (using the last segment of path as display text). Escape the path for use in href.

- [ ] **T2.3**: Parse outgoing wiki-links on note save and update backlinks
  - Evidence: CS4
  - Files: `public/index.html`, `public/db.mjs`
  - Details: When saving a note, scan content for `[[...]]` patterns, extract target paths, call `db.updateBacklinks(notePath, targets)`. This keeps the backlinks index current.

- [ ] **T2.4**: Wire Ctrl+S to save current note
  - Evidence: CS8 — edits to web pages are ephemeral
  - Files: `public/index.html`
  - Details: If current tab URL starts with `note://`, Ctrl+S calls `db.saveNote()` with the rawPane content. Show a brief "Saved" status. If it's a new unsaved buffer, prompt for a path first.

- [ ] **T2.5**: Add tests for wiki-link rendering
  - Evidence: CS4
  - Files: `tests/ui.test.mjs`
  - Details: Test `[[path]]` renders to `<a href="note://path">`, `[[path|text]]` renders with display text, nested in bold/italic, inside code blocks (should not render).

**Phase 2 success criteria**: Navigating to `note://any/path` loads from IndexedDB. Wiki-links render as clickable links. Ctrl+S persists note edits. `npm test` passes. Existing web browsing is unaffected.

### Phase 3: Sidebar note tree

Add a tree view to the sidebar for browsing and managing notes.

- [ ] **T3.1**: Add "Notes" tab to sidebar
  - Evidence: CS3 — sidebar only has nav/history/bookmarks
  - Files: `public/index.html`
  - Details: Add a fourth sidebar tab (icon: folder or document). When active, render the note tree instead of nav/history/bookmarks content.

- [ ] **T3.2**: Build collapsible folder tree component
  - Evidence: CS3
  - Files: `public/index.html`
  - Details: Fetch all notes via `db.getAllNotes()`, build a tree structure from paths (split on `/`). Render as nested `<ul>` with expand/collapse toggles on folders. Clicking a note navigates to `note://path`. Folders show child count.

- [ ] **T3.3**: Add create note / create folder actions
  - Evidence: CS3
  - Files: `public/index.html`
  - Details: Right-click context menu or small "+" button in the sidebar. "New Note" prompts for name, creates at the selected folder level. "New Folder" creates an empty path prefix. New note opens in the editor immediately.

- [ ] **T3.4**: Add rename, move, delete actions
  - Evidence: CS3
  - Files: `public/index.html`, `public/db.mjs`
  - Details: Context menu on tree items. Rename updates the note's path (and all backlinks referencing it). Move re-parents to a different folder. Delete soft-deletes. Add `renameNote(oldPath, newPath)` to db.mjs that updates the note path and all backlink records.

- [ ] **T3.5**: Add backlinks panel to sidebar
  - Evidence: CS4
  - Files: `public/index.html`
  - Details: When viewing a note, show a "Backlinks" section below the tree (or as a sub-panel). Lists notes that link to the current note via `db.getBacklinks()`. Each entry is clickable.

- [ ] **T3.6**: Add "Save to Notes" button for web pages
  - Evidence: CS2
  - Files: `public/index.html`
  - Details: New button in the toolbar (or context action). Takes current tab's markdown, opens a modal with path defaulting to `archive/<slugified-title>`. Saves via `db.saveNote()` with `sourceUrl` and `archivedAt` metadata. Navigates to the new note after save.

**Phase 3 success criteria**: The sidebar shows a browsable note tree. Users can create, rename, move, and delete notes. Web pages can be archived into the note tree. Backlinks display for the active note. Existing sidebar tabs (nav, history, bookmarks) still work. `npm test` passes.

### Phase 4: Sync server

Build the optional sync server and wire it into the client.

- [ ] **T4.1**: Create `sync.mjs` — sync server entry point
  - Evidence: CS6 — server is stateless, no write endpoints
  - Files: `sync.mjs` (new)
  - Details: New HTTP server (reuse `lib/http_server.mjs` pattern from `index.mjs`). Reads `SYNC_DATA_DIR` env var (default `/data`), `SYNC_TOKEN` env var for auth. All requests require `Authorization: Bearer <token>` header. Serves the frontend static files too (combined mode, Q3). Endpoints:
    - `GET /sync/manifest` — returns `[{ path, version, modified, deleted }]` for all notes on disk
    - `GET /sync/note/:path` — returns `{ path, content, version, modified, deleted, sourceUrl, archivedAt }`
    - `PUT /sync/note/:path` — body `{ content, baseVersion, sourceUrl, archivedAt }`. If file exists and its version != baseVersion, return 409 Conflict with the server's current content. Otherwise write file, increment version, return 200.
    - `DELETE /sync/note/:path` — soft-delete (write tombstone)
    - `GET /sync/settings` / `PUT /sync/settings` — sync settings blob
    - `GET /sync/bookmarks` / `PUT /sync/bookmarks` — sync bookmarks array
    - `GET /sync/history` / `PUT /sync/history` — sync history array

- [ ] **T4.2**: Implement filesystem storage backend
  - Evidence: CS6, CS7
  - Files: `sync.mjs`
  - Details: Notes stored as `<SYNC_DATA_DIR>/notes/<path>.md`. Metadata (version, modified, deleted, sourceUrl, archivedAt) stored in `<SYNC_DATA_DIR>/meta.json` — a single JSON file mapping path to metadata. On startup, load meta.json into memory. On write, update meta.json atomically (write to tmp, rename). This avoids needing SQLite.

- [ ] **T4.3**: Add sync client to frontend
  - Evidence: CS1 — no sync capability
  - Files: `public/sync.mjs` (new), `public/index.html`
  - Details: New module `public/sync.mjs` exporting `configureSync(serverUrl, token)`, `sync()`, `getSyncStatus()`. The `sync()` function:
    1. Fetch server manifest (`GET /sync/manifest`)
    2. Compare each note's version against local IndexedDB version and baseVersion
    3. For notes where server is ahead and no local edits since last sync: pull (overwrite local)
    4. For notes where local is ahead: push (`PUT /sync/note/:path`)
    5. For notes where both changed (local baseVersion != server version): flag as conflict
    6. Return `{ pulled: [], pushed: [], conflicts: [] }`

- [ ] **T4.4**: Add conflict resolution UI
  - Evidence: CS1
  - Files: `public/index.html`
  - Details: When `sync()` returns conflicts, show a modal listing conflicting notes. For each, show "Keep Local" / "Keep Remote" / "View Diff" buttons. "View Diff" opens a split view with both versions. Choosing a side overwrites the other and pushes the resolution.

- [ ] **T4.5**: Add sync settings UI
  - Evidence: CS1
  - Files: `public/index.html`
  - Details: In the settings panel (gear icon), add "Sync Server" section: URL input, token input, "Test Connection" button, "Sync Now" button, last sync timestamp display. Save sync config to `settings` IndexedDB store. Optionally auto-sync on app focus / note save (with debounce).

- [ ] **T4.6**: Sync settings, bookmarks, and history
  - Evidence: CS1
  - Files: `public/sync.mjs`
  - Details: After note sync, also sync settings/bookmarks/history using the corresponding endpoints. These are simpler — last-write-wins based on timestamp since they're small and rarely conflicting. Pull remote if remote timestamp > local, push if local > remote.

- [ ] **T4.7**: Write sync server tests
  - Evidence: CS6
  - Files: `tests/sync.test.mjs`
  - Details: Test: manifest returns all notes, PUT creates and updates notes, PUT with wrong baseVersion returns 409, DELETE soft-deletes, auth rejects bad tokens. Use tmp directory for SYNC_DATA_DIR.

**Phase 4 success criteria**: Running `node sync.mjs` with `SYNC_TOKEN` and `SYNC_DATA_DIR` starts a server that accepts note push/pull. The frontend can configure a sync server and push/pull notes. Conflicts are detected and surfaced to the user. `npm test` passes including sync server tests. The app works fully offline with no sync server configured (existing behavior preserved).

### Phase 5: Docker and deployment

Production-ready Docker setup for the sync server.

- [ ] **T5.1**: Create `docker-compose.yml`
  - Evidence: CS7 — no compose file, no volumes
  - Files: `docker-compose.yml` (new)
  - Details:
    ```yaml
    services:
      downturn:
        build: .
        ports:
          - "1337:1337"
        volumes:
          - downturn-data:/data
        environment:
          - PORT=1337
          - SYNC_DATA_DIR=/data
          - SYNC_TOKEN=${SYNC_TOKEN}
          - BRAVE_API_KEY=${BRAVE_API_KEY:-}
    volumes:
      downturn-data:
    ```

- [ ] **T5.2**: Update Dockerfile for sync server
  - Evidence: CS7 — Dockerfile runs index.mjs, doesn't include public/ or sync.mjs
  - Files: `Dockerfile`
  - Details: Copy `public/` directory, copy `sync.mjs`. Change CMD to `node sync.mjs` (since sync server also serves frontend). Add `HEALTHCHECK` instruction hitting a `/health` endpoint. Add `/health` endpoint to `sync.mjs`.

- [ ] **T5.3**: Add `.env.example` with documented variables
  - Evidence: CS7
  - Files: `.env.example` (new)
  - Details: Document `PORT`, `SYNC_TOKEN`, `SYNC_DATA_DIR`, `BRAVE_API_KEY` with comments.

**Phase 5 success criteria**: `docker compose up` starts the sync server with persistent storage. Notes survive container rebuilds. The frontend is accessible and sync works end-to-end. Health check passes.

## Verification

- [ ] **V1**: Notes persist across page refreshes
  - Command: Create a note via the UI, refresh the page, navigate to the note
  - Expected: Note content is intact, appears in the sidebar tree

- [ ] **V2**: Wiki-links navigate between notes
  - Command: Create note A with `[[noteB]]`, create note B, click the link in note A's preview
  - Expected: Navigates to note B, note B's backlinks panel shows note A

- [ ] **V3**: Web page archiving works
  - Command: Navigate to any URL, click "Save to Notes", confirm path
  - Expected: Note appears in sidebar tree with source URL metadata, content matches the converted page

- [ ] **V4**: Sync push/pull round-trip
  - Command: Configure sync server, create a note, click "Sync Now", open in a second browser/incognito, configure same sync server, click "Sync Now"
  - Expected: Note appears in the second browser with identical content

- [ ] **V5**: Conflict detection works
  - Command: Edit a note in browser A (don't sync), edit same note in browser B (sync), then sync browser A
  - Expected: Conflict modal appears showing both versions, user can pick one

- [ ] **V6**: Offline functionality preserved
  - Command: Use the app with no sync server configured
  - Expected: All features work — browsing, editing, notes, wiki-links, archiving. No errors about missing sync server.

- [ ] **V7**: Existing web browsing unaffected
  - Command: Navigate to any URL, use search, open YouTube transcript, view GitHub README
  - Expected: All existing functionality works identically

- [ ] **V8**: Docker deployment works
  - Command: `docker compose up -d && curl http://localhost:1337/health`
  - Expected: Returns 200 OK. Notes created via the UI persist after `docker compose down && docker compose up`.

- [ ] **V9**: All tests pass
  - Command: `npm test`
  - Expected: All existing and new tests pass

## Progress Log

- **2026-04-15**: Plan created from architecture discussion. Key decisions: IndexedDB-first with optional sync, last-write-wins for settings/bookmarks/history, conflict detection for notes, filesystem storage on server (no SQLite), combined frontend+sync server.
