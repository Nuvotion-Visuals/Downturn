import { test } from 'node:test';
import assert from 'node:assert';
import filters from '../url_to_markdown_common_filters.mjs';

const test_markdown = "![photo](https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/photo.svg/20px-photo.svg.png)";
const expected_markdown = "![photo](https://upload.wikimedia.org/wikipedia/en/1/1b/photo.svg)";

test('filter', () => {
		let filtered_markdown = filters.filter("https://en.wikipedia.org/wiki/test", test_markdown);
		assert.strictEqual(filtered_markdown, expected_markdown);
});

const test_html_with_styleblock =
	"<html><head><script>var url = window.location;</script></head><body><style>p { font-weight: bold; }</style><p>Bold?</p></body></html>";

const expected_html =
	"<html><head></head><body><p>Bold?</p></body></html>";

test('strip style and script blocks', () => {
	let output_html = filters.strip_style_and_script_blocks(test_html_with_styleblock);
	assert.strictEqual(output_html, expected_html);
})

// --- absolute_urls option ---

test('resolves path-relative image URLs to absolute by default', () => {
	const md = '![photo](images/panel-switcher.png)';
	const result = filters.filter('https://lumen-app.com/guide/quickstart/', md);
	assert.strictEqual(result, '![photo](https://lumen-app.com/guide/quickstart/images/panel-switcher.png)');
});

test('resolves path-relative link URLs to absolute by default', () => {
	const md = '[next](../advanced/)';
	const result = filters.filter('https://example.com/docs/guide/', md);
	assert.strictEqual(result, '[next](https://example.com/docs/advanced/)');
});

test('resolves root-relative URLs to absolute', () => {
	const md = '[home](/about)';
	const result = filters.filter('https://example.com/page/', md);
	assert.strictEqual(result, '[home](https://example.com/about)');
});

test('leaves absolute http URLs unchanged', () => {
	const md = '[link](https://other.com/page)';
	const result = filters.filter('https://example.com/', md);
	assert.strictEqual(result, '[link](https://other.com/page)');
});

test('leaves anchor-only URLs unchanged', () => {
	const md = '[section](#heading)';
	const result = filters.filter('https://example.com/page/', md);
	assert.strictEqual(result, '[section](#heading)');
});

test('leaves mailto URLs unchanged', () => {
	const md = '[email](mailto:hi@example.com)';
	const result = filters.filter('https://example.com/', md);
	assert.strictEqual(result, '[email](mailto:hi@example.com)');
});

test('resolves dot-relative paths', () => {
	const md = '![img](./assets/pic.png)';
	const result = filters.filter('https://example.com/blog/post/', md);
	assert.strictEqual(result, '![img](https://example.com/blog/post/assets/pic.png)');
});

test('absolute_urls=false preserves relative URLs', () => {
	const md = '![photo](images/panel-switcher.png)';
	const result = filters.filter('https://lumen-app.com/guide/quickstart/', md, false, false);
	assert.strictEqual(result, '![photo](images/panel-switcher.png)');
});

test('absolute_urls=false preserves root-relative URLs', () => {
	const md = '[home](/about)';
	const result = filters.filter('https://example.com/page/', md, false, false);
	assert.strictEqual(result, '[home](/about)');
});

test('resolves multiple relative URLs in one document', () => {
	const md = '![a](images/a.png)\n\n[link](page2)\n\n![b](../images/b.png)';
	const result = filters.filter('https://example.com/docs/guide/', md);
	assert.strictEqual(result,
		'![a](https://example.com/docs/guide/images/a.png)\n\n' +
		'[link](https://example.com/docs/guide/page2)\n\n' +
		'![b](https://example.com/docs/images/b.png)'
	);
});
