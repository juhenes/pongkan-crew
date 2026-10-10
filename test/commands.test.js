import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Crew } from '../src/crew.js';
import { execute, HELP } from '../src/commands.js';
import { screen } from '../src/ui.js';

function setup(t) {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-controls-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const crew = new Crew(folder);
  return { crew, selected: 'chief', panel: null, notice: '', scroll: 0, send() {}, quit() {} };
}
test('question mark and help open complete paged help without sending a prompt', t => {
  const app = setup(t);
  app.send = () => assert.fail('help must not call Codex');
  execute(app, '?');
  assert.deepEqual(app.panel.lines, HELP);
  assert.match(screen(app.crew, app.selected, '', '', 100, 25, 0, app.panel), /HELP/);
  execute(app, '/help');
  assert.ok(app.panel.lines.some(line => line.includes('/crew remove')));
});
test('crew controls persist names, roles and permissions and retain an active selection', t => {
  const app = setup(t);
  execute(app, '/crew add designer Improve layouts');
  execute(app, '/crew role designer Design terminal layouts');
  execute(app, '/crew access designer write');
  execute(app, '/crew rename designer artist');
  execute(app, '/chat artist');
  assert.equal(app.selected, 'artist');
  assert.equal(new Crew(app.crew.folder).member('artist').role, 'Design terminal layouts');
  assert.equal(app.crew.member('artist').writable, true);
  execute(app, '/crew remove artist');
  assert.equal(app.selected, 'chief');
  assert.throws(() => app.crew.member('artist'), /Unknown/);
  assert.throws(() => execute(app, '/crew access chief unrestricted'), /read.*write/);
});
test('busy members cannot be removed or reconfigured and last member cannot be removed', t => {
  const app = setup(t);
  app.crew.running.set('chief', new AbortController());
  for (const line of ['/crew remove chief', '/crew rename chief boss', '/crew role chief New role', '/crew access chief write', '/new']) {
    assert.throws(() => execute(app, line), /Stop/);
  }
  app.crew.running.clear();
  for (const name of ['researcher', 'developer']) execute(app, `/crew remove ${name}`);
  assert.throws(() => execute(app, '/crew remove reviewer'), /designated/);
  // Legacy single-member rosters must still keep their last teammate.
  app.crew.state.members = [app.crew.member('chief')];
  app.crew.state.coordination = null;
  assert.throws(() => execute(app, '/crew remove chief'), /last/);
});
test('clear keeps session while new resets it; retry resends last user message', t => {
  const app = setup(t);
  const member = app.crew.member('chief');
  member.threadId = 'saved';
  member.messages.push({ role: 'user', text: 'Original task' });
  app.send = (name, text) => assert.deepEqual([name, text], ['chief', 'Original task']);
  execute(app, '/retry');
  execute(app, '/clear');
  assert.equal(member.threadId, 'saved');
  assert.equal(member.messages.length, 0);
  execute(app, '/new');
  assert.equal(member.threadId, null);
});
test('invalid commands and missing arguments produce usage errors', t => {
  const app = setup(t);
  for (const line of ['/crew', '/crew rename chief', '/crew role chief', '/send', '/task', '/unknown']) {
    assert.throws(() => execute(app, line));
  }
});

test('activity and chat switches preserve selected teammate and do not send prompts', t => {
  const app = setup(t);
  app.selected = 'researcher';
  app.send = () => assert.fail('view switches must not call Codex');
  for (const command of ['/switch activity', '/activity', '/act']) {
    execute(app, command);
    assert.equal(app.view, 'activity');
    assert.equal(app.selected, 'researcher');
    assert.equal(app.panel, null);
  }
  assert.throws(() => execute(app, 'accidental message'), /\/chat/);
  execute(app, '/switch chat');
  assert.equal(app.view, 'chat');
  execute(app, '/activity');
  execute(app, '/chat');
  assert.equal(app.view, 'chat');
  assert.equal(app.selected, 'researcher');
  execute(app, '/switch');
  assert.equal(app.view, 'group');
  execute(app, '/switch');
  assert.equal(app.view, 'activity');
  execute(app, '/switch');
  assert.equal(app.view, 'chat');
  execute(app, '/switch prev');
  assert.equal(app.view, 'activity');
  execute(app, '/chat developer');
  assert.equal(app.selected, 'developer');
  assert.equal(app.view, 'chat');
  assert.throws(() => execute(app, '/switch unknown'), /chat.*activity/);
});

test('help overlays return to activity and its log follows new entries', t => {
  const app = setup(t);
  app.crew.member('chief').messages.push({ role: 'assistant', text: 'PRIVATE_CHAT_CONTENT' });
  app.crew.notify('researcher: Running a command in the selected project');
  execute(app, '/activity');
  execute(app, '/help');
  execute(app, '/close');
  assert.equal(app.view, 'activity');
  const render = () => screen(app.crew, app.selected, '', '', 110, 32, 0, app.panel, { view: app.view });
  assert.match(render(), /\[ ACTIVITY \]/);
  assert.match(render(), /Running a command/);
  assert.doesNotMatch(render(), /PRIVATE_CHAT_CONTENT/);
  app.crew.notify('developer: NEW_LIVE_EVENT');
  assert.match(render(), /NEW_LIVE_EVENT/);
  execute(app, '/chat');
  const chat = render();
  assert.match(chat, /\[ CHAT \]/);
  assert.match(chat, /PRIVATE_CHAT_CONTENT/);
  assert.doesNotMatch(chat, /NEW_LIVE_EVENT/);
});
