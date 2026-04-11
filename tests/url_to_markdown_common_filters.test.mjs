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
