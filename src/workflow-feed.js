import { wrapText } from './markdown.js';
const label = name => name.charAt(0).toUpperCase() + name.slice(1);

// Derived from durable task records: rendering never creates another event log.
export function workflowFeed(crew, width, conversationId) {
  const flows = new Map((crew.state.workflows || []).map(f => [f.id, f]));
  const allTasks = new Map((crew.state.tasks || []).map(t => [t.id, t]));
  const tasks = (crew.state.tasks || []).filter(t => flows.has(t.workflowId) && (!conversationId ||
    flows.get(t.workflowId)?.sourceConversationId === conversationId));
  const rows = [];
  for (const task of tasks.slice(-40)) {
    const flow = flows.get(task.workflowId);
    const prior = task.dependsOn && allTasks.get(task.dependsOn);
    const from = task.kind === 'plan' ? 'You' : label(prior?.member || flow.lead);
    rows.push({ text: `${from} → ${label(task.member)} · ${task.kind} · ${task.status}`, tone: 'heading' },
      { text: `Workflow ${flow.id} · task ${task.id} · /queue show ${task.id}`, tone: 'muted' });
    const assignment = task.kind === 'plan' ? flow.text : task.text;
    rows.push(...wrapText(assignment.slice(0, 300), width).map(text => ({ text, tone: 'body' })));
    if (task.result && task.kind !== 'plan') rows.push(...wrapText(task.result.slice(0, 800), width).map(text => ({ text, tone: 'body' })));
    if (task.error || task.question) rows.push(...wrapText(task.error || task.question, width).map(text => ({ text, tone: 'system' })));
    if (task.steering?.length) rows.push({ text: `Corrections: ${task.steering.filter(s => s.appliedAt).length}/${task.steering.length} delivered`, tone: 'muted' });
    rows.push({ text: '', tone: 'body' });
  }
  return rows.length ? [{ text: 'WORKFLOW HANDOFFS · latest 40 tasks · full results: /queue show ID', tone: 'heading' }, ...rows] : [];
}
