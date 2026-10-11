export function answerShortcut(app, input) {
  const waiting = app.crew.state.tasks.filter(task => task.status === 'waiting');
  if (!waiting.length) {
    app.notice = 'No questions waiting for an answer.';
    return input;
  }
  const current = input.match(/^\/answer\s+(\S+)(?:\s([\s\S]*))?$/);
  const index = current ? waiting.findIndex(task => task.id === current[1]) : -1;
  const task =
    index >= 0
      ? waiting[(index + 1) % waiting.length]
      : waiting.find(
          task =>
            task.member === app.selected &&
            (task.conversationId || null) === (app.crew.state.activeConversations?.[app.selected] || null),
        ) || waiting[0];
  app.panel = {
    title: `ANSWER ${task.member}`,
    offset: 0,
    lines: [task.question, '', 'Type your reply and press Enter.', 'Shift+Right: next question | Esc: close'],
  };
  return `/answer ${task.id} ${current ? current[2] || '' : input}`;
}
