import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from '../lib/html_parser.mjs';
import { Readability } from '../lib/readability.mjs';

const fixturesDir = 'tests/fixtures/readability';
const dirs = fs.readdirSync(fixturesDir).filter(d => {
  const fullPath = path.join(fixturesDir, d);
  return fs.statSync(fullPath).isDirectory();
});

for (const dir of dirs) {
  test(`readability: ${dir}`, () => {
    const source = fs.readFileSync(path.join(fixturesDir, dir, 'source.html'), 'utf8');
    const expectedPath = path.join(fixturesDir, dir, 'expected.html');
    const expected = fs.existsSync(expectedPath)
      ? fs.readFileSync(expectedPath, 'utf8')
      : null;

    const dom = new JSDOM(source);
    const reader = new Readability(dom.window.document);
    const result = reader.parse();

    assert.ok(result, `Readability returned null for ${dir}`);
    assert.ok(result.content, `No content extracted for ${dir}`);
    assert.ok(result.content.length > 0, `Empty content for ${dir}`);
  });
}
