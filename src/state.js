import { MAX_TEAM } from './roles.js';
import { MODEL_ID, EFFORTS } from './models.js';
const NAME = /^[a-z][a-z0-9-]{0,31}$/;
const ID = /^[a-f0-9]{8}$/;
const TASK_STATUS = new Set(['queued', 'running', 'waiting', 'completed', 'failed', 'cancelled', 'interrupted']);
const FLOW_STATUS = new Set(['planning', 'working', 'reviewing', 'summarizing', 'completed', 'failed', 'cancelled', 'interrupted']);
function membersValid(members) {
  return Array.isArray(members) && members.length > 0 && new Set(members.map(m => m?.name)).size === members.length &&
    members.every(m => m && NAME.test(m.name) && typeof m.role === 'string' && typeof m.writable === 'boolean' &&
      (m.model === undefined || (typeof m.model === 'string' && MODEL_ID.test(m.model))) &&
      (m.reasoningEffort === undefined || EFFORTS.has(m.reasoningEffort)) &&
      (m.threadId === null || typeof m.threadId === 'string') && Array.isArray(m.messages) &&
      m.messages.every(msg => msg && ['user', 'assistant', 'system'].includes(msg.role) && typeof msg.text === 'string'));
}
export function validateState(state) {
  const invalid = () => { throw new Error('Invalid crew state. Back up .pongkan-crew/state.json before repairing it.'); };
  if (!state || state.version !== 1 || !membersValid(state.members)) invalid();
  if (state.questionsEnabled === undefined) state.questionsEnabled = true;
  if (typeof state.questionsEnabled !== 'boolean') invalid();
  for (const field of ['archives', 'tasks', 'workflows', 'discussions', 'presets']) {
    if (state[field] === undefined) state[field] = [];
    if (!Array.isArray(state[field])) invalid();
  }
  const coordinationValid = (config, members) => config && typeof config === 'object' && config.lead !== config.reviewer &&
    members.some(m => m.name === config.lead) && members.some(m => m.name === config.reviewer && !m.writable);
  if (state.coordination != null && !coordinationValid(state.coordination, state.members)) invalid();
  if (state.activePreset != null && (typeof state.activePreset !== 'string' || !NAME.test(state.activePreset))) invalid();
  if (new Set(state.presets.map(p => p?.name)).size !== state.presets.length || state.presets.some(p => !p || !NAME.test(p.name) ||
      ['default', 'web', 'mobile', 'social', 'content'].includes(p.name) || typeof p.title !== 'string' || !Array.isArray(p.members) || p.members.length < 2 || p.members.length > MAX_TEAM ||
      new Set(p.members.map(m => m?.name)).size !== p.members.length || p.members.some(m => !m || !NAME.test(m.name) || typeof m.role !== 'string' || typeof m.writable !== 'boolean') ||
      !coordinationValid(p, p.members))) invalid();
  if (state.archives.some(a => a?.kind === 'preset' && a.coordination != null && !coordinationValid(a.coordination, a.members || []))) invalid();
  if (state.discussions.some(d => !d || !ID.test(d.id) || !['working', 'completed', 'failed', 'cancelled', 'interrupted'].includes(d.status) ||
      !Array.isArray(d.taskIds) || !Array.isArray(d.messages) || d.messages.some(m => !m || typeof m.text !== 'string' || typeof m.speaker !== 'string' || !['user', 'assistant'].includes(m.role)))) invalid();
  if (state.discussions.some(d => d.sessions !== undefined && (!d.sessions || typeof d.sessions !== 'object' || Array.isArray(d.sessions) ||
      Object.entries(d.sessions).some(([name, session]) => !NAME.test(name) || !session || typeof session !== 'object' ||
        !(session.threadId === null || typeof session.threadId === 'string'))))) invalid();
  if (state.archives.some(a => !a || !ID.test(a.id) || typeof a.reason !== 'string' || !membersValid(a.members))) invalid();
  if (new Set(state.tasks.map(t => t?.id)).size !== state.tasks.length || new Set(state.workflows.map(f => f?.id)).size !== state.workflows.length) invalid();
  for (const flow of state.workflows) {
    if (!flow || !ID.test(flow.id) || typeof flow.text !== 'string' || !FLOW_STATUS.has(flow.status) || !Number.isFinite(flow.createdAt)) invalid();
  }
  const ids = new Set(state.tasks.map(t => t?.id));
  const flows = new Set(state.workflows.map(f => f.id));
  const discussions = new Set(state.discussions.map(d => d.id));
  if (discussions.size !== state.discussions.length || state.discussions.some(d => d.taskIds.some(id => !ids.has(id)))) invalid();
  for (const task of state.tasks) {
    if (!task || !ID.test(task.id) || !NAME.test(task.member) || typeof task.text !== 'string' || !TASK_STATUS.has(task.status) ||
        !Number.isFinite(task.createdAt) || !['message', 'plan', 'work', 'review', 'summary'].includes(task.kind) ||
        (task.discussionId && (!discussions.has(task.discussionId) || task.readOnly !== true)) ||
        (task.workflowId && !flows.has(task.workflowId)) || (task.dependsOn && (!ids.has(task.dependsOn) || task.dependsOn === task.id)) ||
        (['running', 'queued', 'waiting'].includes(task.status) && !state.members.some(m => m.name === task.member))) invalid();
    if (task.result !== undefined && typeof task.result !== 'string') invalid();
    if (task.status === 'waiting' && (typeof task.question !== 'string' || !task.question.trim())) invalid();
    if (task.answers !== undefined && (!Array.isArray(task.answers) || task.answers.some(a => !a || typeof a.question !== 'string' || typeof a.answer !== 'string'))) invalid();
  }
  // Prevent dependency cycles from producing a permanently stuck queue.
  const parents = new Map(state.tasks.map(t => [t.id, t.dependsOn]));
  for (const id of ids) {
    const seen = new Set();
    let next = id;
    while (next) { if (seen.has(next)) invalid(); seen.add(next); next = parents.get(next); }
  }
  return state;
}
