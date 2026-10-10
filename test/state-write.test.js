import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replaceStateFile } from '../src/state-write.js';

test('Windows atomic replacement retries transient rename errors without deleting the old file', () => {
  let attempts = 0;
  const waits = [];
  replaceStateFile('state.tmp', 'state.json', { platform: 'win32', pause: ms => waits.push(ms), rename: (source, target) => {
    assert.equal(source, 'state.tmp'); assert.equal(target, 'state.json');
    if (++attempts < 3) throw Object.assign(new Error('busy'), { code: 'EPERM' });
  } });
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [10, 20]);
});
test('persistent permission failures remain errors and retry time is bounded', () => {
  let attempts = 0, waited = 0;
  assert.throws(() => replaceStateFile('source', 'target', { platform: 'win32', pause: ms => { waited += ms; },
    rename: () => { attempts++; throw Object.assign(new Error('denied'), { code: 'EACCES' }); } }), /denied/);
  assert.equal(attempts, 6);
  assert.equal(waited, 310);
});
test('unrelated filesystem errors are reported immediately', () => {
  assert.throws(() => replaceStateFile('source', 'target', { platform: 'win32', pause: () => assert.fail('must not wait'),
    rename: () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); } }), /missing/);
});
