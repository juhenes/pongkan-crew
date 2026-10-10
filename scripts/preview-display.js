// Offline sample of the chat layout; does not read/write crew state or call Codex.
import { screen } from '../src/ui.js';

const members = ['chief', 'researcher', 'developer', 'reviewer'].map(name => ({
  name, role: 'Assist with the project.', status: 'ready', writable: name === 'developer', messages: [],
}));
members[1].messages = [
  { role: 'user', text: 'How does Pongkan Crew work with Codex?' },
  { role: 'assistant', text: [
    '## Your Codex workspace', '',
    '**Pongkan Crew brings your Codex teammates into one terminal.** Here is how the pieces fit:', '',
    '| Component | What it offers |', '| --- | --- |',
    '| [Codex](https://learn.chatgpt.com/docs/codex/cli) | Executes tasks in the selected project folder. |',
    '| [Pongkan Crew](README.md) | Organizes conversations, task queues, reviews and team activity. |', '',
    '### Suggested next steps', '',
    '- Select a teammate and describe the work.',
    '- Follow progress in the Activity tab.', '',
    '```text', '/task Review the project structure', '/queue list', '```',
  ].join('\n') },
];
const crew = { folder: process.cwd(), state: { members }, activity: [
  'researcher started', 'researcher: Read README.md and locate project documentation',
  'researcher: web_search', 'researcher finished', 'Task a12bc345: completed',
], member: name => members.find(m => m.name === name) };
if (process.argv.includes('--activity')) {
  Object.assign(crew.member('researcher'), { status: 'working', progress: { startedAt: Date.now() - 14000,
    phase: 'command', action: 'Running command: node --test' } });
  crew.activityEvents = [
    { at: Date.now() - 20000, text: 'researcher: Running command: node --test', kind: 'command' },
    { at: Date.now() - 16000, text: 'researcher: Command finished (exit 0) · 4.0s', kind: 'command', detail: 'Tests: 12 passed, 0 failed' },
    { at: Date.now() - 15000, text: 'developer: File changes reported', kind: 'edit', detail: 'update: src/ui.js\nadd: test/activity.test.js' },
    { at: Date.now() - 10000, text: 'researcher: Searching: project documentation', kind: 'search' },
  ];
}
console.log(screen(crew, 'researcher', '', 'Display preview — no agents running', process.stdout.columns || 110,
  process.stdout.rows || 44, 0, null, { color: !!process.stdout.isTTY && !('NO_COLOR' in process.env),
    view: process.argv.includes('--activity') ? 'activity' : 'chat' }));
