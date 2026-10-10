import test from 'node:test';
import assert from 'node:assert/strict';
import { terminalInput, scrollView } from '../src/scroll.js';

test('left mouse clicks reach navigation without entering prompt text', () => {
  const clicks = [];
  let text = '';
  terminalInput(chunk => { text += chunk; }, () => {}, (x, y) => clicks.push([x, y]))('\x1b[<0;4;7M\x1b[<0;4;7m');
  assert.deepEqual(clicks, [[4, 7]]);
  assert.equal(text, '');
});

test('wheel scrolls a working chat without switching teammates or entering escape text', () => {
  const app = { view: 'chat', selected: 'developer', scroll: 0, crew: { running: new Set(['developer']) } };
  let text = '';
  const consume = terminalInput(chunk => { text += chunk; }, delta => scrollView(app, delta));
  consume('\x1b[<64;12;8M');
  assert.equal(app.scroll, 3);
  assert.equal(app.selected, 'developer');
  assert.equal(text, '');
  consume('\x1b[<65;12;8Mhello');
  assert.equal(app.scroll, 0);
  assert.equal(text, 'hello');
});

test('split mouse reports and clicks never enter the composer', () => {
  let text = '', delta = 0;
  const consume = terminalInput(chunk => { text += chunk; }, amount => { delta += amount; });
  consume('\x1b[<6'); consume('4;1;1M\x1b[<0;1;1M\x1b[<0;1;1m');
  assert.equal(delta, 3);
  assert.equal(text, '');
  consume('\x1b[A');
  assert.equal(text, '\x1b[A');
});

test('scroll direction follows chat, activity and panel conventions', () => {
  const app = { view: 'chat', scroll: 0, activityScroll: 0 };
  scrollView(app, 1); assert.equal(app.scroll, 1);
  app.view = 'activity'; scrollView(app, 3); assert.equal(app.activityScroll, 3);
  app.panel = { offset: 5 }; scrollView(app, 3); assert.equal(app.panel.offset, 2);
  scrollView(app, -10); assert.equal(app.panel.offset, 12);
});
