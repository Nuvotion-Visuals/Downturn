const DB_NAME = 'downturn';
const DB_VERSION = 2;

let dbPromise;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('tabs')) {
        db.createObjectStore('tabs', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('history')) {
        const store = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'path' });
        store.createIndex('parentPath', 'parentPath', { unique: false });
        store.createIndex('modified', 'modified', { unique: false });
      }
      if (!db.objectStoreNames.contains('backlinks')) {
        const store = db.createObjectStore('backlinks', { keyPath: 'id', autoIncrement: true });
        store.createIndex('fromPath', 'fromPath', { unique: false });
        store.createIndex('toPath', 'toPath', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode = 'readonly') {
  return open().then(db => db.transaction(storeName, mode).objectStore(storeName));
}

function req(promise) {
  return new Promise((resolve, reject) => {
    promise.then(store => {
      // store is already the result if it's a direct IDB request
    });
  });
}

// Generic helpers
async function get(storeName, key) {
  const store = await tx(storeName);
  return new Promise((resolve, reject) => {
    const r = store.get(key);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}

async function put(storeName, value) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = store.put(value);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

async function del(storeName, key) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = store.delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

async function getAll(storeName) {
  const store = await tx(storeName);
  return new Promise((resolve, reject) => {
    const r = store.getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function clear(storeName) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = store.clear();
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

// Settings
export async function getSettings() {
  const row = await get('settings', 'main');
  return row ? row.data : null;
}

export async function saveSettings(data) {
  await put('settings', { key: 'main', data });
}

// Tabs
export async function getTabs() {
  const row = await get('tabs', 'main');
  return row ? row.data : null;
}

export async function saveTabs(data) {
  await put('tabs', { key: 'main', data });
}

// History
export async function addHistory(url, title) {
  if (!url) return;
  const db = await open();
  const storeTx = db.transaction('history', 'readwrite');
  const store = storeTx.objectStore('history');
  const index = store.index('url');

  // Check for existing entry with same URL
  const existing = await new Promise((resolve, reject) => {
    const r = index.get(url);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

  if (existing) {
    existing.title = title || existing.title;
    existing.timestamp = Date.now();
    store.put(existing);
  } else {
    store.add({ url, title: title || '', timestamp: Date.now() });
  }
}

export async function getHistory(limit = 100) {
  const store = await tx('history');
  const index = store.index('timestamp');
  return new Promise((resolve, reject) => {
    const results = [];
    const req = index.openCursor(null, 'prev'); // newest first
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function searchHistory(query) {
  if (!query) return [];
  const all = await getAll('history');
  const q = query.toLowerCase();
  return all
    .filter(h => h.url.toLowerCase().includes(q) || (h.title && h.title.toLowerCase().includes(q)))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);
}

// Bookmarks
export async function addBookmark(url, title) {
  await put('bookmarks', { url, title: title || '', timestamp: Date.now() });
}

export async function removeBookmark(url) {
  await del('bookmarks', url);
}

export async function isBookmarked(url) {
  const row = await get('bookmarks', url);
  return !!row;
}

export async function getBookmarks() {
  const all = await getAll('bookmarks');
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

// Cache
export async function getCache(url) {
  return get('cache', url);
}

export async function setCache(url, markdown, nav) {
  await put('cache', { url, markdown, nav, timestamp: Date.now() });
}

export async function clearCache() {
  await clear('cache');
}

export async function pruneCache(maxAgeDays = 7) {
  const cutoff = Date.now() - maxAgeDays * 86400000;
  const all = await getAll('cache');
  const db = await open();
  const storeTx = db.transaction('cache', 'readwrite');
  const store = storeTx.objectStore('cache');
  for (const entry of all) {
    if (entry.timestamp < cutoff) store.delete(entry.url);
  }
}

// Notes

export function buildNote(path, content, existing, meta = {}) {
  const now = Date.now();
  const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  return {
    path,
    content,
    parentPath,
    sourceUrl: meta.sourceUrl ?? existing?.sourceUrl ?? null,
    archivedAt: meta.archivedAt ?? existing?.archivedAt ?? null,
    created: existing?.created ?? now,
    modified: now,
    version: (existing?.version ?? 0) + 1,
    baseVersion: meta.baseVersion ?? null,
    deleted: false,
    kind: meta.kind ?? existing?.kind ?? 'note',
  };
}

export async function getNote(path) {
  return get('notes', path);
}

export async function saveNote(path, content, meta = {}) {
  const existing = await get('notes', path);
  const note = buildNote(path, content, existing, meta);
  await put('notes', note);
  return note;
}

export async function createFolder(path) {
  const existing = await get('notes', path);
  if (existing && !existing.deleted) return existing;
  const now = Date.now();
  const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  const folder = {
    path, content: '', parentPath, sourceUrl: null, archivedAt: null,
    created: now, modified: now, version: 1, baseVersion: null, deleted: false, kind: 'folder',
  };
  await put('notes', folder);
  return folder;
}

export async function deleteNote(path) {
  const existing = await get('notes', path);
  if (!existing) return;
  const now = Date.now();
  existing.deleted = true;
  existing.version = (existing.version ?? 0) + 1;
  existing.modified = now;
  await put('notes', existing);
  // If folder, also delete children
  if (existing.kind === 'folder') {
    const all = await getAll('notes');
    const prefix = path + '/';
    for (const child of all) {
      if (child.path.startsWith(prefix) && !child.deleted) {
        child.deleted = true;
        child.version = (child.version ?? 0) + 1;
        child.modified = now;
        await put('notes', child);
      }
    }
  }
}

export async function renameNote(oldPath, newPath) {
  const existing = await get('notes', oldPath);
  if (!existing) return;
  await del('notes', oldPath);
  const note = buildNote(newPath, existing.content, null, {
    sourceUrl: existing.sourceUrl,
    archivedAt: existing.archivedAt,
    baseVersion: existing.baseVersion,
    kind: existing.kind,
  });
  note.created = existing.created;
  note.version = existing.version;
  await put('notes', note);
  // If folder, rename all children
  if (existing.kind === 'folder') {
    const all = await getAll('notes');
    const prefix = oldPath + '/';
    for (const child of all) {
      if (child.path.startsWith(prefix)) {
        const childNewPath = newPath + child.path.slice(oldPath.length);
        await del('notes', child.path);
        const updated = buildNote(childNewPath, child.content, null, {
          sourceUrl: child.sourceUrl, archivedAt: child.archivedAt,
          baseVersion: child.baseVersion, kind: child.kind,
        });
        updated.created = child.created;
        updated.version = child.version;
        updated.deleted = child.deleted;
        await put('notes', updated);
      }
    }
  }
  const db = await open();
  const storeTx = db.transaction('backlinks', 'readwrite');
  const store = storeTx.objectStore('backlinks');
  const toIndex = store.index('toPath');
  await new Promise((resolve, reject) => {
    const req = toIndex.openCursor(oldPath);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const val = cursor.value;
        val.toPath = newPath;
        cursor.update(val);
        cursor.continue();
      } else resolve();
    };
    req.onerror = () => reject(req.error);
  });
  const fromIndex = store.index('fromPath');
  await new Promise((resolve, reject) => {
    const req = fromIndex.openCursor(oldPath);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const val = cursor.value;
        val.fromPath = newPath;
        cursor.update(val);
        cursor.continue();
      } else resolve();
    };
    req.onerror = () => reject(req.error);
  });
  return new Promise((resolve, reject) => {
    storeTx.oncomplete = () => resolve();
    storeTx.onerror = () => reject(storeTx.error);
  });
}

export async function listNotes(parentPath) {
  const store = await tx('notes');
  const index = store.index('parentPath');
  return new Promise((resolve, reject) => {
    const r = index.getAll(parentPath);
    r.onsuccess = () => resolve(r.result.filter(n => !n.deleted));
    r.onerror = () => reject(r.error);
  });
}

export async function getAllNotes() {
  const all = await getAll('notes');
  return all.filter(n => !n.deleted);
}

export async function searchNotes(query) {
  if (!query) return [];
  const all = await getAll('notes');
  const q = query.toLowerCase();
  return all
    .filter(n => !n.deleted && (
      n.path.toLowerCase().includes(q) ||
      (n.content && n.content.toLowerCase().includes(q))
    ))
    .sort((a, b) => b.modified - a.modified)
    .slice(0, 20);
}

// Backlinks

export async function updateBacklinks(fromPath, toPathArray) {
  const db = await open();
  const storeTx = db.transaction('backlinks', 'readwrite');
  const store = storeTx.objectStore('backlinks');
  const index = store.index('fromPath');

  await new Promise((resolve, reject) => {
    const req = index.openCursor(fromPath);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });

  for (const toPath of toPathArray) {
    store.add({ fromPath, toPath });
  }

  return new Promise((resolve, reject) => {
    storeTx.oncomplete = () => resolve();
    storeTx.onerror = () => reject(storeTx.error);
  });
}

export async function getBacklinks(toPath) {
  const store = await tx('backlinks');
  const index = store.index('toPath');
  return new Promise((resolve, reject) => {
    const r = index.getAll(toPath);
    r.onsuccess = () => resolve(r.result.map(row => row.fromPath));
    r.onerror = () => reject(r.error);
  });
}
