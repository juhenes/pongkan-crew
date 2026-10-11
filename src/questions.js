export function isCasualMessage(text) {
  return /^(?:hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|ok|okay|got it|nothing|no work(?: requested)?)[\s!.]*$/i.test(
    text.trim(),
  );
}

export function clarificationContext(answers) {
  return (
    '\n\nUser clarification answers for this assignment:\n' +
    answers.map(a => `Question: ${a.question}\nAnswer: ${a.answer}`).join('\n\n') +
    '\nContinue the existing assignment from current files; do not blindly repeat completed edits.'
  );
}

export function workPolicy(enabled, casual = false) {
  if (casual)
    return '\nCASUAL CONVERSATION\nGive a brief, natural reply to this greeting or acknowledgement. Do not use tools, invent work, provide a completion or handoff report, or ask a blocking task question. Do not emit PONGKAN_QUESTION. No project work is requested.\n';
  return (
    '\nWORKING WITH THE USER\n' +
    (enabled !== false
      ? 'Questions are ON. Make routine implementation choices yourself. For a material missing preference or requirement, finish independent work, then end your final response with a single line PONGKAN_QUESTION: followed by the specific question. This pauses this assignment until the user answers. Do not use this for permission approvals.\n'
      : 'Questions are OFF. Decide routine product/implementation choices yourself, report assumptions, and continue within the authorized task. Do not emit PONGKAN_QUESTION or wait for optional preferences.\n') +
    'Use existing applicable approvals; do not repeatedly ask for authorization already granted. If a necessary command fails due to sandbox access (such as Node/npm EPERM), request command-specific escalation through the configured approval mechanism and retry only with a meaningful change. Do not disable sandboxing or change global permissions. Read-only reviewers may request scoped execution of verification commands that create generated artifacts, while keeping source files unchanged; report exact permission needs if unavailable.\n' +
    'If required input, tool access, approval, or prerequisites remain unavailable, end your final response with PONGKAN_BLOCKED: followed by the exact failure, command, and minimum user action. This fails this assignment and stops dependent work. Never use a clarification answer as permission to bypass sandbox restrictions.\n'
  );
}

export function taskSignal(text) {
  const line = text.trim().split(/\r?\n/).at(-1);
  const match = line?.match(/^PONGKAN_(QUESTION|BLOCKED):\s*(.+)$/);
  return match ? { kind: match[1], text: match[2].trim() } : null;
}
