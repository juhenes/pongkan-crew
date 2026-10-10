import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Crew, buildArgs } from '../src/crew.js';
import { execute } from '../src/commands.js';
import { readModelCatalog, validateModelChoice } from '../src/models.js';
import { screen } from '../src/ui.js';

function setup(t) {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-models-'));
  const crew = new Crew(folder, { runner: async () => {} });
  t.after(async () => { await crew.close(); rmSync(folder, { recursive: true, force: true }); });
  return { crew, selected: 'developer', notice: '', panel: null };
}

test('model choices persist per teammate and are passed to fresh and resumed Codex turns', t => {
  const app = setup(t);
  execute(app, '/model set developer test-model high');
  const member = app.crew.member('developer');
  assert.equal(member.model, 'test-model');
  assert.equal(member.reasoningEffort, 'high');
  assert.match(screen(app.crew, 'developer', '', '', 140, 40), /Model: test-model/);
  assert.equal(new Crew(app.crew.folder).member('developer').model, 'test-model');
  for (const threadId of [null, 'existing-session']) {
    const args = buildArgs(app.crew.folder, { ...member, threadId });
    assert.equal(args[args.indexOf('--model') + 1], 'test-model');
    assert.ok(args.includes('model_reasoning_effort="high"'));
    if (threadId) assert.ok(args.includes(threadId));
  }
  execute(app, '/status');
  assert.match(app.panel.getLines().join('\n'), /developer:.*test-model.*high/);
  execute(app, '/model reset developer');
  assert.equal(member.model, undefined);
  assert.ok(!buildArgs(app.crew.folder, member).includes('--model'));
});

test('model changes are atomic for all members and reject changes during queued or active work', t => {
  const app = setup(t);
  app.crew.queue.pause();
  const task = app.crew.queue.enqueue('reviewer', 'Review');
  assert.throws(() => execute(app, '/model set all test-model medium'), /queued/i);
  assert.ok(app.crew.state.members.every(member => !member.model));
  app.crew.queue.cancel(task.id);
  execute(app, '/model set all test-model medium');
  assert.ok(app.crew.state.members.every(member => member.model === 'test-model'));
  app.crew.running.set('developer', new AbortController());
  assert.throws(() => execute(app, '/model reset developer'), /Stop/);
  app.crew.running.delete('developer');
  assert.throws(() => execute(app, '/model set developer --bad high'), /model/i);
  assert.throws(() => execute(app, '/model set developer test-model bogus'), /effort/i);
});

test('model catalog uses installed Codex cache and handles missing or invalid cache', t => {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-catalog-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  assert.deepEqual(readModelCatalog(folder), []);
  writeFileSync(join(folder, 'models_cache.json'), JSON.stringify({ models: [
    { slug: 'test-model', display_name: 'Test', visibility: 'list', supported_reasoning_levels: [{ effort: 'high' }] },
    { slug: 'hidden-model', visibility: 'hide' },
  ] }));
  assert.deepEqual(readModelCatalog(folder), [{ id: 'test-model', name: 'Test', efforts: ['high'] }]);
  assert.throws(() => validateModelChoice('test-model', 'low', readModelCatalog(folder)), /supports/);
  writeFileSync(join(folder, 'models_cache.json'), '{broken');
  assert.deepEqual(readModelCatalog(folder), []);
});

test('requested model and effort are captured for the running turn', async t => {
  const app = setup(t);
  execute(app, '/model set developer test-model high');
  let release;
  app.crew.runner = async args => {
    assert.ok(args.includes('test-model'));
    await new Promise(resolve => { release = resolve; });
  };
  const task = app.crew.queue.enqueue('developer', 'Build');
  assert.equal(app.crew.member('developer').progress.model, 'test-model');
  execute(app, '/progress developer');
  assert.match(app.panel.getLines().join('\n'), /test-model/);
  release();
  await app.crew.queue.settled(task.id);
});

test('Crew Chat and workflow planning use each assigned teammate model', async t => {
  const app = setup(t);
  execute(app, '/model set all test-model high');
  const calls = [];
  app.crew.runner = async (args, prompt, event) => {
    calls.push(args);
    event({ type: 'thread.started', thread_id: 'model-test-session' });
    event({ type: 'item.completed', item: { type: 'agent_message', text: prompt.includes('PONGKAN_PLAN') ?
      JSON.stringify({ steps: [{ member: 'developer', task: 'Build feature' }], reviewer: 'reviewer' }) : 'Result' } });
  };
  const discussion = app.crew.discussions.start('Discuss models', 'developer');
  await app.crew.queue.settled(discussion.taskIds.at(-1));
  const flow = app.crew.workflows.start('Build feature');
  await app.crew.workflows.settled(flow.id);
  assert.equal(flow.status, 'completed');
  assert.ok(calls.length >= 5);
  assert.ok(calls.every(args => args.includes('test-model') && args.includes('model_reasoning_effort="high"')));
});
