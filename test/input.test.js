import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutInput } from '../src/input.js';
import { cellWidth } from '../src/markdown.js';
import { screen } from '../src/ui.js';

test('long prompts wrap and the input viewport follows the cursor instead of truncating to one line', () => {
  const text = '/discuss ' + 'Build a local todo website. '.repeat(20);
  const end = layoutInput(text, Array.from(text).length, 'chief', 60, 4);
  assert.equal(end.lines.length, 4);
  assert.ok(end.hiddenBefore > 0);
  assert.ok(end.lines.every(line => cellWidth(line) < 60));
  assert.ok(end.cursorRow >= 0 && end.cursorRow < 4);
  const start = layoutInput(text, 0, 'chief', 60, 4);
  assert.equal(start.hiddenBefore, 0);
  assert.match(start.lines[0], /chief> \/discuss/);
  assert.equal(start.cursorColumn, 7);
});
test('input wrapping keeps unicode graphemes together and leaves room for the caret at exact boundaries', () => {
  const text = '界🙂e\u0301'.repeat(30);
  const layout = layoutInput(text, Array.from(text).length, 'developer', 40, 5);
  assert.ok(layout.lines.every(line => cellWidth(line) < 40));
  assert.ok(layout.cursorColumn < 40);
  const exact = layoutInput('x'.repeat(12), 12, 'chief', 20, 5);
  assert.equal(exact.cursorRow, 1);
  assert.equal(exact.cursorColumn, 7);
});
test('moving vertically never puts the caret inside a combining grapheme', () => {
  const text = 'e\u0301'.repeat(12);
  const layout = layoutInput(text, 24, 'chief', 20, 5);
  const fromEnd = layoutInput(text, 22, 'chief', 20, 5);
  assert.equal(fromEnd.down, 24);
  const fromMiddle = layoutInput(text, 8, 'chief', 20, 5);
  assert.equal(fromMiddle.down, 24);
  assert.equal(layout.up % 2, 0);
  const mixed = 'x'.repeat(10) + 'e\u0301🙂' + 'x'.repeat(10);
  assert.equal(layoutInput(mixed, Array.from(mixed).length - 1, 'chief', 20, 5).up, 10);
});
test('wrapped composer fits without pushing the footer out of the screen', () => {
  const member = { name: 'chief', role: 'Lead', status: 'ready', messages: [] };
  const crew = { member: () => member, state: { members: [member] }, folder: '.', activity: [] };
  const render = input => screen(crew, 'chief', input, '', 70, 30);
  const long = render('/discuss ' + 'todo website '.repeat(40));
  assert.equal(long.split('\n').length, render('').split('\n').length);
  assert.match(long, /Input .*Up\/Down/);
  assert.ok(long.split('\n').every(line => cellWidth(line) <= 69));
});

test('activity and crew views do not read the hidden direct transcript', () => {
  const member = { name: 'chief', role: 'Lead', status: 'ready',
    get messages() { throw new Error('Hidden transcript was rendered'); } };
  const crew = { member: () => member, state: { members: [member] }, folder: '.', activity: [] };
  assert.match(screen(crew, 'chief', '', '', 80, 30, 0, null, { view: 'activity' }), /No team activity/);
  assert.match(screen(crew, 'chief', '', '', 80, 30, 0, null, { view: 'group' }), /Start a crew discussion/);
});
