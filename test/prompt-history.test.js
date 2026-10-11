import test from 'node:test';
import assert from 'node:assert/strict';
import { PromptHistory } from '../src/input.js';

test('prompt navigation previews submissions and restores the new draft', () => {
  const history = new PromptHistory();
  history.add('first');
  history.add('second');
  assert.equal(history.move(-1, 'unfinished draft'), 'second');
  assert.equal(history.move(-1, 'second'), 'first');
  assert.equal(history.move(-1, 'first'), 'first');
  assert.equal(history.move(1, 'first'), 'second');
  assert.equal(history.move(1, 'second'), 'unfinished draft');
  assert.equal(history.move(1, 'edited draft'), 'edited draft');
});

test('empty history preserves input and submitting a preview resets navigation', () => {
  const history = new PromptHistory();
  assert.equal(history.move(-1, 'new prompt'), 'new prompt');
  history.add('first');
  history.move(-1, 'draft');
  history.add('new submission');
  assert.equal(history.move(-1, ''), 'new submission');
  assert.equal(history.move(1, 'new submission'), '');
});
