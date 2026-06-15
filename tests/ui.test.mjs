import { test } from 'node:test';
import assert from 'node:assert';
import { esc, inline, markdownToHtml, toggleTaskAt, normalizeUrl, formatStats, debounce, faviconUrl, resolveOmnibox, parseWikiLinks } from '../public/ui.mjs';

// --- esc ---

test('esc: escapes ampersands', () => {
  assert.strictEqual(esc('a & b'), 'a &amp; b');
});

test('esc: escapes angle brackets', () => {
  assert.strictEqual(esc('<div>'), '&lt;div&gt;');
});

test('esc: handles mixed content', () => {
  assert.strictEqual(esc('x < y & z > w'), 'x &lt; y &amp; z &gt; w');
});

test('esc: empty string', () => {
  assert.strictEqual(esc(''), '');
});

// --- inline ---

test('inline: bold with **', () => {
  assert.strictEqual(inline('**bold**'), '<strong>bold</strong>');
});

test('inline: bold with __', () => {
  assert.strictEqual(inline('__bold__'), '<strong>bold</strong>');
});

test('inline: italic with *', () => {
  assert.strictEqual(inline('*italic*'), '<em>italic</em>');
});

test('inline: italic with _', () => {
  assert.strictEqual(inline('_italic_'), '<em>italic</em>');
});

test('inline: bold + italic with ***', () => {
  assert.strictEqual(inline('***both***'), '<strong><em>both</em></strong>');
});

test('inline: inline code', () => {
  assert.strictEqual(inline('use `code` here'), 'use <code>code</code> here');
});

test('inline: link', () => {
  assert.strictEqual(inline('[text](https://example.com)'), '<a href="https://example.com">text</a>');
});

test('inline: image', () => {
  assert.strictEqual(inline('![alt](img.png)'), '<img alt="alt" src="img.png">');
});

test('inline: image with empty alt', () => {
  assert.strictEqual(inline('![](img.png)'), '<img alt="" src="img.png">');
});

test('inline: mixed formatting', () => {
  const result = inline('**bold** and *italic* and `code`');
  assert.ok(result.includes('<strong>bold</strong>'));
  assert.ok(result.includes('<em>italic</em>'));
  assert.ok(result.includes('<code>code</code>'));
});

test('inline: strips empty anchor links', () => {
  assert.strictEqual(inline('[](#_about)About'), 'About');
});

test('inline: strips empty anchor links with space', () => {
  assert.strictEqual(inline('[ ](#section)Title'), 'Title');
});

test('inline: linked image [![alt](img)](url)', () => {
  assert.strictEqual(
    inline('[![photo](img.png)](https://example.com)'),
    '<a href="https://example.com"><img alt="photo" src="img.png"></a>'
  );
});

test('inline: linked image with empty alt', () => {
  assert.strictEqual(
    inline('[![](img.png)](https://example.com)'),
    '<a href="https://example.com"><img alt="" src="img.png"></a>'
  );
});

test('inline: keeps non-empty anchor links', () => {
  assert.ok(inline('[About](#_about)').includes('<a href="#_about">About</a>'));
});

test('inline: link with title attribute strips title from href', () => {
  const result = inline('[Compiled language](/wiki/Compiled_language "Compiled language")');
  assert.ok(result.includes('href="/wiki/Compiled_language"'));
  assert.ok(!result.includes('Compiled language"'));
});

test('inline: link with title and spaces in title', () => {
  const result = inline('[Web browser](https://en.wikipedia.org/wiki/Web_browser "Web browser")');
  assert.strictEqual(result, '<a href="https://en.wikipedia.org/wiki/Web_browser">Web browser</a>');
});

test('inline: link without title unchanged', () => {
  const result = inline('[test](https://example.com/path)');
  assert.strictEqual(result, '<a href="https://example.com/path">test</a>');
});

test('inline: underscores in URLs not treated as italic', () => {
  const result = inline('[Link](https://en.wikipedia.org/wiki/General-purpose_programming_language)');
  assert.ok(result.includes('href="https://en.wikipedia.org/wiki/General-purpose_programming_language"'));
  assert.ok(!result.includes('<em>'));
});

test('inline: underscores in link text still work as italic', () => {
  assert.ok(inline('_italic text_').includes('<em>'));
});

test('inline: plain text unchanged', () => {
  assert.strictEqual(inline('plain text'), 'plain text');
});

test('inline: code with brackets not treated as link', () => {
  const result = inline("`filter: ['em', 'i']` selects elements");
  assert.ok(result.includes('<code>'));
  assert.ok(!result.includes('<a href'));
});

test('inline: code content is HTML-escaped', () => {
  const result = inline('use `<div>` here');
  assert.ok(result.includes('&lt;div&gt;'));
});

test('inline: code with link-like pattern not matched', () => {
  const result = inline('`[text](url)` is a link');
  assert.ok(!result.includes('<a href'));
  assert.ok(result.includes('<code>'));
});

// --- markdownToHtml ---

test('md: h1', () => {
  assert.ok(markdownToHtml('# Hello').includes('<h1>Hello</h1>'));
});

test('md: h2', () => {
  assert.ok(markdownToHtml('## Hello').includes('<h2>Hello</h2>'));
});

test('md: h3 through h6', () => {
  assert.ok(markdownToHtml('### H3').includes('<h3>H3</h3>'));
  assert.ok(markdownToHtml('#### H4').includes('<h4>H4</h4>'));
  assert.ok(markdownToHtml('##### H5').includes('<h5>H5</h5>'));
  assert.ok(markdownToHtml('###### H6').includes('<h6>H6</h6>'));
});

test('md: setext h1 with ===', () => {
  const html = markdownToHtml('Title\n===');
  assert.ok(html.includes('<h1>Title</h1>'));
});

test('md: setext h2 with ---', () => {
  const html = markdownToHtml('Title\n---');
  assert.ok(html.includes('<h2>Title</h2>'));
});

test('md: paragraph', () => {
  assert.ok(markdownToHtml('Hello world').includes('<p>Hello world</p>'));
});

test('md: heading with anchor link prefix', () => {
  const html = markdownToHtml('## [](#_about)About');
  assert.ok(html.includes('<h2>About</h2>'));
});

test('md: setext heading with anchor link prefix', () => {
  const html = markdownToHtml('[](#_how_to)How to Navigate\n---');
  assert.ok(html.includes('<h2>How to Navigate</h2>'));
});

test('md: bold in heading', () => {
  assert.ok(markdownToHtml('# **Bold Title**').includes('<strong>Bold Title</strong>'));
});

test('md: horizontal rule with ---', () => {
  assert.ok(markdownToHtml('---').includes('<hr>'));
});

test('md: horizontal rule with ***', () => {
  assert.ok(markdownToHtml('***').includes('<hr>'));
});

test('md: horizontal rule with ___', () => {
  assert.ok(markdownToHtml('___').includes('<hr>'));
});

test('md: unordered list', () => {
  const html = markdownToHtml('- one\n- two\n- three');
  assert.ok(html.includes('<ul>'));
  assert.ok(html.includes('<li>one</li>'));
  assert.ok(html.includes('<li>two</li>'));
  assert.ok(html.includes('<li>three</li>'));
  assert.ok(html.includes('</ul>'));
});

test('md: ordered list', () => {
  const html = markdownToHtml('1. first\n2. second');
  assert.ok(html.includes('<ol>'));
  assert.ok(html.includes('<li>first</li>'));
  assert.ok(html.includes('<li>second</li>'));
  assert.ok(html.includes('</ol>'));
});

test('md: unordered list with + marker', () => {
  const html = markdownToHtml('+ item');
  assert.ok(html.includes('<ul>'));
  assert.ok(html.includes('<li>item</li>'));
});

test('md: unordered list with * marker', () => {
  const html = markdownToHtml('* item');
  assert.ok(html.includes('<ul>'));
  assert.ok(html.includes('<li>item</li>'));
});

test('md: blockquote', () => {
  const html = markdownToHtml('> quoted text');
  assert.ok(html.includes('<blockquote>'));
  assert.ok(html.includes('quoted text'));
  assert.ok(html.includes('</blockquote>'));
});

test('md: multi-line blockquote', () => {
  const html = markdownToHtml('> line one\n> line two');
  assert.ok(html.includes('line one'));
  assert.ok(html.includes('line two'));
  // Should be in one blockquote
  const count = (html.match(/<blockquote>/g) || []).length;
  assert.strictEqual(count, 1);
});

test('md: fenced code block', () => {
  const html = markdownToHtml('```js\nconst x = 1;\n```');
  assert.ok(html.includes('<pre>'));
  assert.ok(html.includes('<code class="language-js">'));
  assert.ok(html.includes('const x = 1;'));
  assert.ok(html.includes('</code></pre>'));
});

test('md: fenced code block escapes HTML', () => {
  const html = markdownToHtml('```\n<div>test</div>\n```');
  assert.ok(html.includes('&lt;div&gt;'));
  assert.ok(!html.includes('<div>test</div>'));
});

test('md: code block without language', () => {
  const html = markdownToHtml('```\nplain code\n```');
  assert.ok(html.includes('<pre>'));
  assert.ok(html.includes('plain code'));
});

test('md: table', () => {
  const md = '| Name | Value |\n|------|-------|\n| a | 1 |\n| b | 2 |';
  const html = markdownToHtml(md);
  assert.ok(html.includes('<table>'));
  assert.ok(html.includes('<th>Name</th>'));
  assert.ok(html.includes('<th>Value</th>'));
  assert.ok(html.includes('<td>a</td>'));
  assert.ok(html.includes('<td>1</td>'));
  assert.ok(html.includes('</table>'));
});

test('md: link in paragraph', () => {
  const html = markdownToHtml('Click [here](https://example.com) now');
  assert.ok(html.includes('<a href="https://example.com">here</a>'));
});

test('md: image in paragraph', () => {
  const html = markdownToHtml('![photo](pic.jpg)');
  assert.ok(html.includes('<img alt="photo" src="pic.jpg">'));
});

test('md: empty input', () => {
  assert.strictEqual(markdownToHtml(''), '');
});

test('md: multiple paragraphs separated by blank line', () => {
  const html = markdownToHtml('First paragraph\n\nSecond paragraph');
  assert.ok(html.includes('<p>First paragraph</p>'));
  assert.ok(html.includes('<p>Second paragraph</p>'));
});

test('md: list followed by paragraph', () => {
  const html = markdownToHtml('- item\n\nParagraph');
  assert.ok(html.includes('<ul>'));
  assert.ok(html.includes('</ul>'));
  assert.ok(html.includes('<p>Paragraph</p>'));
});

// --- normalizeUrl ---

test('normalizeUrl: adds https:// to bare domain', () => {
  assert.strictEqual(normalizeUrl('example.com'), 'https://example.com');
});

test('normalizeUrl: preserves existing https://', () => {
  assert.strictEqual(normalizeUrl('https://example.com'), 'https://example.com');
});

test('normalizeUrl: preserves existing http://', () => {
  assert.strictEqual(normalizeUrl('http://example.com'), 'http://example.com');
});

test('normalizeUrl: fixes double slashes after protocol', () => {
  assert.strictEqual(normalizeUrl('https:////example.com'), 'https://example.com');
});

test('normalizeUrl: fixes triple slashes after protocol', () => {
  assert.strictEqual(normalizeUrl('https:///example.com'), 'https://example.com');
});

test('normalizeUrl: empty string returns empty', () => {
  assert.strictEqual(normalizeUrl(''), '');
});

test('normalizeUrl: null returns empty', () => {
  assert.strictEqual(normalizeUrl(null), '');
});

test('normalizeUrl: case insensitive protocol detection', () => {
  assert.strictEqual(normalizeUrl('HTTPS://EXAMPLE.COM'), 'HTTPS://EXAMPLE.COM');
});

// --- formatStats ---

test('formatStats: basic formatting', () => {
  const result = formatStats('hello', 150);
  assert.ok(result.includes('5 chars'));
  assert.ok(result.includes('KB'));
  assert.ok(result.includes('150ms'));
});

test('formatStats: with suffix', () => {
  const result = formatStats('test', 50, '(cached)');
  assert.ok(result.includes('(cached)'));
});

test('formatStats: without suffix', () => {
  const result = formatStats('test', 50);
  assert.ok(!result.includes('undefined'));
});

test('formatStats: rounds milliseconds', () => {
  const result = formatStats('x', 123.456);
  assert.ok(result.includes('123ms'));
});

test('formatStats: KB calculation', () => {
  const bigString = 'a'.repeat(1024);
  const result = formatStats(bigString, 10);
  assert.ok(result.includes('1.0 KB'));
});

// --- debounce ---

test('debounce: calls function after delay', async () => {
  let called = 0;
  const fn = debounce(() => called++, 50);
  fn();
  assert.strictEqual(called, 0);
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(called, 1);
});

test('debounce: collapses rapid calls', async () => {
  let called = 0;
  const fn = debounce(() => called++, 50);
  fn(); fn(); fn(); fn(); fn();
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(called, 1);
});

test('debounce: passes arguments', async () => {
  let result;
  const fn = debounce((a, b) => { result = a + b; }, 50);
  fn(2, 3);
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(result, 5);
});

// --- faviconUrl ---

test('faviconUrl: valid URL returns google favicon service URL', () => {
  assert.strictEqual(faviconUrl('https://example.com/page'), 'https://www.google.com/s2/favicons?domain=example.com&sz=16');
});

test('faviconUrl: URL with port extracts hostname', () => {
  assert.strictEqual(faviconUrl('https://example.com:8080/path'), 'https://www.google.com/s2/favicons?domain=example.com&sz=16');
});

test('faviconUrl: invalid URL returns empty string', () => {
  assert.strictEqual(faviconUrl('not a url'), '');
});

test('faviconUrl: empty string returns empty', () => {
  assert.strictEqual(faviconUrl(''), '');
});

// --- resolveOmnibox ---

test('omnibox: full URL passes through', () => {
  assert.strictEqual(resolveOmnibox('https://example.com/page'), 'https://example.com/page');
});

test('omnibox: http URL passes through', () => {
  assert.strictEqual(resolveOmnibox('http://example.com'), 'http://example.com');
});

test('omnibox: bare domain gets https', () => {
  assert.strictEqual(resolveOmnibox('example.com'), 'https://example.com');
});

test('omnibox: domain with path', () => {
  assert.strictEqual(resolveOmnibox('example.com/page'), 'https://example.com/page');
});

test('omnibox: plain text becomes search', () => {
  assert.strictEqual(resolveOmnibox('how to cook pasta'), '__search__:how to cook pasta');
});

test('omnibox: empty string returns empty', () => {
  assert.strictEqual(resolveOmnibox(''), '');
});

test('omnibox: whitespace only returns empty', () => {
  assert.strictEqual(resolveOmnibox('   '), '');
});

// --- wiki-links in inline ---

test('inline: [[path]] renders as note link', () => {
  assert.strictEqual(inline('[[ideas]]'), '<a href="note://ideas">ideas</a>');
});

test('inline: [[path|text]] renders with display text', () => {
  assert.strictEqual(inline('[[ideas|My Ideas]]'), '<a href="note://ideas">My Ideas</a>');
});

test('inline: [[nested/path]] uses last segment as display', () => {
  assert.strictEqual(inline('[[a/b/c]]'), '<a href="note://a/b/c">c</a>');
});

test('inline: [[link]] inside backticks not processed', () => {
  const result = inline('`[[ideas]]`');
  assert.ok(result.includes('<code>[[ideas]]</code>'));
});

test('inline: wiki-link with bold', () => {
  const result = inline('**[[ideas]]**');
  assert.ok(result.includes('<strong>'));
  assert.ok(result.includes('note://ideas'));
});

test('inline: text around wiki-link preserved', () => {
  assert.strictEqual(inline('see [[ideas]] here'), 'see <a href="note://ideas">ideas</a> here');
});

// --- normalizeUrl: note:// ---

test('normalizeUrl: note:// passthrough', () => {
  assert.strictEqual(normalizeUrl('note://ideas'), 'note://ideas');
});

test('normalizeUrl: note:// with nested path passthrough', () => {
  assert.strictEqual(normalizeUrl('note://projects/downturn/ideas'), 'note://projects/downturn/ideas');
});

// --- resolveOmnibox: note:// ---

test('omnibox: note:// passthrough', () => {
  assert.strictEqual(resolveOmnibox('note://ideas'), 'note://ideas');
});

// --- parseWikiLinks ---

test('parseWikiLinks: extracts simple links', () => {
  assert.deepStrictEqual(parseWikiLinks('[[a]] and [[b]]'), ['a', 'b']);
});

test('parseWikiLinks: extracts path with display text', () => {
  assert.deepStrictEqual(parseWikiLinks('[[a|display]]'), ['a']);
});

test('parseWikiLinks: deduplicates', () => {
  assert.deepStrictEqual(parseWikiLinks('[[a]] then [[a]]'), ['a']);
});

test('parseWikiLinks: returns empty for no links', () => {
  assert.deepStrictEqual(parseWikiLinks('hello world'), []);
});

test('parseWikiLinks: handles nested paths', () => {
  assert.deepStrictEqual(parseWikiLinks('[[projects/downturn/ideas]]'), ['projects/downturn/ideas']);
});

test('parseWikiLinks: trims whitespace in paths', () => {
  assert.deepStrictEqual(parseWikiLinks('[[ ideas ]]'), ['ideas']);
});

// --- GFM: strikethrough ---

test('inline: strikethrough with ~~', () => {
  assert.strictEqual(inline('~~gone~~'), '<del>gone</del>');
});

test('inline: strikethrough inside text', () => {
  assert.strictEqual(inline('a ~~b~~ c'), 'a <del>b</del> c');
});

test('inline: strikethrough not applied inside inline code', () => {
  assert.strictEqual(inline('`~~keep~~`'), '<code>~~keep~~</code>');
});

// --- GFM: backslash escapes ---

test('inline: backslash escapes asterisks (no emphasis)', () => {
  assert.strictEqual(inline('\\*not bold\\*'), '*not bold*');
});

test('inline: backslash escapes underscore', () => {
  assert.strictEqual(inline('a\\_b\\_c'), 'a_b_c');
});

test('inline: backslash-escaped bracket does not start a link', () => {
  assert.strictEqual(inline('\\[text\\](url)'), '[text](url)');
});

test('inline: escaped less-than is HTML-safe', () => {
  assert.strictEqual(inline('\\<tag\\>'), '&lt;tag&gt;');
});

// --- GFM: autolinks ---

test('inline: autolinks a bare http URL', () => {
  assert.strictEqual(inline('see https://example.com here'),
    'see <a href="https://example.com">https://example.com</a> here');
});

test('inline: autolinks a www URL with http href', () => {
  assert.strictEqual(inline('go www.example.com now'),
    'go <a href="http://www.example.com">www.example.com</a> now');
});

test('inline: autolink excludes trailing punctuation', () => {
  assert.strictEqual(inline('visit https://example.com.'),
    'visit <a href="https://example.com">https://example.com</a>.');
});

test('inline: autolink excludes unbalanced trailing paren', () => {
  assert.strictEqual(inline('(https://example.com)'),
    '(<a href="https://example.com">https://example.com</a>)');
});

test('inline: existing markdown link is not double-autolinked', () => {
  assert.strictEqual(inline('[site](https://example.com)'),
    '<a href="https://example.com">site</a>');
});

test('inline: URL inside inline code is not autolinked', () => {
  assert.strictEqual(inline('`https://example.com`'),
    '<code>https://example.com</code>');
});

// --- GFM: task lists ---

test('md: task list renders checkboxes', () => {
  const html = markdownToHtml('- [ ] todo\n- [x] done');
  assert.ok(html.includes('<li class="task-list-item"><input type="checkbox"> todo</li>'));
  assert.ok(html.includes('<li class="task-list-item"><input type="checkbox" checked> done</li>'));
});

test('md: task list accepts uppercase X', () => {
  const html = markdownToHtml('- [X] done');
  assert.ok(html.includes('<input type="checkbox" checked>'));
});

test('md: non-task bracket content is left alone', () => {
  const html = markdownToHtml('- [z] not a task');
  assert.ok(html.includes('<li>[z] not a task</li>'));
  assert.ok(!html.includes('checkbox'));
});

// --- GFM: nested lists & ordered start ---

test('md: nested unordered list', () => {
  const html = markdownToHtml('- a\n  - b\n  - c\n- d');
  assert.strictEqual(html, '<ul><li>a<ul><li>b</li><li>c</li></ul></li><li>d</li></ul>');
});

test('md: ordered list honors start number', () => {
  const html = markdownToHtml('3. three\n4. four');
  assert.ok(html.includes('<ol start="3">'));
  assert.ok(html.includes('<li>three</li>'));
});

test('md: ordered list starting at 1 has no start attribute', () => {
  const html = markdownToHtml('1. one\n2. two');
  assert.ok(html.includes('<ol>'));
  assert.ok(!html.includes('start='));
});

test('md: nested ordered list inside unordered', () => {
  const html = markdownToHtml('- a\n  1. one\n  2. two\n- b');
  assert.strictEqual(html, '<ul><li>a<ol><li>one</li><li>two</li></ol></li><li>b</li></ul>');
});

// --- GFM: tables ---

test('md: table column alignment', () => {
  const html = markdownToHtml('| L | C | R |\n|:--|:-:|--:|\n| a | b | c |');
  assert.ok(html.includes('<th style="text-align:left">L</th>'));
  assert.ok(html.includes('<th style="text-align:center">C</th>'));
  assert.ok(html.includes('<th style="text-align:right">R</th>'));
  assert.ok(html.includes('<td style="text-align:center">b</td>'));
});

test('md: table without alignment has no style', () => {
  const html = markdownToHtml('| a | b |\n|---|---|\n| 1 | 2 |');
  assert.ok(html.includes('<th>a</th>'));
  assert.ok(!html.includes('text-align'));
});

test('md: escaped pipe stays inside one table cell', () => {
  const html = markdownToHtml('| a | b |\n|---|---|\n| `x\\|y` | z |');
  assert.ok(html.includes('<td><code>x|y</code></td>'));
  assert.ok(html.includes('<td>z</td>'));
});

// --- GFM: fenced code info strings ---

test('md: tilde fenced code block', () => {
  const html = markdownToHtml('~~~\ncode\n~~~');
  assert.ok(html.includes('<pre><code'));
  assert.ok(html.includes('code'));
});

test('md: fence language with plus sign is preserved', () => {
  const html = markdownToHtml('```c++\nint x;\n```');
  assert.ok(html.includes('class="language-c++"'));
  assert.ok(html.includes('int x;'));
});

test('md: fence language with hash is preserved', () => {
  const html = markdownToHtml('```c#\nvar x;\n```');
  assert.ok(html.includes('class="language-c#"'));
});

// --- CommonMark: indented code blocks ---

test('md: indented code block', () => {
  const html = markdownToHtml('    const x = 1;\n    const y = 2;');
  assert.strictEqual(html, '<pre><code>const x = 1;\nconst y = 2;</code></pre>');
});

test('md: indented code escapes HTML', () => {
  const html = markdownToHtml('    <div>hi</div>');
  assert.ok(html.includes('&lt;div&gt;'));
  assert.ok(!html.includes('<div>hi</div>'));
});

// --- CommonMark: soft / hard line breaks ---

test('md: consecutive lines join into one paragraph', () => {
  assert.strictEqual(markdownToHtml('line one\nline two'), '<p>line one line two</p>');
});

test('md: trailing two spaces produce a hard break', () => {
  assert.strictEqual(markdownToHtml('line one  \nline two'), '<p>line one<br>line two</p>');
});

test('md: blank line still separates paragraphs', () => {
  assert.strictEqual(markdownToHtml('one\n\ntwo'), '<p>one</p>\n\n<p>two</p>');
});

test('md: heading after paragraph breaks the paragraph', () => {
  const html = markdownToHtml('text here\n# Heading');
  assert.ok(html.includes('<p>text here</p>'));
  assert.ok(html.includes('<h1>Heading</h1>'));
});

// --- ATX closing hashes ---

test('md: strips trailing closing hashes from heading', () => {
  assert.strictEqual(markdownToHtml('## Title ##'), '<h2>Title</h2>');
});

test('md: keeps interior hash in heading text', () => {
  assert.strictEqual(markdownToHtml('# a # b'), '<h1>a # b</h1>');
});

// --- toggleTaskAt: writing checkbox state back to markdown ---

test('toggleTaskAt: checks an unchecked box', () => {
  assert.strictEqual(toggleTaskAt('- [ ] todo', 0), '- [x] todo');
});

test('toggleTaskAt: unchecks a checked box', () => {
  assert.strictEqual(toggleTaskAt('- [x] done', 0), '- [ ] done');
});

test('toggleTaskAt: toggles only the targeted index', () => {
  const src = '- [ ] a\n- [ ] b\n- [ ] c';
  assert.strictEqual(toggleTaskAt(src, 1), '- [ ] a\n- [x] b\n- [ ] c');
});

test('toggleTaskAt: indexes across nested task items in source order', () => {
  const src = '- [ ] a\n  - [ ] b\n- [ ] c';
  assert.strictEqual(toggleTaskAt(src, 2), '- [ ] a\n  - [ ] b\n- [x] c');
});

test('toggleTaskAt: uppercase X is treated as checked', () => {
  assert.strictEqual(toggleTaskAt('- [X] done', 0), '- [ ] done');
});

test('toggleTaskAt: preserves indentation and bullet marker', () => {
  assert.strictEqual(toggleTaskAt('   * [ ] x', 0), '   * [x] x');
});

test('toggleTaskAt: out-of-range index leaves source unchanged', () => {
  assert.strictEqual(toggleTaskAt('- [ ] a', 5), '- [ ] a');
});

test('toggleTaskAt: ignores non-task list items', () => {
  assert.strictEqual(toggleTaskAt('- plain\n- [ ] task', 0), '- plain\n- [x] task');
});

test('toggleTaskAt: skips task-like lines inside fenced code blocks', () => {
  const src = '```\n- [ ] not real\n```\n- [ ] real';
  assert.strictEqual(toggleTaskAt(src, 0), '```\n- [ ] not real\n```\n- [x] real');
});
