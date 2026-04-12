import { test } from 'node:test';
import assert from 'node:assert';
import { slugify, extractTitle } from '../title_utils.mjs';

// --- slugify ---

test('slugify: basic title', () => {
  assert.strictEqual(slugify('Hello World'), 'hello-world');
});

test('slugify: preserves hyphens', () => {
  assert.strictEqual(slugify('my-article-title'), 'my-article-title');
});

test('slugify: strips special characters', () => {
  // + and ? are removed, resulting spaces collapse to single hyphens
  assert.strictEqual(slugify('What is 2 + 2?'), 'what-is-2-2');
});

test('slugify: collapses multiple spaces', () => {
  assert.strictEqual(slugify('too   many   spaces'), 'too-many-spaces');
});

test('slugify: collapses multiple hyphens', () => {
  assert.strictEqual(slugify('a -- b --- c'), 'a-b-c');
});

test('slugify: trims leading and trailing whitespace', () => {
  assert.strictEqual(slugify('  padded  '), 'padded');
});

test('slugify: trims leading and trailing hyphens', () => {
  assert.strictEqual(slugify('--hello--'), 'hello');
});

test('slugify: converts underscores to hyphens', () => {
  assert.strictEqual(slugify('snake_case_title'), 'snake-case-title');
});

test('slugify: removes slashes, colons, question marks', () => {
  assert.strictEqual(slugify('path/to:file?name'), 'pathtofilename');
});

test('slugify: caps length at 100 characters', () => {
  const long = 'a'.repeat(150);
  assert.strictEqual(slugify(long).length, 100);
});

test('slugify: handles empty string', () => {
  assert.strictEqual(slugify(''), '');
});

test('slugify: handles only special characters', () => {
  assert.strictEqual(slugify('???!!!'), '');
});

test('slugify: unicode accented characters are stripped', () => {
  // \w in JS regex does not match accented chars, so they get removed
  assert.strictEqual(slugify('café résumé'), 'caf-rsum');
});

test('slugify: real-world article title', () => {
  assert.strictEqual(
    slugify('How to Build a REST API in Node.js (2024 Guide)'),
    'how-to-build-a-rest-api-in-nodejs-2024-guide'
  );
});

test('slugify: title with ampersands and pipes', () => {
  assert.strictEqual(slugify('News & Updates | My Site'), 'news-updates-my-site');
});

// --- extractTitle ---

test('extractTitle: extracts h1', () => {
  const html = '<html><body><h1>My Article</h1><p>content</p></body></html>';
  assert.strictEqual(extractTitle(html), 'My Article');
});

test('extractTitle: extracts h1 with attributes', () => {
  const html = '<html><body><h1 class="title" id="main">Styled Title</h1></body></html>';
  assert.strictEqual(extractTitle(html), 'Styled Title');
});

test('extractTitle: strips inline tags from h1', () => {
  const html = '<html><body><h1><span>A</span> <em>Bold</em> Title</h1></body></html>';
  assert.strictEqual(extractTitle(html), 'A Bold Title');
});

test('extractTitle: prefers h1 over og:title and <title>', () => {
  const html = '<html><head>' +
    '<title>Title Tag</title>' +
    '<meta property="og:title" content="OG Title">' +
    '</head><body><h1>H1 Title</h1></body></html>';
  assert.strictEqual(extractTitle(html), 'H1 Title');
});

test('extractTitle: falls back to og:title when no h1', () => {
  const html = '<html><head>' +
    '<meta property="og:title" content="OG Title">' +
    '<title>Title Tag</title>' +
    '</head><body><p>no heading</p></body></html>';
  assert.strictEqual(extractTitle(html), 'OG Title');
});

test('extractTitle: handles og:title with content before property', () => {
  const html = '<html><head>' +
    '<meta content="Reversed OG" property="og:title">' +
    '</head><body></body></html>';
  assert.strictEqual(extractTitle(html), 'Reversed OG');
});

test('extractTitle: falls back to <title> when no h1 or og:title', () => {
  const html = '<html><head><title>Page Title</title></head><body><p>text</p></body></html>';
  assert.strictEqual(extractTitle(html), 'Page Title');
});

test('extractTitle: returns null when no title found', () => {
  const html = '<html><body><p>no title anywhere</p></body></html>';
  assert.strictEqual(extractTitle(html), null);
});

test('extractTitle: returns null for empty string', () => {
  assert.strictEqual(extractTitle(''), null);
});

test('extractTitle: trims whitespace from extracted titles', () => {
  const html = '<html><body><h1>  spaced out  </h1></body></html>';
  assert.strictEqual(extractTitle(html), 'spaced out');
});

test('extractTitle: handles multiline h1', () => {
  const html = '<html><body><h1>\n  Multi\n  Line\n</h1></body></html>';
  assert.strictEqual(extractTitle(html), 'Multi\n  Line');
});

test('extractTitle: handles title with HTML entities in text', () => {
  const html = '<html><head><title>Tom &amp; Jerry</title></head><body></body></html>';
  assert.strictEqual(extractTitle(html), 'Tom &amp; Jerry');
});

test('extractTitle: uses first h1 if multiple exist', () => {
  const html = '<html><body><h1>First</h1><h1>Second</h1></body></html>';
  assert.strictEqual(extractTitle(html), 'First');
});

test('extractTitle: case-insensitive tag matching', () => {
  const html = '<HTML><BODY><H1>Upper Case Tags</H1></BODY></HTML>';
  assert.strictEqual(extractTitle(html), 'Upper Case Tags');
});

test('extractTitle: og:title with single quotes', () => {
  const html = "<html><head><meta property='og:title' content='Single Quoted'></head><body></body></html>";
  assert.strictEqual(extractTitle(html), 'Single Quoted');
});

// --- extractTitle + slugify integration ---

test('extractTitle + slugify: real-world page produces good filename', () => {
  const html = '<html><head><title>Site Name</title>' +
    '<meta property="og:title" content="OG Fallback">' +
    '</head><body>' +
    '<h1>How to Build a REST API in Node.js (2024 Guide)</h1>' +
    '</body></html>';
  const title = extractTitle(html);
  const slug = slugify(title);
  assert.strictEqual(slug, 'how-to-build-a-rest-api-in-nodejs-2024-guide');
});

test('extractTitle + slugify: fallback chain produces usable slug', () => {
  const html = '<html><head><title>My Blog — Latest Posts</title></head><body><p>text</p></body></html>';
  const title = extractTitle(html);
  const slug = slugify(title);
  assert.strictEqual(slug, 'my-blog-latest-posts');
});
