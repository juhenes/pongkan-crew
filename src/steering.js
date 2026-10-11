import { randomUUID } from 'node:crypto';
import { TERMINAL } from './tasks.js';

export function steer(crew, id, text) {
  if (!text?.trim() || text.length > 4000) throw new Error('Steering must contain 1–4000 characters.');
  const flow = crew.state.workflows.find(f => f.id === id);
  const target = flow || crew.queue.get(id);
  if (TERMINAL.has(target.status))
    throw new Error('This task or workflow is finished. Start a new task for additional changes.');
  if (!flow && target.discussionId) throw new Error('Use a Crew Chat follow-up after the discussion finishes.');
  target.steering ||= [];
  if (target.steering.length >= 50) throw new Error('Steering limit reached. Start a new task.');
  const entry = { id: randomUUID().slice(0, 8), text: text.trim(), createdAt: Date.now() };
  target.steering.push(entry);
  crew.save();
  crew.notify(`Instruction ${entry.id} queued for ${id} at the next task boundary.`);
  return entry;
}
