import test from 'node:test';
import assert from 'node:assert/strict';
import { cycle } from '../src/commands.js';

test('teammate navigation includes Crew Chat in both directions and preserves selection there', () => {
  const app = {
    crew: { state: { members: [{ name: 'chief' }, { name: 'developer' }] } },
    selected: 'chief',
    view: 'chat',
  };
  cycle(app, 1);
  assert.equal(app.selected, 'developer');
  cycle(app, 1);
  assert.equal(app.view, 'group');
  assert.equal(app.selected, 'developer');
  cycle(app, 1);
  assert.equal(app.view, 'chat');
  assert.equal(app.selected, 'chief');
  cycle(app, -1);
  assert.equal(app.view, 'group');
  cycle(app, -1);
  assert.equal(app.view, 'chat');
  assert.equal(app.selected, 'developer');
});
