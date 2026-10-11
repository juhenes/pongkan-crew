import test from 'node:test';
import assert from 'node:assert/strict';
import { TerminalRenderer, scheduleRender } from '../src/terminal-renderer.js';

test('bursts render the latest state once, and shutdown cancels pending frames', () => {
  let callback,
    scheduled = 0,
    draws = 0,
    state = '',
    shown;
  const request = scheduleRender(
    () => {
      draws++;
      shown = state;
    },
    {
      schedule: fn => {
        scheduled++;
        callback = fn;
        return scheduled;
      },
      cancel: () => {
        callback = null;
      },
    },
  );
  for (let i = 0; i < 1000; i++) {
    state = `prompt ${i}`;
    request();
  }
  assert.equal(scheduled, 1);
  callback();
  assert.equal(draws, 1);
  assert.equal(shown, 'prompt 999');
  request();
  request.cancel();
  assert.equal(callback, null);
});

test('typing repaints only changed rows and identical frames produce no output', t => {
  const writes = [];
  const renderer = new TerminalRenderer({
    write: text => {
      writes.push(text);
      return true;
    },
  });
  const lines = Array.from({ length: 30 }, (_, i) => `row ${i} ${'x'.repeat(80)}`);
  renderer.draw(lines.join('\n'), 28, 4, '100x30');
  const first = writes[0].length;
  lines[27] = 'chief> hello';
  renderer.draw(lines.join('\n'), 28, 13, '100x30');
  assert.ok(writes[1].length < first / 10);
  t.diagnostic(`30-row screen: initial ${first} bytes; typing update ${writes[1].length} bytes`);
  assert.ok(!writes[1].includes('\x1b[2J'));
  renderer.draw(lines.join('\n'), 28, 13, '100x30');
  assert.equal(writes.length, 2);
  renderer.draw(lines.join('\n'), 28, 13, '90x30');
  assert.ok(writes[2].includes('\x1b[2J'));
});

test('shorter frames clear old rows and cursor-only movement does not repaint text', () => {
  const writes = [];
  const renderer = new TerminalRenderer({
    write: text => {
      writes.push(text);
      return true;
    },
  });
  renderer.draw('first\nsecond\nthird', 1, 1, '80x24');
  renderer.draw('first', 1, 1, '80x24');
  assert.ok(writes[1].includes('\x1b[3;1H\x1b[2K'));
  renderer.draw('first', 1, 2, '80x24');
  assert.ok(!writes[2].includes('first'));
  assert.ok(writes[2].includes('\x1b[1;2H'));
});
