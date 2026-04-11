import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { decode } from '../lib/html_entities.mjs';
import TurndownService from '../lib/turndown.mjs';

const html = fs.readFileSync('tests/fixtures/turndown/index.html', 'utf8');

// Decode HTML entities and strip HTML comments in expected output
// The fixture file is HTML — a browser would decode entities in <pre> text content
function decodeExpected(str) {
  return decode(str.replace(/<!--[\s\S]*?-->/g, ''));
}

// Extract test cases from the fixture HTML
// Each case: <div class="case" data-name="..." data-options='...'> <div class="input">...</div> <pre class="expected">...</pre> </div>
const caseRegex = /<div class="case" data-name="([^"]*)"(?:\s+data-options='([^']*)')?\s*>\s*<div class="input">([\s\S]*?)<\/div>\s*<pre class="expected">([\s\S]*?)<\/pre>\s*<\/div>/g;

let match;
let count = 0;
while ((match = caseRegex.exec(html)) !== null) {
  const [, name, optionsStr, input, expected] = match;
  count++;

  test(`turndown: ${name}`, () => {
    const options = optionsStr ? JSON.parse(optionsStr) : {};
    const service = new TurndownService(options);
    const result = service.turndown(input.trim());
    assert.strictEqual(result, decodeExpected(expected));
  });
}

// Sanity check that we found test cases
test('turndown: found test cases', () => {
  assert.ok(count > 100, `Expected >100 test cases, found ${count}`);
});
