import { test } from 'node:test';
import assert from 'node:assert';
import apple_dev_parser from '../url_to_markdown_apple_dev_docs.mjs';

const swift_array_docs_url = "https://developer.apple.com/documentation/swift/array";
const expected_location_of_json = "https://developer.apple.com/tutorials/data/documentation/swift/array.json";

test('parse apple url', () => {
	let location_of_json = apple_dev_parser.dev_doc_url(swift_array_docs_url);
	assert.strictEqual(location_of_json, expected_location_of_json);
});
