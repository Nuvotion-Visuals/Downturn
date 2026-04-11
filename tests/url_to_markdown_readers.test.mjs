import { test } from 'node:test';
import assert from 'node:assert';
import { html_reader, stack_reader, apple_reader, reader_for_url } from '../url_to_markdown_readers.mjs';

test('get html reader', () => {
	let reader = reader_for_url("https://en.wikipedia.org");
	assert(reader instanceof html_reader);
});

test('get stack overflow reader', () => {
	let reader = reader_for_url("https://stackoverflow.com/questions/0");
	assert(reader instanceof stack_reader);
});

test('get apple dev docs reader', () => {
	let reader = reader_for_url("https://developer.apple.com/documentation/swift/array");
	assert(reader instanceof apple_reader);
});
