import { test } from 'node:test';
import assert from 'node:assert';
import processor from '../url_to_markdown_processor.mjs';
import { JSDOM } from '../lib/html_parser.mjs';

const test_html_document =
	"<html><head><title>test page</title></head>" +
	"<body><p>first paragraph</p>" +
	"<h2>heading 2</h2><p>second paragraph</p>" +
	"<h3>heading 3</h3><p>third paragraph</p>" +
	"<p><em>italics</em> <strong>bold</strong></p>" +
	"<p><a href='http://some.url/link'>link</a></p>" +
	"<p><img alt='photo' src='http://some.url/img'></img></p>" +
	"</body></html>";

const expected_markdown_output =
	"# test page\nfirst paragraph\n\nheading 2\n---------\n\nsecond paragraph\n\n" +
	"### heading 3\n\nthird paragraph\n\n_italics_ **bold**\n\n" +
	"[link](http://some.url/link)\n\n![photo](http://some.url/img)";

test('process html', () => {

	const doc = new JSDOM(test_html_document);
	const res = { header: (header, value) => {} };
	const inline_title = true;
	const ignore_links = false;

	let actual_markdown_output = processor.process_dom(
		"http://some.url", doc, res, inline_title, ignore_links
	);

	assert.strictEqual(actual_markdown_output, expected_markdown_output);
})

test('strips link titles from output', () => {
	const html = '<html><head><title>test</title></head><body><p><a href="https://example.com/page" title="Page Title">link</a> text here for readability to work</p><p>More content paragraph needed</p></body></html>';
	const doc = new JSDOM(html);
	const res = { header: () => {} };
	const result = processor.process_dom('https://example.com/', doc, res, '', {
		inline_title: false, ignore_links: false, improve_readability: true, absolute_urls: true,
	});
	assert.ok(!result.includes('"Page Title"'), 'should not contain link title');
	assert.ok(result.includes('[link](https://example.com/page)'), 'should contain clean link');
});

test('strips empty permalink anchors from headings', () => {
	const html = '<html><head><title>test</title></head><body><article>' +
		'<h2>Why are there so many dependencies?<a href="/docs/faq#why-deps"></a></h2>' +
		'<p>Making a full-featured media framework is a huge undertaking.</p>' +
		'<h2>Is it X11 independent?<a href="/docs/faq#x11"></a></h2>' +
		'<p>Yes, we have no hard dependency on X11.</p>' +
		'</article></body></html>';
	const doc = new JSDOM(html);
	const res = { header: () => {} };
	const result = processor.process_dom('https://example.com/docs/faq', doc, res, '', {
		inline_title: false, ignore_links: false, improve_readability: true, absolute_urls: true,
	});
	assert.ok(!result.includes('[]('), 'should not contain empty anchor links');
	assert.ok(result.includes('Why are there so many dependencies?'), 'heading text should remain');
});

test('strips Wikipedia-style link titles', () => {
	const html = '<html><head><title>test</title></head><body><article><p><a href="/wiki/JavaScript" title="JavaScript">JS</a> is a programming language used widely on the web</p><p>It was created in 1995 by Brendan Eich</p></article></body></html>';
	const doc = new JSDOM(html);
	const res = { header: () => {} };
	const result = processor.process_dom('https://en.wikipedia.org/wiki/Test', doc, res, '', {
		inline_title: false, ignore_links: false, improve_readability: true, absolute_urls: true,
	});
	assert.ok(!result.includes('"JavaScript"'), 'should not contain link title');
	assert.ok(result.includes('https://en.wikipedia.org/wiki/JavaScript'), 'should have absolute URL');
});
