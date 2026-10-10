import { commandExamples } from './command-examples.js';
import { ROLES, roleMember } from './roles.js';
import { presetListRows } from './preset-display.js';
import { directMessages } from './conversations.js';
import { spacedRoleText } from './role-display.js';
import { readModelCatalog, modelLabel, validateModelChoice, modelCatalogLines } from './models.js';
export const HELP = [
  'Enter one command at a time. UPPERCASE = replace with a value; [VALUE] = optional.',
  'Names below use the default crew; /crew list shows your actual names.',
  'Model IDs are examples; use /model list to check your installed catalog.', 'You can search descriptions and examples with /help QUERY.', '',
  'HELP — COMMANDS AND CONTROLS',
  'PgUp/PgDn or Up/Down: scroll help | Esc: return to previous view', '',
  'CREW',
  '/roles list [QUERY]           Browse reusable specialist roles',
  '/roles show ROLE              Read responsibilities, checks and handoffs',
  '/crew add NAME --role ROLE    Add a specialist with its default access',
  '/crew role NAME --role ROLE   Apply specialist instructions and access',
  '/preset list                  List built-in and saved crew presets',
  '/preset show NAME             Preview roles and permissions',
  '/preset apply NAME            Archive current crew and apply preset',
  '/preset save NAME [LEAD REVIEWER] Save current roles as a custom preset',
  '/preset create NAME [LEAD REVIEWER] Save new team; reject existing names',
  '/preset title NAME TEXT        Set saved team display title',
  '/preset improve MEMBER [GOALS] Ask Codex for read-only role suggestions',
  '/preset delete NAME            Delete custom definition; keep crew/files',
  '/preset restore ARCHIVE_ID    Restore a complete archived crew',
  '/crew list                     List teammates and permissions',
  '/crew add NAME [ROLE]          Add a read-only teammate',
  '/crew remove NAME             Archive/remove non-coordinator; exact arguments required',
  '/crew rename NAME NEWNAME     Rename teammate; keep lead/reviewer routing',
  '/crew role NAME ROLE          Change instructions for future turns',
  '/crew access NAME read|write  Set permissions; reviewer stays read-only',
  '/crew info [NAME]             Show role, permissions and session', '',
  'CHAT AND TASKS',
  '/discuss TOPIC                Two read-only crew rounds and lead summary',
  '/group                       Open shared Crew Chat',
  '@NAME MESSAGE                Read-only reply with shared chat context',
  '/chat [NAME]                  Return to chat, optionally select teammate',
  '/next /prev                   Cycle teammates and Crew Chat',
  '/task TEXT                    Lead plans, dispatches, reviews, summarizes',
  '/send NAME TEXT               Send work to a specific teammate',
  '/handoff NAME [TASK]           Send selected agent\'s latest answer',
  '/retry                        Resend selected agent\'s last user message',
  '/questions [on|off|list]       Clarification mode and pending questions',
  '/answer TASK_ID TEXT          Answer and continue the same assignment',
  '/stop [NAME|all]              Cancel work (selected agent by default)', '',
  'TASK QUEUE AND WORKFLOWS',
  '/queue list                   Show durable tasks and IDs',
  '/queue show ID                Show task prompt, result and error',
  '/queue pause|resume           Pause dispatch / resume saved tasks',
  '/queue cancel ID              Cancel queued or running task',
  '/queue move ID POSITION       Reorder queued work (1-based)',
  '/queue retry ID               Explicitly repeat a finished task',
  '/workflow list                List coordinated workflows',
  '/workflow show ID             Show plan, steps and summary',
  '/workflow cancel ID           Cancel workflow and dependent steps',
  '/workflow retry ID            Restart complete workflow; may repeat edits', '',
  'CONVERSATION AND VIEWS',
  '/clear                        Clear local transcript; keep Codex session',
  '/new                          Clear transcript and start fresh session',
  '/status                       Show the whole crew\'s current status',
  '/context [on|off|status]       Control local context clipping; inspect character counts',
  '/model [NAME]                 Show model settings and live status',
  '/model list                   Browse locally cached Codex models',
  '/model set NAME|all MODEL [EFFORT] Choose model for future tasks',
  '/model reset [NAME|all]        Use inherited Codex model and effort',
  '/activity or /act             Open the live team activity tab',
  '/switch chat|group|activity   Select a tab; /switch cycles all three',
  '/folder                       Show active folder and state file',
  '/progress [NAME]              Live action, elapsed time, files and errors',
  '/diff [last|git|TASK_ID]       View last writer diff or repository diff',
  '/changes                      List captured changed files',
  '/doctor                       Check Codex version and login',
  '/archives                     List recoverable changes',
  '/archives restore ID [NAME]   Restore saved conversation as a teammate',
  '/undo                         Restore latest removed/cleared conversation',
  '/help or ?                    Open this help panel',
  '/help QUERY                   Search the command guide',
  '/close                        Close a panel',
  '/quit or /exit                Stop tasks and exit', '',
  'KEYBOARD',
  'F1 or ? on empty input        Open help immediately',
  'F2 / Shift+F2                 Next / previous tab (Chat, Crew Chat, Activity)',
  'Esc                           Close panel / return to chat / clear input',
  'Tab on /command               Complete command or teammate name',
  'Tab / Shift+Tab otherwise     Cycle teammates and Crew Chat',
  'Up / Down                     Move in wrapped input; otherwise scroll',
  'Mouse wheel                   Disabled; use PgUp/PgDn',
  'PgUp / PgDn                   Scroll history or panel',
  'Left / Right, Home / End      Move input cursor',
  'Backspace / Delete            Delete text at cursor',
  'Ctrl+U                        Clear input',
  'Ctrl+W                        Delete previous word',
  'Ctrl+P / Ctrl+N               Previous / next input history',
  'Ctrl+K                        Stop selected teammate',
  'Ctrl+L                        Redraw screen',
  'Ctrl+C                        Stop all work and quit', '',
  'NOTES',
  'Only one writer can run at once. Readers can run alongside it.',
  'Stop a teammate before removing, renaming or reconfiguring it.',
  'Remove/clear/new archive local history. /undo restores the latest change.',
  'Saved queued work starts paused after restart. /queue resume continues it.',
  'Interrupted workflows require explicit /workflow retry ID.',
  'The lead validates at most twelve sequential assignments, then review and summary.',
  'Completed workflow means execution finished; inspect review for defects.',
].flatMap(commandExamples);

function idle(crew, name) {
  const member = crew.member(name);
  if (crew.running.has(name)) throw new Error('Stop this teammate before changing it.');
  if (crew.state.tasks.some(task => task.member === name && ['queued', 'waiting'].includes(task.status))) throw new Error('Answer or cancel waiting/queued tasks for this teammate before changing it.');
  if (crew.state.workflows.some(flow => !TERMINAL.has(flow.status))) throw new Error('Cancel or finish active workflows before changing the crew.');
  return member;
}
export function cycle(app, direction) {
  const members = app.crew.state.members;
  const index = app.view === 'group' ? members.length : members.findIndex(m => m.name === app.selected);
  const next = (index + direction + members.length + 1) % (members.length + 1);
  app.view = next === members.length ? 'group' : 'chat';
  if (app.view === 'chat') app.selected = members[next].name;
  app.panel = null; app.scroll = 0;
}
export function execute(app, line) {
  const crew = app.crew;
  app.notice = ''; app.scroll = 0;
  const panel = (title, lines) => { app.panel = { title, lines: typeof lines === 'function' ? lines() : lines, getLines: typeof lines === 'function' ? lines : null, offset: 0 }; };
  const load = (title, promise) => {
    panel(title, ['Loading...']); const current = app.panel;
    return promise.then(lines => { if (app.panel === current) { current.lines = lines; crew.emit('change'); } })
      .catch(error => { if (app.panel === current) { current.lines = [error.message]; crew.emit('change'); } });
  };
  if (line === '?' || line === '/help') { panel('HELP', HELP); return; }
  if (!line.startsWith('/')) {
    const mention = line.match(/^@([a-z][a-z0-9-]*)(?:[,:]?\s+)([\s\S]+)$/);
    if (mention || app.view === 'group') {
      crew.discussions.start(mention ? mention[2] : line, mention?.[1]);
      app.view = 'group'; app.panel = null;
      app.notice = crew.queue.paused ? 'Discussion queued; /queue resume to start.' : 'Discussion started.'; return;
    }
    if (app.view === 'activity') throw new Error('Activity is a command view. Use /chat to send a message, or /send NAME TEXT.');
    app.panel = null; app.send(app.selected, line); return;
  }
  const [command, ...parts] = line.trim().split(/\s+/);
  const text = parts.join(' ');
  const requireText = value => { if (!value?.trim()) throw new Error(`Missing arguments. See /help for ${command}.`); return value; };
  const chat = name => { app.selected = crew.member(name || app.selected).name; app.panel = null; app.view = 'chat'; };
  if (command === '/help') {
    const matches = HELP.filter(line => line.toLowerCase().includes(text.toLowerCase()));
    panel(`HELP: ${text || 'all'}`, matches.length ? matches : ['No help matches. Try another search.']); return;
  }
  if (command === '/quit' || command === '/exit') app.quit();
  else if (command === '/questions') {
    if (parts.length > 1 || (text && !['on', 'off', 'list'].includes(text))) throw new Error('Use /questions on|off|list.');
    if (text === 'on' || text === 'off') {
      crew.state.questionsEnabled = text === 'on'; crew.save();
      app.notice = `Questions ${text.toUpperCase()} for future turns. Existing waiting tasks still need /answer or /queue cancel.`;
    } else panel('CREW QUESTIONS', () => [`Questions: ${crew.state.questionsEnabled === false ? 'OFF (AI decides routine choices)' : 'ON'}`, '',
      ...crew.state.tasks.filter(t => t.status === 'waiting').flatMap(t => [`${t.id} ${t.member}: ${t.question}`, `/answer ${t.id} YOUR_REPLY`, '']),
      'Permission approvals remain separate from clarification answers.']);
  }
  else if (command === '/answer') {
    crew.queue.answer(parts[0], requireText(parts.slice(1).join(' ')));
    app.panel = null; app.notice = `Answer saved for ${parts[0]}${crew.queue.paused ? '; /queue resume to continue' : '; assignment continues'}.`;
  }
  else if (command === '/discuss' || command === '/group') {
    if (command === '/discuss') {
      crew.discussions.start(requireText(text));
      app.notice = crew.queue.paused ? 'Discussion queued; /queue resume to start.' : 'Discussion started.';
    }
    app.view = 'group'; app.panel = null;
  }
  else if (command === '/switch' || command === '/activity' || command === '/act') {
    const views = ['chat', 'group', 'activity'];
    const nextView = views[(Math.max(0, views.indexOf(app.view || 'chat')) + (parts[0] === 'prev' ? 2 : 1)) % views.length];
    const target = command === '/switch' ? (!parts[0] || parts[0] === 'prev' ? nextView : parts[0]) : 'activity';
    if (!['chat', 'activity', 'group'].includes(target) || (command === '/switch' && parts.length > 1)) throw new Error('Use /switch chat, /switch activity, or /switch group.');
    app.view = target; app.panel = null; app.activityScroll = 0;
  }
  else if (command === '/close') app.panel = null;
  else if (command === '/next' || command === '/prev') cycle(app, command === '/next' ? 1 : -1);
  else if (command === '/chat') chat(parts[0]);
  else if (command === '/roles') {
    const [action = 'list', key, ...rest] = parts;
    if (action === 'list') {
      const query = parts.slice(1).join(' ').toLowerCase();
      const matches = Object.entries(ROLES).filter(([key, r]) => `${key} ${r.title} ${r.category}`.toLowerCase().includes(query));
      panel('ROLE CATALOG', matches.length ? [...matches.map(([key, r]) => `${key} — ${r.title} | ${r.category} | ${r.writable ? 'write' : 'read-only'}`), '',
        '/roles show ROLE to inspect. /crew add NAME --role ROLE to add.'] : ['No roles match. Use /roles list.']);
    } else if (action === 'show' && key && !rest.length) {
      const member = roleMember(key); const r = ROLES[key];
      panel(`ROLE ${key}`, [r.title, '', `Default access: ${member.writable ? 'write' : 'read-only'}`, '', '', spacedRoleText(member.role)]);
    } else throw new Error('Use /roles list [QUERY] or /roles show ROLE.');
  }
  else if (command === '/preset') {
    const [action = 'list', name, lead, reviewer, ...extra] = parts;
    if (action === 'list' && !name) {
      panel('CREW PRESETS', []);
      app.panel.getRows = width => presetListRows(crew.presets.list(), crew.state.activePreset, width);
    }
    else if (action === 'show' && name && !lead) {
      const p = crew.presets.get(name);
      panel(`PRESET ${name}`, [p.title, '', `Lead: ${p.lead}`, `Reviewer: ${p.reviewer}`, '', '',
        ...p.members.flatMap(m => [`${m.name} — ${m.writable ? 'write' : 'read-only'}`, '', spacedRoleText(m.role), '', '']),
        'Applying archives the current crew and starts fresh conversations. /undo restores the previous crew.']);
    } else if (action === 'apply' && name && !lead) {
      crew.presets.apply(name); chat(crew.leadName); app.notice = `Applied ${name}. Previous crew archived; /undo to restore.`;
    } else if (action === 'title' && name) {
      crew.presets.title(name, parts.slice(2).join(' ')); app.notice = `Updated title for ${name}.`;
    } else if (action === 'delete' && name && !lead) {
      crew.presets.delete(name); app.notice = `Deleted saved preset ${name}. Current crew and project files are preserved.`;
    } else if (action === 'improve' && name) {
      const member = crew.member(name);
      const task = crew.queue.enqueue(name, `Suggest improved role instructions for ${name}. Include skills, responsibilities, deliverables, checks, boundaries and handoffs. Suggest a descriptive team title if useful. Return suggested text and /crew role commands for the user to review and apply manually. Do not edit files or settings. Current instructions: ${member.role}\nUser goals: ${parts.slice(2).join(' ') || 'Improve clarity and specificity.'}`, { readOnly: true });
      chat(name); app.notice = `Read-only description suggestions queued as ${task.id}; review the reply before applying.`;
    } else if (['save', 'create'].includes(action) && name && !extra.length && (!lead || reviewer)) {
      if (action === 'create' && Object.hasOwn(crew.presets.list(), name)) throw new Error('Preset already exists. Use /preset save to update a custom preset.');
      crew.presets.save(name, lead, reviewer); app.notice = `Saved preset ${name} for this folder.`;
    } else if (action === 'restore' && name && !lead) {
      crew.presets.restore(name); chat(crew.state.members.some(m => m.name === crew.leadName) ? crew.leadName : crew.state.members[0].name);
      app.notice = 'Archived crew restored.';
    } else throw new Error('Use /preset list|show NAME|apply NAME|create NAME [LEAD REVIEWER]|save NAME [LEAD REVIEWER]|title NAME TEXT|improve MEMBER [GOALS]|delete NAME|restore ARCHIVE_ID.');
  }
  else if (command === '/crew') {
    const [action, name, ...rest] = parts;
    if (action === 'chat') chat(name);
    else if (action === 'list') panel('CREW', crew.state.members.flatMap(m => [`${m.name} — ${m.status} / ${m.writable ? 'write' : 'read'}`, '', spacedRoleText(m.role), '', '']));
    else if (action === 'info') {
      const m = crew.member(name || app.selected);
      panel('TEAMMATE', [m.name, '', `Status: ${m.status}`, `Requested model: ${modelLabel(m)}`, `Access: ${m.writable ? 'workspace-write' : 'read-only'}`, '', '',
        spacedRoleText(m.role), '', '', `Direct session: ${m.threadId || 'Not started'}`, `Direct messages: ${directMessages(m).length}`]);
    } else if (action === 'add') {
      let specialist;
      if (rest[0] === '--role') {
        if (rest.length !== 2) throw new Error('Use /crew add NAME --role ROLE.');
        specialist = roleMember(rest[1], name);
      }
      crew.add(name || '', specialist?.role || rest.join(' ') || 'Assist with the project.', specialist?.writable || false);
      crew.notify(`Added ${name}`); app.notice = `Added ${name} (${specialist?.writable ? 'write' : 'read-only'}).`;
    } else if (['remove', 'rename', 'role', 'access'].includes(action)) {
      if (action === 'remove' && (!name || rest.length)) throw new Error('Use /crew remove NAME. Extra arguments are not accepted.');
      const member = idle(crew, name);
      if (action === 'remove') {
        if (crew.state.members.length === 1) throw new Error('Cannot remove the last teammate.');
        if ([crew.leadName, crew.reviewerName].includes(name)) throw new Error('Cannot remove the designated lead or reviewer. Apply another preset first.');
        crew.archive(`remove ${name}`);
        crew.state.members = crew.state.members.filter(m => m !== member);
        if (app.selected === name) app.selected = crew.state.members[0].name;
        app.notice = `Removed ${name}. Use /undo to restore its history.`;
      } else if (action === 'rename') {
        const next = requireText(rest[0]);
        if (rest.length !== 1 || !/^[a-z][a-z0-9-]{0,31}$/.test(next)) throw new Error('Use one lowercase name, up to 32 letters, numbers or hyphens.');
        if (crew.state.members.some(m => m.name === next)) throw new Error('That teammate already exists.');
        member.name = next;
        if (crew.state.coordination) for (const key of ['lead', 'reviewer']) if (crew.state.coordination[key] === name) crew.state.coordination[key] = next;
        if (app.selected === name) app.selected = next;
      } else if (action === 'role') {
        if (rest[0] === '--role') {
          if (rest.length !== 2) throw new Error('Use /crew role NAME --role ROLE.');
          const specialist = roleMember(rest[1], name);
          if (crew.reviewerName === name && specialist.writable) throw new Error('The designated reviewer must remain read-only.');
          member.role = specialist.role; member.writable = specialist.writable;
        } else member.role = requireText(rest.join(' '));
      }
      else {
        if (rest.length !== 1 || !['read', 'write'].includes(rest[0])) throw new Error('Access must be read or write.');
        if (crew.reviewerName === name && rest[0] === 'write') throw new Error('The designated reviewer must remain read-only.');
        member.writable = rest[0] === 'write';
      }
      crew.save(); app.panel = null;
      crew.notify(`${action}: ${name}`);
      app.notice ||= `${name} updated.`;
    } else throw new Error('Use /crew list|add|remove|rename|role|access|info|chat. See /help.');
  } else if (command === '/stop') {
    if (!parts[0] && app.view === 'group') {
      crew.discussions.stop(); app.notice = 'Discussion stopped.'; return;
    }
    if (parts[0] === 'all') {
      crew.queue.pause();
      for (const task of crew.state.tasks) if (!TERMINAL.has(task.status)) crew.queue.cancel(task.id);
      for (const name of crew.running.keys()) crew.stop(name);
      app.notice = 'All tasks cancelled; queue paused.';
    } else {
      const name = parts[0] || app.selected; crew.member(name);
      const task = crew.state.tasks.find(t => t.member === name && t.status === 'running');
      if (task) crew.queue.cancel(task.id); else crew.stop(name);
      app.notice = `Stop requested for ${name}.`;
    }
  } else if (command === '/task') {
    requireText(text); chat(crew.leadName);
    const flow = crew.workflows.start(text); app.notice = `Workflow ${flow.id} created${crew.queue.paused ? '; /queue resume to start' : ''}.`;
  }
  else if (command === '/send') { crew.member(parts[0]); app.send(parts[0], requireText(parts.slice(1).join(' '))); }
  else if (command === '/handoff') {
    crew.member(parts[0]);
    const answer = directMessages(crew.member(app.selected)).findLast(m => m.role === 'assistant');
    if (!answer) throw new Error('No answer available to hand off yet.');
    app.send(parts[0], `Handoff from ${app.selected}:\n${answer.text}\n\n${parts.slice(1).join(' ') || 'Continue from these findings according to your role.'}`);
    crew.notify(`${app.selected} -> ${parts[0]}: handoff`);
  } else if (command === '/retry') {
    const member = idle(crew, app.selected);
    const last = directMessages(member).findLast(m => m.role === 'user');
    if (!last) throw new Error('No previous user message to retry.');
    app.send(app.selected, last.text);
  } else if (command === '/new' || command === '/clear') {
    const member = idle(crew, app.selected);
    crew.archive(`${command.slice(1)} ${app.selected}`);
    member.messages = []; member.status = 'ready';
    if (command === '/new') member.threadId = null;
    crew.save(); app.panel = null;
    app.notice = command === '/new' ? 'Fresh conversation ready.' : 'Local transcript cleared. Codex still remembers this session.';
  } else if (command === '/undo') {
    app.notice = `Restored ${crew.undo()}.`;
    if (!crew.state.members.some(m => m.name === app.selected)) app.selected = crew.state.members[0].name;
    app.panel = null;
  } else if (command === '/archives') {
    if (!parts[0]) panel('ARCHIVES', crew.state.archives.length ? crew.state.archives.map(a => `${a.id} ${a.at} ${a.reason}${a.undoable === false ? ' (use restore)' : ''}`) : ['No archived changes.']);
    else if (parts[0] === 'restore') {
      app.selected = crew.restoreArchive(parts[1], parts[2]); app.panel = null;
      app.notice = `Restored as ${app.selected}.`;
    } else throw new Error('Use /archives or /archives restore ID [NAME]. Choose a new name if the original exists.');
  }
  else if (command === '/queue') {
    const [action, id, position] = parts;
    if (!action || action === 'list') panel('TASK QUEUE', () => [`Dispatch: ${crew.queue.paused ? 'PAUSED — /queue resume' : 'RUNNING'}`, '',
      ...crew.state.tasks.map(t => `${t.id} ${t.status} -> ${t.member}${t.workflowId ? ` [workflow ${t.workflowId}]` : ''}\n${t.text.slice(0, 140)}`)]);
    else if (action === 'show') {
      crew.queue.get(id);
      panel(`TASK ${id}`, () => { const task = crew.queue.get(id); return [`${task.status} -> ${task.member}`, `Depends on: ${task.dependsOn || 'none'}`,
        `Elapsed: ${task.startedAt ? Math.floor(((task.finishedAt || Date.now()) - task.startedAt) / 1000) : 0}s`, '', 'PROMPT', task.text, '', 'RESULT', task.result || '(none)', '', 'ERROR', task.error || '(none)']; });
    } else if (action === 'pause') crew.queue.pause();
    else if (action === 'resume') crew.queue.resume();
    else if (action === 'cancel') crew.queue.cancel(id);
    else if (action === 'move') crew.queue.move(id, Number(position));
    else if (action === 'retry') app.notice = `Queued retry ${crew.queue.retry(id).id}.`;
    else throw new Error('Use /queue list|show|pause|resume|cancel|move|retry.');
  } else if (command === '/workflow') {
    const [action, id] = parts;
    if (!action || action === 'list') panel('WORKFLOWS', () => crew.state.workflows.length ? crew.state.workflows.map(f => `${f.id} ${f.status}: ${f.text}`) : ['No workflows. Use /task GOAL.']);
    else if (action === 'show') {
      crew.workflows.get(id);
      panel(`WORKFLOW ${id}`, () => { const flow = crew.workflows.get(id); return [`Status: ${flow.status}`, `Goal: ${flow.text}`, '',
        ...crew.state.tasks.filter(t => t.workflowId === id).map(t => `${t.id} ${t.kind} -> ${t.member}: ${t.status}`), '', 'SUMMARY', flow.result || '(pending)', '', 'ERROR', flow.error || '(none)']; });
    } else if (action === 'cancel') crew.workflows.cancel(id);
    else if (action === 'retry') app.notice = `Workflow ${crew.workflows.retry(id).id} created. Retry may repeat earlier edits.`;
    else throw new Error('Use /workflow list|show|cancel|retry.');
  } else if (command === '/diff') {
    if (parts[0] === 'git' || (!parts[0] && !crew.state.lastDiff)) return load('REPOSITORY DIFF', gitDiff(crew.folder).then(diff => diff.split('\n')));
    const diff = !parts[0] || parts[0] === 'last' ? crew.state.lastDiff : crew.queue.get(parts[0]).diff;
    panel('WRITER DIFF', diff ? diff.text.split('\n') : ['No captured writer diff yet. Use /diff git for repository changes.']);
  } else if (command === '/changes') panel('CHANGED FILES', crew.state.lastDiff?.files.length ? crew.state.lastDiff.files : ['No changed text files captured in the latest writer task.']);
  else if (command === '/doctor') return load('STARTUP CHECKS', checkRuntime().then(result => [result.ok ? 'READY' : 'ACTION NEEDED', ...result.lines, `Folder: ${crew.folder}`, `Saved state: ${crew.file}`]));
  else if (command === '/progress') {
    const name = parts[0] || app.selected; crew.member(name);
    panel(`PROGRESS ${name}`, () => { const m = crew.member(name), p = m.progress; return [
      `Status: ${m.status}`, `Action: ${p?.action || 'Not started'}`, `Elapsed: ${p ? Math.floor(((p.finishedAt || Date.now()) - p.startedAt) / 1000) : 0}s`,
      `Requested model: ${modelLabel(p || m)}`,
      `Events: ${p?.events || 0}`, '', 'CHANGED FILES', ...(p?.files || []), '', 'LATEST SYSTEM MESSAGE', directMessages(m).findLast(msg => msg.role === 'system')?.text || '(none)']; });
  }
  else if (command === '/context') {
    if (parts.length > 1 || (text && !['on', 'off', 'status'].includes(text))) throw new Error('Use /context on|off|status.');
    if (text === 'on' || text === 'off') {
      crew.state.contextOptimization = text === 'on'; crew.save();
      app.notice = `Context optimization ${text.toUpperCase()} for future prompts; saved history and active turns are preserved.`;
    } else panel('CONTEXT OPTIMIZER', () => [
      `Mode: ${crew.state.contextOptimization ? 'ON' : 'OFF (default)'}`, '',
      'Opt in: /context on | Disable: /context off',
      'Locally clips long assistant replies in handoffs, discussions and recovered history.',
      'Preserves user text, clarification answers, file lists and original saved records.',
      'Target: 24,000 characters per context section; protected text may exceed it.',
      'Does not control Codex session history. Character counts are not token usage.', '',
      ...Object.entries(crew.state.contextStats || {}).map(([kind, stats]) =>
        `${kind}: ${stats.before} -> ${stats.after} characters; ${stats.clipped} shortened replies`),
      'Counts show the latest optimized section of each type, not total prompt size.',
      'Middle text can contain important evidence. Inspect /queue show ID for full task results.',
    ]);
  }
  else if (command === '/model') {
    const [action, target, model, effort, ...extra] = parts;
    if (action === 'list' && parts.length === 1) {
      const catalog = readModelCatalog();
      panel('MODEL CHOICES', modelCatalogLines(catalog, app.selected));
    } else if (action === 'set' || action === 'reset') {
      if (action === 'set') {
        if (!target || !model || extra.length) throw new Error('Use /model set NAME|all MODEL [EFFORT].');
        validateModelChoice(model, effort);
      } else if (parts.length > 2) throw new Error('Use /model reset [NAME|all].');
      const names = target === 'all' ? crew.state.members.map(member => member.name) : [target || app.selected];
      const members = names.map(name => idle(crew, name));
      for (const member of members) {
        if (action === 'reset') { delete member.model; delete member.reasoningEffort; }
        else {
          member.model = model;
          if (effort) member.reasoningEffort = effort; else delete member.reasoningEffort;
        }
      }
      crew.save(); crew.notify(`Model settings updated: ${names.join(', ')}`);
      app.notice = 'Model settings saved for future turns. Conversation history is preserved.';
    } else if (parts.length <= 1) {
      const name = action || app.selected; crew.member(name);
      panel(`MODEL ${name}`, () => { const member = crew.member(name); return [
        `Status: ${member.status}`, `Requested model: ${modelLabel(member)}`,
        `Action: ${member.progress?.action || 'Not started'}`,
        `Last turn requested: ${member.progress ? modelLabel(member.progress) : 'Not started'}`, '',
        'Model selections are requests; Codex reports errors for unavailable models.',
        'Inherited defaults are resolved by Codex, including project settings.',
        'Use /model list, /model set NAME|all MODEL [EFFORT], or /model reset [NAME|all].']; });
    } else throw new Error('Use /model [NAME], /model list, /model set NAME|all MODEL [EFFORT], or /model reset [NAME|all].');
  }
  else if (command === '/status') panel('STATUS', () => [`Preset: ${crew.state.activePreset || 'default / customized'}`, `Lead: ${crew.leadName} | Reviewer: ${crew.reviewerName}`,
    `Questions: ${crew.state.questionsEnabled === false ? 'OFF' : 'ON'} | Waiting: ${crew.state.tasks.filter(t => t.status === 'waiting').length}`,
    `Dispatch: ${crew.queue.paused ? 'PAUSED' : 'RUNNING'}`, '', ...crew.state.members.flatMap(m => [
      `${m.name}: ${m.status} | ${m.writable ? 'write' : 'read'} | requested model: ${modelLabel(m)}`,
      `  ${m.progress?.action || 'Not started'} | ${m.messages.length} messages`])]);
  else if (command === '/folder') panel('FOLDER', [crew.folder, '', 'Saved state:', crew.file]);
  else throw new Error('Unknown command. Press ? or use /help.');
}
import { gitDiff } from './diff.js';
import { checkRuntime } from './runtime.js';
import { TERMINAL } from './tasks.js';

