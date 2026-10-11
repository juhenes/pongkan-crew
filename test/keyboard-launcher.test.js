import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { emitKeypressEvents } from 'node:readline';
import { terminalInput } from '../src/scroll.js';

test('wheel reports scroll separately while arrow keys reach prompt navigation', () => {
  const keyboard = new PassThrough();
  keyboard.setEncoding('utf8');
  emitKeypressEvents(keyboard);
  const keys = [],
    scrolls = [];
  keyboard.on('keypress', (text, key) => keys.push(key.name));
  terminalInput(
    text => keyboard.write(text),
    amount => scrolls.push(amount),
  )('\x1b[A\x1b[<64;12;8M\x1b[Bx');
  assert.deepEqual(keys, ['up', 'down', 'x']);
  assert.deepEqual(scrolls, [3]);
  keyboard.destroy();
});
