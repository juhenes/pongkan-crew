// Optional live check: uses your Codex account for two short read-only turns.
import { runCodex, buildArgs } from '../src/crew.js';
const member = { name: 'connection-check', writable: false };
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000);
try {
  for (const prompt of [
    'Reply with exactly PONGKAN_OK. Do not use tools.',
    'Reply with exactly RESUME_OK. Do not use tools.',
  ]) {
    let reply = '';
    await runCodex(
      buildArgs(process.cwd(), member),
      prompt,
      event => {
        if (event.type === 'thread.started') member.threadId = event.thread_id;
        if (event.type === 'item.completed' && event.item?.type === 'agent_message') reply += event.item.text;
        if (event.type === 'turn.failed' || event.type === 'error')
          throw new Error(event.error?.message || event.message);
      },
      controller.signal,
    );
    const expected = prompt.includes('RESUME_OK') ? 'RESUME_OK' : 'PONGKAN_OK';
    if (!reply.includes(expected) || !member.threadId) throw new Error(`Unexpected response: ${reply}`);
    console.log(`${expected}: passed`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
