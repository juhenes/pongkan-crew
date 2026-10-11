import test from 'node:test';
import assert from 'node:assert/strict';
import { answerShortcut } from '../src/answer-shortcut.js';

const makeApp = () => ({ selected: 'developer', crew: { state: { tasks: [
  { id: 'a', member: 'chief', status: 'waiting', question: 'Scope?' },
  { id: 'b', member: 'developer', status: 'waiting', question: 'Layout?' },
  { id: 'c', member: 'developer', status: 'completed' },
] } } });

test('shortcut prefers selected teammate, preserves draft, and cycles waiting questions', () => {
  const app = makeApp();
  const input = answerShortcut(app, 'Use a list');
  assert.equal(input, '/answer b Use a list');
  assert.match(JSON.stringify(app.panel), /Layout\?/);
  assert.equal(answerShortcut(app, input), '/answer a Use a list');
  assert.equal(answerShortcut(app, '/answer a '), '/answer b ');
});

test('shortcut without waiting questions preserves input and reports why', () => {
  const app = makeApp();
  app.crew.state.tasks = [];
  assert.equal(answerShortcut(app, 'draft'), 'draft');
  assert.match(app.notice, /No questions/);
});
