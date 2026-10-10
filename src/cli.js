#!/usr/bin/env node
import { resolve } from 'node:path';
import { emitKeypressEvents } from 'node:readline';

import { Crew } from './crew.js';
import { screen } from './ui.js';
import { execute, cycle, HELP } from './commands.js';
import { acquireLock, checkRuntime } from './runtime.js';
import { completions } from './controls.js';
import { layoutInput } from './input.js';
import { MOUSE_OFF, scrollView } from './scroll.js';


const args = process.argv.slice(2);
const help = `Pongkan Crew — folder-specific Codex teammates
Usage: node src/cli.js [--folder <path>] [--preview|--doctor]
Requires Node 22+ and a signed-in Codex CLI. Defaults to current folder.
State: <folder>/.pongkan-crew/state.json. --preview does not call Codex.`;

async function main() {
  if (args.includes('--help') || args.includes('-h')) { console.log(help + '\n\n' + HELP.join('\n')); return; }
  let folder = process.cwd(), preview = false, doctor = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--folder' && args[i + 1]) folder = resolve(args[++i]);
    else if (args[i] === '--preview') preview = true;
    else if (args[i] === '--doctor') doctor = true;
    else throw new Error(`Unknown or incomplete option: ${args[i]}\n${help}`);
  }
  if (!preview && !doctor && (!process.stdin.isTTY || !process.stdout.isTTY)) throw new Error('Open this app in an interactive terminal, or use --preview.');
  const release = acquireLock(folder);
  process.once('exit', release);
  let crew;
  try { crew = new Crew(folder); }
  catch (error) { release(); throw error; }
  const app = { crew, selected: crew.state.members[0].name, notice: '', scroll: 0, panel: null, view: 'chat', activityScroll: 0 };
  let input = [], cursor = 0, closing = false;
  const history = [];
  let historyIndex = 0, draft = '';
  if (preview) { console.log(screen(crew, app.selected, '', 'Preview — no agents running')); release(); return; }
  console.log('Checking Codex, login, folder access and saved state...');
  const diagnostics = await checkRuntime();
  if (doctor || !diagnostics.ok) {
    console.log([...diagnostics.lines, `Folder: ${crew.folder}`, 'Folder lock and saved state: OK'].join('\n'));
    release();
    if (!diagnostics.ok) process.exitCode = 1;
    return;
  }
  if (crew.queue.paused) app.notice = 'Saved tasks are paused. /queue list to inspect; /queue resume to continue.';
  const render = () => {
    if (closing) return;
    const columns = process.stdout.columns || 100, rows = process.stdout.rows || 30;
    const width = Math.max(30, columns - 1);
    const promptLabel = app.view === 'activity' ? 'activity' : app.view === 'group' ? 'crew' : app.selected;
    const composer = layoutInput(input.join(''), cursor, promptLabel, width, Math.max(1, Math.min(5, Math.floor(rows / 5))));
    const content = screen(crew, app.selected, input.join(''), app.notice, columns, rows, app.scroll, app.panel,
      { color: !('NO_COLOR' in process.env) && process.env.TERM !== 'dumb', view: app.view, activityScroll: app.activityScroll, composer });
    const inputRow = content.split('\n').length - composer.lines.length - 2 + composer.cursorRow;
    const inputColumn = composer.cursorColumn + 1;
    process.stdout.write('\x1b[?25l\x1b[H\x1b[2J' + content + `\x1b[${inputRow};${inputColumn}H\x1b[?25h`);
  };
  app.send = (name, text) => {
    const task = crew.queue.enqueue(name, text);
    app.notice = `Task ${task.id}: ${task.status}${crew.queue.paused ? '; /queue resume to start' : ''}`;
  };
  let ticker;
  app.quit = async () => {
    if (closing) return;
    closing = true;
    clearInterval(ticker);
    process.stdin.setRawMode(false); process.stdin.pause();
    process.stdout.write(MOUSE_OFF + '\x1b[?25h\x1b[?1049l');
    try { await crew.close(); } finally { release(); }
  };
  const setInput = text => { input = Array.from(text); cursor = input.length; };
  const dispatch = line => {
    const result = execute(app, line);
    if (result?.then) void result.catch(error => { app.notice = error.message; render(); });
  };
  process.stdout.write(MOUSE_OFF + '\x1b[?1049h');
  process.stdin.setRawMode(true);
  emitKeypressEvents(process.stdin);
  process.stdin.resume();
  process.stdin.on('keypress', (str, key = {}) => {
    try {
      if (key.ctrl && key.name === 'c') { void app.quit(); return; }
      if (key.name === 'f1' || (str === '?' && input.length === 0)) dispatch('/help');
      else if (key.name === 'f2') dispatch(key.shift ? '/switch prev' : '/switch');
      else if (key.name === 'escape') { if (app.panel) app.panel = null; else if (app.view === 'activity' || app.view === 'group') dispatch('/chat'); else setInput(''); }
      else if (key.name === 'tab') {
        const text = input.join('');
        if (text.startsWith('/') || text.startsWith('@')) {
          const matches = completions(text, crew.state.members.map(m => m.name), Object.keys(crew.presets.list()));
          if (matches.length === 1) setInput(matches[0] + ' ');
          else if (matches.length) app.notice = matches.join(' | ');
          else app.notice = 'No completion. Use /help QUERY to search.';
        } else cycle(app, key.shift ? -1 : 1);
      } else if (key.name === 'up' || key.name === 'down') {
        const delta = key.name === 'up' ? -1 : 1;
        const inputLayout = layoutInput(input.join(''), cursor, app.view === 'activity' ? 'activity' : app.view === 'group' ? 'crew' : app.selected, Math.max(30, (process.stdout.columns || 100) - 1));
        if (app.panel) app.panel.offset = Math.max(0, app.panel.offset + delta);
        else if (inputLayout.totalRows > 1) cursor = delta < 0 ? inputLayout.up : inputLayout.down;
        else scrollView(app, -delta);
      } else if (key.name === 'pageup' || key.name === 'pagedown') {
        scrollView(app, key.name === 'pageup' ? 10 : -10);
      } else if (key.name === 'left') cursor = Math.max(0, cursor - 1);
      else if (key.name === 'right') cursor = Math.min(input.length, cursor + 1);
      else if (key.name === 'home') cursor = 0;
      else if (key.name === 'end') cursor = input.length;
      else if (key.name === 'return') {
        const line = input.join('').trim(); setInput('');
        if (line) {
          if (history.at(-1) !== line) history.push(line);
          if (history.length > 100) history.shift();
          historyIndex = history.length; draft = '';
          dispatch(line);
        }
      } else if (key.name === 'backspace') { if (cursor > 0) input.splice(--cursor, 1); }
      else if (key.name === 'delete') input.splice(cursor, 1);
      else if (key.ctrl && key.name === 'u') setInput('');
      else if (key.ctrl && key.name === 'w') {
        const before = input.slice(0, cursor).join('');
        const keep = Array.from(before.replace(/\s*\S+\s*$/, '')).length;
        input.splice(keep, cursor - keep); cursor = keep;
      } else if (key.ctrl && (key.name === 'p' || key.name === 'n')) {
        if (historyIndex === history.length) draft = input.join('');
        historyIndex = Math.max(0, Math.min(history.length, historyIndex + (key.name === 'p' ? -1 : 1)));
        setInput(historyIndex === history.length ? draft : history[historyIndex] || '');
      } else if (key.ctrl && key.name === 'k') dispatch('/stop');
      else if (key.ctrl && key.name === 'l') { /* redraw below */ }
      else if (!key.ctrl && !key.meta && str && !/[\x00-\x1f\x7f]/.test(str)) {
        const chars = Array.from(str); input.splice(cursor, 0, ...chars); cursor += chars.length;
      }
    } catch (error) { app.notice = error.message; }
    render();
  });
  crew.on('change', render);
  process.stdout.on('resize', render);
  process.on('SIGTERM', app.quit); process.on('SIGINT', app.quit);
  ticker = setInterval(() => { if (crew.running.size || app.panel?.getLines) render(); }, 1000);
  ticker.unref();
  render();
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
