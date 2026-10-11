import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapText } from '../src/markdown.js';

test('ordinary transcript wrapping stays within an interactive rendering budget', () => {
  const text = 'ordinary terminal text '.repeat(1000);
  const start = performance.now();
  for (let i = 0; i < 20; i++) {
    const lines = wrapText(text, 80);
    assert.ok(lines.every(line => line.length <= 80));
    assert.equal(lines.join(' '), text.trim());
  }
  assert.ok(performance.now() - start < 1000, '20 wraps should take less than one second');
});
