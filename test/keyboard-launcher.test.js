import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('CLI reads keyboard directly without a Windows mouse helper', () => {
  const source = readFileSync(new URL('../src/cli.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /startWindowsInput|enableWindowsMouse|MOUSE_ON/);
  assert.match(source, /emitKeypressEvents\(process\.stdin\)/);
  assert.match(source, /process\.stdin\.on\('keypress'/);
});
