import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import processor from '../url_to_markdown_processor.mjs';
import filters from '../url_to_markdown_common_filters.mjs';
import { JSDOM } from '../lib/html_parser.mjs';

const fixturesDir = 'tests/fixtures/readability';
const goldenDir = 'tests/fixtures/golden';

const dirs = fs.readdirSync(goldenDir)
  .filter(f => f.endsWith('.md'))
  .map(f => f.replace('.md', ''));

for (const dir of dirs) {
  test(`golden: ${dir}`, () => {
    const goldenPath = path.join(goldenDir, dir + '.md');
    const sourcePath = path.join(fixturesDir, dir, 'source.html');
    let html = fs.readFileSync(sourcePath, 'utf8');
    const expected = fs.readFileSync(goldenPath, 'utf8');

    html = filters.strip_style_and_script_blocks(html);
    const document = new JSDOM(html);
    const res = { header: () => {} };
    const options = {
      inline_title: true,
      ignore_links: false,
      improve_readability: true
    };

    const markdown = processor.process_dom(
      'http://fakehost/test/' + dir,
      document, res, '', options
    );

    assert.strictEqual(markdown, expected);
  });
}
