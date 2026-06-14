import { test } from 'node:test';
import assert from 'node:assert';
import { buildNote } from '../public/db.mjs';

// --- buildNote: new note ---

test('buildNote: new note has version 1', () => {
  const note = buildNote('ideas', 'hello', null);
  assert.strictEqual(note.version, 1);
});

test('buildNote: new note has baseVersion null', () => {
  const note = buildNote('ideas', 'hello', null);
  assert.strictEqual(note.baseVersion, null);
});

test('buildNote: new note has deleted false', () => {
  const note = buildNote('ideas', 'hello', null);
  assert.strictEqual(note.deleted, false);
});

test('buildNote: new note sets created and modified', () => {
  const before = Date.now();
  const note = buildNote('ideas', 'hello', null);
  assert.ok(note.created >= before);
  assert.ok(note.modified >= before);
});

test('buildNote: new note defaults sourceUrl and archivedAt to null', () => {
  const note = buildNote('ideas', 'hello', null);
  assert.strictEqual(note.sourceUrl, null);
  assert.strictEqual(note.archivedAt, null);
});

// --- buildNote: parentPath derivation ---

test('buildNote: root-level note has empty parentPath', () => {
  const note = buildNote('ideas', 'content', null);
  assert.strictEqual(note.parentPath, '');
});

test('buildNote: nested note derives parentPath', () => {
  const note = buildNote('projects/downturn', 'content', null);
  assert.strictEqual(note.parentPath, 'projects');
});

test('buildNote: deeply nested note derives parentPath', () => {
  const note = buildNote('a/b/c/d', 'content', null);
  assert.strictEqual(note.parentPath, 'a/b/c');
});

// --- buildNote: updates ---

test('buildNote: increments version on update', () => {
  const existing = { version: 3, created: 1000 };
  const note = buildNote('ideas', 'v2', existing);
  assert.strictEqual(note.version, 4);
});

test('buildNote: preserves created timestamp on update', () => {
  const existing = { version: 1, created: 1000 };
  const note = buildNote('ideas', 'v2', existing);
  assert.strictEqual(note.created, 1000);
  assert.ok(note.modified > 1000);
});

test('buildNote: un-deletes a soft-deleted note', () => {
  const existing = { version: 2, created: 1000, deleted: true };
  const note = buildNote('ideas', 'back', existing);
  assert.strictEqual(note.deleted, false);
  assert.strictEqual(note.version, 3);
});

test('buildNote: preserves existing sourceUrl when meta omits it', () => {
  const existing = { version: 1, created: 1000, sourceUrl: 'https://example.com' };
  const note = buildNote('ideas', 'content', existing);
  assert.strictEqual(note.sourceUrl, 'https://example.com');
});

test('buildNote: meta.sourceUrl overrides existing', () => {
  const existing = { version: 1, created: 1000, sourceUrl: 'https://old.com' };
  const note = buildNote('ideas', 'content', existing, { sourceUrl: 'https://new.com' });
  assert.strictEqual(note.sourceUrl, 'https://new.com');
});

// --- buildNote: meta passthrough ---

test('buildNote: meta.baseVersion passes through', () => {
  const note = buildNote('ideas', 'content', null, { baseVersion: 5 });
  assert.strictEqual(note.baseVersion, 5);
});

test('buildNote: meta.archivedAt passes through', () => {
  const now = Date.now();
  const note = buildNote('archive/page', 'content', null, { archivedAt: now });
  assert.strictEqual(note.archivedAt, now);
});

test('buildNote: meta.sourceUrl passes through on new note', () => {
  const note = buildNote('archive/page', 'content', null, { sourceUrl: 'https://example.com' });
  assert.strictEqual(note.sourceUrl, 'https://example.com');
});

// --- buildNote: kind field ---

test('buildNote: defaults kind to note', () => {
  const note = buildNote('ideas', 'hello', null);
  assert.strictEqual(note.kind, 'note');
});

test('buildNote: preserves kind from existing', () => {
  const existing = { version: 1, created: 1000, kind: 'folder' };
  const note = buildNote('folder', '', existing);
  assert.strictEqual(note.kind, 'folder');
});

test('buildNote: meta.kind overrides existing', () => {
  const existing = { version: 1, created: 1000, kind: 'note' };
  const note = buildNote('x', '', existing, { kind: 'folder' });
  assert.strictEqual(note.kind, 'folder');
});

// --- buildNote: rename scenario ---

test('buildNote: rename preserves metadata via meta passthrough', () => {
  const note = buildNote('new/path', 'content', null, {
    sourceUrl: 'https://example.com',
    archivedAt: 1000,
    baseVersion: 3,
    kind: 'note',
  });
  assert.strictEqual(note.path, 'new/path');
  assert.strictEqual(note.parentPath, 'new');
  assert.strictEqual(note.sourceUrl, 'https://example.com');
  assert.strictEqual(note.archivedAt, 1000);
  assert.strictEqual(note.baseVersion, 3);
  assert.strictEqual(note.version, 1);
  assert.strictEqual(note.kind, 'note');
});
