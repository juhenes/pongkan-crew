import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { captureWorkspace, compareWorkspace, gitDiff } from '../src/diff.js';
import { completions, helpSearch } from '../src/controls.js';
import { Crew } from '../src/crew.js';
import { screen, activityLabel, clean } from '../src/ui.js';
import { cellWidth } from '../src/markdown.js';

function folder(t) {
  const path = mkdtempSync(join(tmpdir(), 'pongkan-views-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}
test('folder snapshots show text additions, deletions and modifications without Git', t => {
  const path = folder(t);
  writeFileSync(join(path, 'hello.txt'), 'before\n');
  writeFileSync(join(path, 'removed.txt'), 'remove me\n');
  const before = captureWorkspace(path);
  writeFileSync(join(path, 'hello.txt'), 'after\n');
  rmSync(join(path, 'removed.txt'));
  writeFileSync(join(path, 'added.txt'), 'new\n');
  const result = compareWorkspace(before, captureWorkspace(path));
  assert.match(result.text, /-before\n\+after/);
  assert.match(result.text, /added.txt/);
  assert.match(result.text, /removed.txt/);
  assert.equal(result.files.length, 3);
});
test('snapshots exclude application state, dependencies and binary files', t => {
  const path = folder(t);
  mkdirSync(join(path, '.pongkan-crew'));
  writeFileSync(join(path, '.pongkan-crew/state.json'), 'private');
  writeFileSync(join(path, 'image.png'), Buffer.from([0, 1, 2]));
  assert.equal(Object.keys(captureWorkspace(path).files).length, 0);
});
test('Git diff includes staged, unstaged and untracked files with spaces', async t => {
  const path = folder(t);
  execFileSync('git', ['init', path], { windowsHide: true });
  writeFileSync(join(path, 'tracked.txt'), 'old\n');
  execFileSync('git', ['-C', path, 'add', 'tracked.txt']);
  execFileSync('git', ['-C', path, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'initial'], { windowsHide: true });
  writeFileSync(join(path, 'tracked.txt'), 'staged\n');
  execFileSync('git', ['-C', path, 'add', 'tracked.txt']);
  writeFileSync(join(path, 'tracked.txt'), 'working\n');
  writeFileSync(join(path, 'new file.txt'), 'untracked\n');
  const diff = await gitDiff(path);
  assert.match(diff, /-old/);
  assert.match(diff, /\+working/);
  assert.match(diff, /new file.txt/);
  assert.match(diff, /\+untracked/);
});
test('completion resolves commands and teammate arguments; help search filters all commands', () => {
  assert.deepEqual(completions('/crew rem', ['chief', 'developer']), ['/crew remove']);
  assert.deepEqual(completions('/chat de', ['chief', 'developer']), ['/chat developer']);
  assert.ok(helpSearch('undo').some(line => line.includes('/undo')));
  assert.deepEqual(helpSearch('no-such-command'), ['No help matches. Try another search.']);
});
test('sidebar keeps selected teammate visible in a small terminal with a large crew', t => {
  const crew = new Crew(folder(t));
  for (let i = 0; i < 15; i++) crew.add(`agent-${i}`, 'Assist');
  const output = screen(crew, 'agent-14', '', '', 100, 24);
  assert.match(output, /> Agent-14/);
});

test('working conversations show animated activity and remove it when finished', t => {
  const crew = new Crew(folder(t));
  const member = crew.member('chief');
  member.status = 'working';
  member.progress = { phase: 'thinking', startedAt: 1000, action: 'Thinking', files: [] };
  assert.match(activityLabel(member, 2000), /Thinking\.\.\./);
  assert.notEqual(activityLabel(member, 2000), activityLabel(member, 3000));
  assert.match(screen(crew, 'chief', '', ''), /Thinking\.\.\./);
  member.progress.phase = 'command';
  assert.match(activityLabel(member), /Running command/);
  member.status = 'ready';
  assert.doesNotMatch(screen(crew, 'chief', '', ''), /Thinking\.\.\.|Running command\.\.\./);
});

test('chat renders readable Markdown at different terminal widths and safely adds color', t => {
  const crew = new Crew(folder(t));
  crew.member('researcher').messages.push({ role: 'assistant', text:
    '## Tools\n\n**Readable comparison**\n\n| Tool | Purpose |\n| --- | --- |\n| [Example](https://example.com) | A terminal interface for managing a crew of agents. |' });
  for (const width of [45, 80, 140]) {
    const plain = screen(crew, 'researcher', '', '', width, 50);
    assert.doesNotMatch(plain, /\*\*|\]\(https|\| ---/);
    assert.match(plain, /Example \[1\]/);
    assert.ok(plain.split('\n').every(line => cellWidth(line) <= width - 1));
    const colored = screen(crew, 'researcher', '', '', width, 50, 0, null, { color: true });
    assert.match(colored, /\x1b\[/);
    assert.equal(clean(colored), plain);
  }
});
