const DB_NAME = 'downturn';
const DB_VERSION = 1;

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
