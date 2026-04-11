import { test } from 'node:test';
import assert from 'node:assert';
import { decode } from '../lib/html_entities.mjs';

test('decodes named entities', () => {
  assert.strictEqual(decode('&amp;&lt;&gt;&quot;&apos;'), '&<>"\'');
});

test('decodes nbsp', () => {
  assert.strictEqual(decode('hello&nbsp;world'), 'hello\u00A0world');
});

test('decodes numeric decimal entities', () => {
  assert.strictEqual(decode('&#169;'), '©');
  assert.strictEqual(decode('&#60;'), '<');
  assert.strictEqual(decode('&#8212;'), '—');
});

test('decodes numeric hex entities', () => {
  assert.strictEqual(decode('&#x00A9;'), '©');
  assert.strictEqual(decode('&#x3C;'), '<');
  assert.strictEqual(decode('&#x2014;'), '—');
});

test('decodes uppercase hex prefix', () => {
  assert.strictEqual(decode('&#X41;'), 'A');
});

test('passes through unknown named entities', () => {
  assert.strictEqual(decode('&fakename;'), '&fakename;');
});

test('decodes mixed content', () => {
  assert.strictEqual(
    decode('Hello &amp; &#60;world&#62; &mdash; goodbye'),
    'Hello & <world> — goodbye'
  );
});

test('returns plain text unchanged', () => {
  assert.strictEqual(decode('plain text'), 'plain text');
});

test('returns empty string unchanged', () => {
  assert.strictEqual(decode(''), '');
});

test('handles null/undefined gracefully', () => {
  assert.strictEqual(decode(null), null);
  assert.strictEqual(decode(undefined), undefined);
});

test('decodes Greek letters', () => {
  assert.strictEqual(decode('&alpha;&beta;&gamma;'), '\u03B1\u03B2\u03B3');
  assert.strictEqual(decode('&Alpha;&Omega;'), '\u0391\u03A9');
});

test('decodes math symbols', () => {
  assert.strictEqual(decode('&plusmn;&times;&divide;'), '±×÷');
  assert.strictEqual(decode('&infin;&ne;&le;&ge;'), '∞≠≤≥');
});

test('decodes currency symbols', () => {
  assert.strictEqual(decode('&cent;&pound;&yen;&euro;'), '¢£¥€');
});

test('decodes arrows', () => {
  assert.strictEqual(decode('&larr;&rarr;&uarr;&darr;'), '←→↑↓');
});

test('decodes Latin accented characters', () => {
  assert.strictEqual(decode('caf&eacute;'), 'café');
  assert.strictEqual(decode('na&iuml;ve'), 'naïve');
  assert.strictEqual(decode('&Uuml;ber'), 'Über');
});

test('decodes typographic quotes and dashes', () => {
  assert.strictEqual(decode('&ldquo;hello&rdquo;'), '\u201Chello\u201D');
  assert.strictEqual(decode('&lsquo;hi&rsquo;'), '\u2018hi\u2019');
  assert.strictEqual(decode('&ndash;&mdash;'), '\u2013\u2014');
});

test('handles code block content like formatters.js uses', () => {
  const input = '#include &lt;stdio.h&gt;\nprintf(&quot;hello&quot;);';
  const expected = '#include <stdio.h>\nprintf("hello");';
  assert.strictEqual(decode(input), expected);
});
