import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Crew } from '../src/crew.js';
import { execute } from '../src/commands.js';

test('context optimization preserves user requirements, all sources, and reply boundaries without mutating history', async () => {
  const { optimizeContext } = await import('../src/context.js');
  const records = [
    { label: 'you', text: 'Do not delete files. '.repeat(300), preserve: true },
    { label: 'developer task 12345678', text: 'START '.repeat(1000) + ' END'.repeat(1000) },
    { label: 'reviewer task 87654321', text: 'Verification failed: '.repeat(1000) },
  ];
  const before = JSON.stringify(records);
  const result = optimizeContext(records, { budget: 1000 });
  assert.ok(result.text.includes(records[0].text));
  assert.match(result.text, /developer task 12345678/);
  assert.match(result.text, /reviewer task 87654321/);
  assert.match(result.text, /START/); assert.match(result.text, /END/);
  assert.match(result.text, /omitted/);
  assert.ok(result.stats.after < result.stats.before);
  assert.equal(JSON.stringify(records), before);
});
test('context mode persists and prompt statistics describe real injected text', async t => {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-context-'));
  let prompt;
  const crew = new Crew(folder, { runner: async (args, text) => { prompt = text; } });
  t.after(async () => { await crew.close(); rmSync(folder, { recursive: true, force: true }); });
  const app = { crew, selected: 'chief' };
  execute(app, '/context on');
  assert.equal(new Crew(folder).state.contextOptimization, true);
  crew.member('chief').messages.push({ role: 'user', text: 'Keep all acceptance criteria.' }, { role: 'assistant', text: 'begin '.repeat(10000) + 'end' });
  await crew.send('chief', 'Continue');
  assert.match(prompt, /Keep all acceptance criteria/);
  assert.match(prompt, /omitted/);
  execute(app, '/context');
  assert.match(app.panel.getLines().join('\n'), /Recovered conversation/);
  assert.throws(() => execute(app, '/context bogus'), /Use \/context/);
  execute(app, '/context off');
  assert.equal(new Crew(folder).state.contextOptimization, false);
});

test('workflow optimization retains full saved results and sends task requirements with read-only review', async t => {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-context-flow-'));
  const calls = [];
  const longResult = 'Research start\n' + 'Evidence '.repeat(10000) + '\nResearch end';
  const crew = new Crew(folder, { runner: async (args, prompt, event) => {
    calls.push({ args, prompt });
    const text = prompt.includes('PONGKAN_PLAN') ? JSON.stringify({ steps: [{ member: 'researcher', task: 'Investigate' }, { member: 'developer', task: 'Implement without deleting files' }], reviewer: 'reviewer' }) : prompt.startsWith('You are researcher') ? longResult : 'Checked';
    event({ type: 'item.completed', item: { type: 'agent_message', text } });
  } });
  t.after(async () => { await crew.close(); rmSync(folder, { recursive: true, force: true }); });
  execute({ crew }, '/context on');
  const flow = crew.workflows.start('Investigate and implement without deleting files');
  await crew.workflows.settled(flow.id);
  assert.equal(flow.status, 'completed');
  const work = calls.find(call => call.prompt.startsWith('You are developer'));
  assert.match(work.prompt, /Implement without deleting files/);
  assert.match(work.prompt, /Research start/); assert.match(work.prompt, /Research end/);
  assert.match(work.prompt, /omitted/);
  assert.match(work.prompt, /Do not modify .pongkan-crew/);
  assert.ok(calls.find(call => call.prompt.startsWith('You are reviewer')).args.includes('read-only'));
  assert.equal(crew.state.tasks.find(task => task.member === 'researcher').result, longResult);
  assert.ok(crew.state.contextStats['Workflow handoffs'].after < crew.state.contextStats['Workflow handoffs'].before);
});

test('discussion optimization preserves long user topics and never changes the saved chat', async t => {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-context-discuss-'));
  const crew = new Crew(folder, { runner: async () => {} });
  t.after(async () => { await crew.close(); rmSync(folder, { recursive: true, force: true }); });
  execute({ crew }, '/context on'); crew.queue.pause();
  const topic = 'Do not publish. '.repeat(4000);
  const discussion = crew.discussions.start(topic, 'researcher');
  discussion.messages.push({ role: 'assistant', speaker: 'researcher', text: 'Long evidence '.repeat(5000) });
  const before = JSON.stringify(discussion.messages);
  const prompt = crew.discussions.context(crew.queue.get(discussion.taskIds[0]));
  assert.ok(prompt.includes(topic)); assert.match(prompt, /omitted/);
  assert.match(prompt, /Discuss only. Do not edit files/);
  assert.equal(JSON.stringify(discussion.messages), before);
});
