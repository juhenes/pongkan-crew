import { randomUUID } from 'node:crypto';
import { TERMINAL } from './tasks.js';
export const MAX_PLAN_STEPS = 12;

export function validatePlan(plan, members, leadName = 'chief', reviewerName = null) {
  const invalid = () => { throw new Error(`Invalid lead plan: expected 1-${MAX_PLAN_STEPS} named steps and a read-only reviewer. No workers were dispatched.`); };
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length < 1 || plan.steps.length > MAX_PLAN_STEPS) invalid();
  for (const step of plan.steps) {
    if (!step || !members.some(m => m.name === step.member) || step.member === leadName ||
        typeof step.task !== 'string' || !step.task.trim() || step.task.length > 8000) invalid();
  }
  if (!members.some(m => m.name === plan.reviewer && !m.writable)) invalid();
  if (reviewerName && plan.reviewer !== reviewerName) invalid();
  return { steps: plan.steps.map(s => ({ member: s.member, task: s.task })), reviewer: plan.reviewer };
}
export class Workflows {
  constructor(crew) {
    this.crew = crew;
    for (const flow of crew.state.workflows) {
      if (!TERMINAL.has(flow.status)) { flow.status = 'interrupted'; flow.error = 'App restarted. Inspect changes, then explicitly retry this workflow.'; }
    }
    for (const task of crew.state.tasks) {
      if (task.workflowId && ['queued', 'waiting'].includes(task.status) && TERMINAL.has(this.get(task.workflowId).status)) task.status = 'cancelled';
    }
  }
  get(id) {
    const flow = this.crew.state.workflows.find(f => f.id === id);
    if (!flow) throw new Error(`Unknown workflow: ${id}`);
    return flow;
  }
  start(text) {
    const crew = this.crew;
    const leadName = crew.leadName;
    crew.member(leadName);
    if (!text?.trim()) throw new Error('Enter a workflow goal.');
    if (!crew.state.members.some(m => m.name !== leadName)) throw new Error('Add at least one teammate besides the lead.');
    if (!crew.state.members.some(m => !m.writable)) throw new Error('A workflow needs a read-only reviewer.');
    const reviewerName = crew.state.coordination?.reviewer || null;
    if (reviewerName && crew.member(reviewerName).writable) throw new Error('The designated reviewer must have read-only access.');
    const flow = { id: randomUUID().slice(0, 8), text, lead: leadName, reviewer: reviewerName, status: 'planning', createdAt: Date.now() };
    crew.state.workflows.push(flow);
    const roster = crew.state.members.map(m => ({ name: m.name, role: m.role, access: m.writable ? 'write' : 'read' }));
    const schema = { type: 'object', additionalProperties: false, required: ['steps', 'reviewer'], properties: {
      steps: { type: 'array', minItems: 1, maxItems: MAX_PLAN_STEPS, items: { type: 'object', additionalProperties: false,
        required: ['member', 'task'], properties: { member: { type: 'string', enum: roster.filter(m => m.name !== leadName).map(m => m.name) }, task: { type: 'string' } } } },
      reviewer: { type: 'string', enum: reviewerName ? [reviewerName] : roster.filter(m => m.access === 'read').map(m => m.name) },
    } };
    crew.queue.enqueue(leadName, `PONGKAN_PLAN\nPlan this goal for the available team: ${text}\nRoster: ${JSON.stringify(roster)}\n` +
      'Return ONLY JSON: {"steps":[{"member":"name","task":"specific task"}],"reviewer":"read-only member name"}. ' +
      `Use 1-${MAX_PLAN_STEPS} sequential steps, never assign a step to ${leadName}. Select ${reviewerName || 'an existing read-only teammate'} as reviewer. ` +
      'Choose only relevant specialists, establish dependencies and interface contracts first, include verification and handoffs, and avoid assigning duplicate ownership. ' +
      'Respect access: implementation needs a writer. Do not edit files, run tools, delegate, or execute the plan yourself.',
      { workflowId: flow.id, kind: 'plan', readOnly: true, schema });
    return flow;
  }
  onStart(task) {
    if (!task.workflowId) return;
    const flow = this.get(task.workflowId);
    flow.status = task.kind === 'plan' ? 'planning' : task.kind === 'review' ? 'reviewing' : task.kind === 'summary' ? 'summarizing' : 'working';
    flow.currentTask = task.id;
  }
  onFinish(task) {
    if (!task.workflowId) return;
    const flow = this.get(task.workflowId);
    if (TERMINAL.has(flow.status)) return;
    if (task.status !== 'completed') { this.fail(flow.id, task.error || `Task ${task.id} ${task.status}`, task.status === 'cancelled' ? 'cancelled' : 'failed'); return; }
    if (task.kind === 'plan') {
      let parsed;
      try { parsed = JSON.parse((task.result || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
      catch { throw new Error('Lead returned invalid JSON. No workers were dispatched. Use /workflow retry ID to request a new plan.'); }
      flow.plan = validatePlan(parsed, this.crew.state.members, flow.lead || 'chief', flow.reviewer);
      let previous = task.id;
      for (const step of flow.plan.steps) {
        const next = this.crew.queue.enqueue(step.member, `Goal: ${flow.text}\nAssignment from ${flow.lead || 'chief'}: ${step.task}`,
          { workflowId: flow.id, kind: 'work', dependsOn: previous, hold: true });
        previous = next.id;
        this.crew.notify(`${flow.lead || 'chief'} -> ${step.member}: ${step.task.slice(0, 160)}`);
      }
      const review = this.crew.queue.enqueue(flow.plan.reviewer, `Review the completed work for this goal: ${flow.text}\nInspect the changes and verification. Report defects, risks, and any missing work. Do not modify files.`,
        { workflowId: flow.id, kind: 'review', readOnly: true, stableRead: true, dependsOn: previous, hold: true });
      this.crew.queue.enqueue(flow.lead || 'chief', `PONGKAN_SUMMARY\nSummarize actual completed work for: ${flow.text}\nInclude the review findings, tests reported, changed files, and unresolved issues. Do not claim unverified success or modify files.`,
        { workflowId: flow.id, kind: 'summary', readOnly: true, dependsOn: review.id, hold: true });
      flow.status = 'working';
    } else if (task.kind === 'summary') {
      flow.status = 'completed'; flow.result = task.result; flow.finishedAt = Date.now();
      this.crew.notify(`Workflow ${flow.id} completed (see ${flow.lead || 'chief'}'s summary)`);
    }
  }
  fail(id, error, status = 'failed') {
    if (!id) return;
    const flow = this.get(id);
    flow.status = status; flow.error = error; flow.finishedAt = Date.now();
    for (const task of this.crew.state.tasks.filter(t => t.workflowId === id && !TERMINAL.has(t.status))) {
      if (task.status === 'running') { task.cancelRequested = true; this.crew.stop(task.member); }
      else { task.status = 'cancelled'; task.finishedAt = Date.now(); }
    }
    this.crew.save(); this.crew.notify(`Workflow ${id} ${status}: ${error}`);
  }
  cancel(id) { this.fail(id, 'Cancelled by user.', 'cancelled'); }
  retry(id) {
    const flow = this.get(id);
    if (!TERMINAL.has(flow.status)) throw new Error('Cancel the workflow before retrying it.');
    return this.start(flow.text);
  }
  async settled(id) {
    while (!TERMINAL.has(this.get(id).status)) await new Promise(resolve => setTimeout(resolve, 5));
    return this.get(id);
  }
}
