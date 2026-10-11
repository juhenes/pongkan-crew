import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync, readFileSync, linkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Crew } from '../src/crew.js';
import { acquireLock } from '../src/runtime.js';
import { execute, HELP } from '../src/commands.js';

function setup(t) {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-security-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  return folder;
}
test('custom preset creation, title and deletion persist without changing the active crew', t => {
  const crew = new Crew(setup(t));
  const app = { crew, selected: 'chief' };
  execute(app, '/crew add designer Accessibility and keyboard navigation');
  execute(app, '/preset create studio chief reviewer');
  execute(app, '/preset title studio Accessible design studio');
  assert.equal(new Crew(crew.folder).presets.get('studio').title, 'Accessible design studio');
  assert.throws(() => execute(app, '/preset create studio'), /already exists/);
  crew.presets.apply('studio');
  execute(app, '/preset delete studio');
  assert.equal(crew.member('designer').role, 'Accessibility and keyboard navigation');
  assert.equal(crew.state.activePreset, null);
  assert.throws(() => new Crew(crew.folder).presets.get('studio'), /Unknown/);
  assert.throws(() => execute(app, '/preset delete default'), /built-in/);
});
test('description assistance is queued read-only and does not automatically change roles', t => {
  const crew = new Crew(setup(t));
  crew.queue.pause();
  const role = crew.member('developer').role;
  execute({ crew, selected: 'developer' }, '/preset improve developer Focus on accessible interfaces');
  const task = crew.state.tasks.at(-1);
  assert.equal(task.member, 'developer');
  assert.equal(task.readOnly, true);
  assert.match(task.text, /accessible interfaces/);
  assert.equal(crew.member('developer').role, role);
});
test('state directories cannot redirect writes or locks through junctions', t => {
  const folder = setup(t),
    outside = setup(t);
  symlinkSync(outside, join(folder, '.pongkan-crew'), 'junction');
  assert.throws(() => new Crew(folder), /Unsafe/);
  assert.throws(() => acquireLock(folder), /Unsafe/);
});
test('state writes reject hardlinked destinations without modifying external data', t => {
  const folder = setup(t),
    outside = setup(t),
    crew = new Crew(folder);
  const external = join(outside, 'important.json');
  writeFileSync(external, readFileSync(crew.file));
  rmSync(crew.file);
  linkSync(external, crew.file);
  assert.throws(() => crew.save(), /Unsafe/);
  assert.equal(readFileSync(external, 'utf8'), JSON.stringify(crew.state, null, 2));
});
test('help includes concrete model examples for all and named teammates', () => {
  assert.match(HELP.join('\n'), /\/model set all gpt-/);
  assert.match(HELP.join('\n'), /\/model set developer gpt-/);
});

test('retrying description assistance preserves read-only access', t => {
  const crew = new Crew(setup(t));
  crew.queue.pause();
  const task = crew.queue.enqueue('developer', 'Suggest instructions', { readOnly: true });
  task.status = 'completed';
  assert.equal(crew.queue.retry(task.id).readOnly, true);
});

test('writer snapshots omit common credential files', async t => {
  const { captureWorkspace } = await import('../src/diff.js');
  const folder = setup(t);
  writeFileSync(join(folder, '.env'), 'SECRET=private');
  writeFileSync(join(folder, '.env.local'), 'TOKEN=private');
  writeFileSync(join(folder, 'server.key'), 'private key');
  writeFileSync(join(folder, 'app.js'), 'public source');
  const snapshot = captureWorkspace(folder);
  assert.deepEqual(Object.keys(snapshot.files), ['app.js']);
});
