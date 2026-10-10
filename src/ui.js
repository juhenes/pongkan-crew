import { clean, wrapText, fitText, renderMarkdown } from './markdown.js';
import { layoutInput } from './input.js';
import { activityStyle } from './activity.js';
import { displayMessages } from './conversations.js';
import { roleRows, isRoleHeading } from './role-display.js';
export { clean } from './markdown.js';
const wrap = wrapText;
const renderedMessages = new WeakMap();
function messageBody(message, width, folder) {
  const cached = renderedMessages.get(message);
  if (cached && cached.text === message.text && cached.role === message.role && cached.width === width && cached.folder === folder) return cached.rows;
  const rows = message.role === 'assistant' || message.role === 'user' ? renderMarkdown(message.text, width, { folder }) :
    wrap(message.text, width).map(text => ({ text, tone: 'body' }));
  renderedMessages.set(message, { text: message.text, role: message.role, width, folder, rows });
  return rows;
}
export function activityLabel(member, now = Date.now()) {
  if (member.status !== 'working') return member.status;
  const labels = { connecting: 'Connecting', thinking: 'Thinking', command: 'Running command',
    editing: 'Updating files', searching: 'Searching', tool: 'Using tool', responding: 'Preparing response' };
  const spinner = ['|', '/', '-', '\\'][Math.floor(now / 1000) % 4];
  return `${spinner} ${labels[member.progress?.phase] || 'Thinking'}...`;
}
export function screen(crew, selected, input, notice, columns = 100, rows = 30, scroll = 0, panel = null,
  { color = false, view = 'chat', activityScroll = 0, inputCursor = Array.from(input).length, composer = null } = {}) {
  const width = Math.max(30, columns - 1);
  composer ||= layoutInput(input, inputCursor, view === 'activity' ? 'activity' : view === 'group' ? 'crew' : selected, width, Math.max(1, Math.min(5, Math.floor(rows / 5))));
  const height = Math.max(1, rows - 13 - (composer.lines.length - 1));
  const sidebar = width >= 70 ? 23 : 0;
  const contentWidth = width - sidebar - (sidebar ? 3 : 0);
  const readingWidth = Math.max(12, Math.min(92, contentWidth - 4));
  const member = crew.member(selected);
  const waiting = crew.state.tasks?.filter(task => task.status === 'waiting') || [];
  if (waiting.length) notice = `${waiting.length} question(s) waiting — /questions list | /answer TASK_ID YOUR_REPLY`;
  const row = (text, tone = 'body') => ({ text, tone });
  const conversation = displayMessages(member, crew.state.tasks, crew.state.workflows).flatMap(m => {
    const label = m.role === 'user' ? 'YOU' : m.role === 'assistant' ? selected.toUpperCase() : 'SYSTEM';
    const body = messageBody(m, readingWidth, crew.folder);
    return [row(label, m.role), row(''), ...body, row(''), row('')];
  });
  if (!conversation.length) conversation.push(row(`Say hello to ${selected}.`, 'heading'), row(''), row(''), ...roleRows(member.role, readingWidth), row(''), row(''), row('Press ? for commands.', 'muted'));
  if (member.status === 'working') conversation.push(...wrap(member.progress?.channel === 'group' ?
    'This teammate is working in Crew Chat. F2 to switch tabs.' : `${activityLabel(member)}  /stop to cancel`, readingWidth).map(text => row(text, 'muted')));
  for (const task of waiting.filter(task => task.member === selected)) conversation.push(row('WAITING FOR YOUR ANSWER', 'heading'),
    ...wrap(task.question, readingWidth).map(text => row(text)), row(`/answer ${task.id} YOUR_REPLY`, 'selected'));
  let content = conversation;
  if (view === 'group') {
    const discussion = crew.state.discussions?.at(-1);
    const tasks = crew.state.tasks?.filter(t => t.discussionId === discussion?.id) || [];
    const active = tasks.find(t => t.status === 'running');
    const pending = tasks.find(t => t.status === 'queued');
    const paused = discussion?.status === 'working' && !active && crew.queue?.paused;
    const discussionStatus = paused ? 'paused' : discussion?.status === 'working' && !active ? 'waiting' : discussion?.status;
    content = discussion ? [row(`CREW CHAT · ${discussionStatus}`, 'heading'), row(''),
      ...discussion.messages.flatMap(m => [row(m.speaker.toUpperCase(), m.role), row(''),
        ...messageBody(m, readingWidth, crew.folder), row(''), row('')])] :
      [row('Start a crew discussion with /discuss TOPIC.', 'heading'), row(''), row('Or ask one teammate with @developer MESSAGE.', 'muted')];
    if (discussion?.status === 'working') {
      const progress = active ? `${active.member.toUpperCase()} · ${activityLabel(crew.member(active.member))}` :
        paused ? 'Queue paused · /queue resume to start' : `Waiting for ${pending?.member || 'the next speaker'}`;
      content.push(...wrap(progress, readingWidth).map(text => row(text, 'muted')),
        row('Replies appear here when each turn finishes. /stop to end.', 'muted'));
    } else if (discussion) {
      const failed = tasks.find(t => t.error);
      if (failed) content.push(...wrap(`${failed.member}: ${failed.error}`, readingWidth).map(text => row(text, 'system')));
      if (discussion.status === 'interrupted') content.push(row('App restarted. Start again with /discuss TOPIC.', 'muted'));
    }
  }
  if (view === 'activity') {
    const events = crew.activityEvents?.length ? crew.activityEvents : crew.activity.map(text => ({ text }));
    content = events.flatMap(event => {
      const stamp = event.at ? new Date(event.at).toLocaleTimeString('en-GB', { hour12: false }) : 'ACTIVITY';
      const style = activityStyle(event);
      return [row(`${stamp}  ${style.label}`, style.tone), ...wrap(event.text, contentWidth - 4).map(text => row(text, style.tone)),
        ...(event.detail ? wrap(event.detail, contentWidth - 6, true).map(text => row('  ' + text, 'muted')) : []), row('')];
    });
    if (!content.length) content = [row('No team activity yet.', 'heading'), row(''), row('Tasks, commands, searches and handoffs will appear here.', 'muted')];
  }
  const offset = view === 'activity' ? activityScroll : scroll;
  const activeMembers = crew.state.members.filter(m => m.status === 'working');
  const liveRows = view === 'activity' && !panel && activeMembers.length ? [row('LIVE NOW', 'heading'),
    ...activeMembers.slice(0, Math.max(1, Math.min(3, Math.floor((height - 3) / 2)))).flatMap(m => [
      row(`${m.name} · ${activityLabel(m)} · ${Math.max(0, Math.floor((Date.now() - (m.progress?.startedAt || Date.now())) / 1000))}s`, 'selected'),
      row(m.progress?.action || 'Waiting for Codex events', 'muted')])] : [];
  const logHeight = Math.max(1, height - liveRows.length - (liveRows.length ? 1 : 0));
  const end = content.length - Math.max(0, Math.min(offset, Math.max(0, content.length - logHeight)));
  let visible = content.slice(Math.max(0, end - logHeight), end);
  if (liveRows.length) visible = [...visible, ...Array.from({ length: Math.max(0, logHeight - visible.length) }, () => row('')), row(''), ...liveRows];
  let panelPosition = '';
  if (panel) {
    const lines = panel.getRows ? panel.getRows(Math.min(92, contentWidth - 4)) :
      (panel.getLines ? panel.getLines() : panel.lines).flatMap(line => wrap(line, Math.min(92, contentWidth - 4), /DIFF/.test(panel.title))
        .map(text => row(text, !/DIFF/.test(panel.title) && isRoleHeading(text) ? 'heading' : 'body')));
    panel.offset = Math.min(Math.max(0, panel.offset || 0), Math.max(0, lines.length - height));
    visible = lines.slice(panel.offset, panel.offset + height);
    panelPosition = ` (${panel.offset + 1}-${Math.min(panel.offset + height, lines.length)}/${lines.length})`;
  }
  const capacity = Math.max(1, Math.floor((height - 11) / 3));
  const selectedIndex = crew.state.members.findIndex(m => m.name === selected);
  const firstMember = Math.min(Math.max(0, selectedIndex - capacity + 1), Math.max(0, crew.state.members.length - capacity));
  const shown = crew.state.members.slice(firstMember, firstMember + capacity);
  const left = [`CREW ${firstMember + 1}-${firstMember + shown.length}/${crew.state.members.length}`, '', ...shown.flatMap(m => [
    `${view === 'chat' && m.name === selected ? '>' : ' '} ${m.name}`, `  ${m.status === 'working' ? activityLabel(m) : m.status + (m.writable ? ' / write' : '')}`, '',
  ]), view === 'group' ? '> Crew Chat' : '  Crew Chat (Tab)', '', 'VIEWS', view === 'chat' ? '> Chat' : '  Chat', view === 'group' ? '> Crew Chat' : '  Crew Chat: /group', view === 'activity' ? '> Activity' : '  Activity', '', '  F2: switch view'];
  const fit = fitText;
  const tones = { title: '1;38;5;214', user: '1;36', assistant: '1;32', system: '1;33', heading: '1;37',
    body: '37', muted: '2;37', code: '38;5;180', link: '36', selected: '1;36', error: '1;31' };
  const paint = (text, tone) => color ? `\x1b[${tones[tone] || tones.body}m${text}\x1b[0m` : text;
  const elapsed = member.progress ? Math.floor(((member.progress.finishedAt || Date.now()) - member.progress.startedAt) / 1000) : null;
  const status = member.status === 'working' ? activityLabel(member) : member.status === 'ready' ? 'Ready' : 'Needs attention';
  const tabs = ['chat', 'group', 'activity'].map(tab => { const title = tab === 'group' ? 'CREW CHAT' : tab.toUpperCase(); return view === tab ? `[ ${title} ]` : title; }).join('    ');
  const output = [paint(fit(`  PONGKAN CREW   ${tabs}   F2 Switch   ? Help`, width), 'title'),
    paint(fit(`  Folder: ${crew.folder}`, width), 'muted'), paint('─'.repeat(width), 'muted'),
    paint(fit(panel ? `  ${panel.title}${panelPosition} | PgUp/PgDn: scroll | Esc: close` : view === 'activity' ?
      `  TEAM ACTIVITY  ·  ${activityScroll ? 'History / PgDn: newer' : 'Live / following latest'}  ·  PgUp/PgDn Scroll  ·  /chat Return` :
      view === 'group' ? '  CREW CHAT · Read-only discussion · @NAME Message · /stop End' :
      `  ${selected.toUpperCase()}  ·  ${status}  ·  Model: ${member.model || 'Codex default'}${elapsed === null ? '' : `  ·  ${member.status === 'working' ? '' : 'last run '}${elapsed}s`}${scroll ? '  ·  History / PgDn: newer' : ''}`, width), 'heading')];
  for (let i = 0; i < height; i++) {
    const message = visible[i] || row('');
    const body = paint(fit('  ' + message.text, contentWidth), message.tone);
    output.push(sidebar ? `${paint(fit(left[i] || '', sidebar), (left[i] || '').startsWith('>') ? 'selected' : 'muted')}${paint(' │ ', 'muted')}${body}` : body);
  }
  output.push(paint('─'.repeat(width), 'muted'), '',
    ...composer.lines.map(line => paint(fit(line, width), 'user')),
    '', paint(fit(notice || (composer.totalRows > 1 ? `Input ${composer.hiddenBefore + 1}-${composer.hiddenBefore + composer.lines.length}/${composer.totalRows} · Up/Down Move cursor · Enter Send` : view === 'group' ? 'F2 Next tab  ·  @NAME Reply  ·  /discuss TOPIC  ·  Ctrl+K Stop' : view === 'activity' ? 'F2 Next tab  ·  Shift+F2 Previous  ·  ? Help  ·  Ctrl+C Quit' : '? Help  ·  F2 Next tab  ·  Tab Teammates / Crew Chat  ·  Enter Send  ·  Ctrl+K Stop'), width), 'muted'), '');
  return output.join('\n');
}
