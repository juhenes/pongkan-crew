import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { acquireLock, checkRuntime } from '../src/runtime.js';
import { Crew } from '../src/crew.js';
import { execute } from '../src/commands.js';

function setup(t) {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-foundation-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  return folder;
}
test('exclusive folder lock rejects second launch and releases cleanly', t => {
  const folder = setup(t);
  const release = acquireLock(folder);
  assert.throws(() => acquireLock(folder), /already open/);
  release(); release();
  acquireLock(folder)();
});
test('startup diagnostics classify absent Codex and absent login', async () => {
  const missing = await checkRuntime(async () => { throw new Error('ENOENT'); });
  assert.equal(missing.ok, false);
  assert.match(missing.lines.join('\n'), /Codex.*unavailable/);
  const auth = await checkRuntime(async args => {
    if (args[0] === 'login') throw new Error('Not logged in');
    return 'codex-cli 0.162.1';
  });
  assert.equal(auth.ok, false);
  assert.match(auth.lines.join('\n'), /codex login/);
});
test('invalid stored members do not get overwritten', t => {
  const folder = setup(t);
  const crew = new Crew(folder);
  const data = { ...crew.state, members: [crew.member('chief'), crew.member('chief')] };
  writeFileSync(crew.file, JSON.stringify(data));
  const before = readFileSync(crew.file, 'utf8');
  assert.throws(() => new Crew(folder), /Invalid crew state/);
  assert.equal(readFileSync(crew.file, 'utf8'), before);
});
test('remove and clear archive recoverable snapshots across restart', t => {
  const folder = setup(t);
  const crew = new Crew(folder);
  crew.member('chief').threadId = 'original';
  crew.member('chief').messages.push({ role: 'user', text: 'Keep me' });
  crew.save();
  const app = { crew, selected: 'chief', notice: '' };
  execute(app, '/clear');
  assert.equal(crew.member('chief').messages.length, 0);
  execute(app, '/undo');
  assert.equal(crew.member('chief').messages[0].text, 'Keep me');
  execute(app, '/crew remove chief');
  const restored = new Crew(folder);
  execute({ crew: restored, selected: 'developer' }, '/undo');
  assert.equal(restored.member('chief').threadId, 'original');
});

test('undo restores only affected teammate and preserves later messages elsewhere', t => {
  const crew = new Crew(setup(t));
  const app = { crew, selected: 'chief' };
  execute(app, '/crew remove researcher');
  crew.member('developer').messages.push({ role: 'user', text: 'New work after removal' });
  execute(app, '/undo');
  assert.equal(crew.member('developer').messages.at(-1).text, 'New work after removal');
  assert.equal(crew.member('researcher').name, 'researcher');
});

test('invalid task references are rejected without overwriting saved state', t => {
  const crew = new Crew(setup(t));
  crew.state.tasks = [{ id: '12345678', member: 'missing', text: 'work', status: 'queued', createdAt: Date.now(), kind: 'message' }];
  crew.save();
  const before = readFileSync(crew.file, 'utf8');
  assert.throws(() => new Crew(crew.folder), /Invalid crew state/);
  assert.equal(readFileSync(crew.file, 'utf8'), before);
});

test('a second CLI process cannot enter a locked folder', t => {
  const folder = setup(t);
  const release = acquireLock(folder);
  try {
    const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
    const result = spawnSync(process.execPath, [cli, '--folder', folder, '--preview'], { encoding: 'utf8', timeout: 5000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /already open/);
  } finally { release(); }
});

test('undo backups remain explicitly recoverable without blocking earlier undo', t => {
  const crew = new Crew(setup(t));
  const app = { crew, selected: 'chief' };
  crew.member('chief').messages.push({ role: 'user', text: 'Before clear' });
  execute(app, '/clear');
  crew.member('chief').messages.push({ role: 'user', text: 'After clear' });
  execute(app, '/undo');
  assert.equal(crew.member('chief').messages[0].text, 'Before clear');
  const backup = crew.state.archives.at(-1);
  execute(app, `/archives restore ${backup.id} saved-chat`);
  assert.equal(crew.member('saved-chat').messages[0].text, 'After clear');
});

test('restoring a conversation copy does not share a live teammate session', t => {
  const crew = new Crew(setup(t));
  crew.member('chief').threadId = 'existing-thread';
  crew.member('chief').messages.push({ role: 'assistant', text: 'Recovered findings' });
  crew.archive('clear chief');
  crew.restoreArchive(crew.state.archives.at(-1).id, 'recovered');
  assert.equal(crew.member('recovered').threadId, null);
  assert.equal(crew.member('chief').threadId, 'existing-thread');
});
