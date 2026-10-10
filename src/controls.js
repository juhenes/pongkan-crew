import { HELP } from './commands.js';
import { ROLES } from './roles.js';

const COMMANDS = ['/help', '/questions', '/questions on', '/questions off', '/questions list', '/answer', '/chat', '/group', '/discuss', '/switch group', '/next', '/prev', '/task', '/send', '/handoff', '/retry', '/stop', '/clear', '/new',
  '/context', '/context on', '/context off', '/context status', '/status', '/model', '/model list', '/model set', '/model reset', '/activity', '/act', '/switch chat', '/switch activity', '/switch prev', '/folder', '/close', '/quit', '/exit', '/archives', '/undo', '/diff', '/changes', '/doctor', '/progress',
  '/crew list', '/crew add', '/crew remove', '/crew rename', '/crew role', '/crew access', '/crew info', '/crew chat',
  '/archives restore', '/queue list', '/queue pause', '/queue resume', '/queue cancel', '/queue move', '/queue retry', '/queue show',
  '/workflow list', '/workflow show', '/workflow cancel', '/workflow retry', '/preset list', '/preset show', '/preset apply', '/preset save', '/preset create', '/preset title', '/preset improve', '/preset delete', '/preset restore', '/roles list', '/roles show'];
export function completions(input, names, presetNames = ['default', 'web', 'mobile', 'social', 'content']) {
  if (input.startsWith('@')) return names.filter(n => n.startsWith(input.slice(1))).map(n => `@${n}`);
  const role = input.match(/^(\/roles show|\/crew (?:add|role) [a-z][a-z0-9-]* --role)\s+(\S*)$/);
  if (role) return Object.keys(ROLES).filter(n => n.startsWith(role[2])).map(n => `${role[1]} ${n}`);
  const preset = input.match(/^(\/preset (?:show|apply|title|delete))\s+(\S*)$/);
  if (preset) return presetNames.filter(n => n.startsWith(preset[2])).map(n => `${preset[1]} ${n}`);
  if (!input.startsWith('/')) return [];
  const modelTarget = input.match(/^(\/model (?:set|reset))\s+(\S*)$/);
  if (modelTarget) return [...names, 'all'].filter(name => name.startsWith(modelTarget[2])).map(name => `${modelTarget[1]} ${name}`);
  const match = input.match(/^(\/(?:chat|send|handoff|stop)|\/crew (?:remove|rename|role|access|info|chat))\s+(\S*)$/);
  if (match) return [...names, ...(match[1] === '/stop' ? ['all'] : [])].filter(n => n.startsWith(match[2])).map(n => `${match[1]} ${n}`);
  return COMMANDS.filter(command => command.startsWith(input));
}
export function helpSearch(query) {
  const needle = query.trim().toLowerCase();
  return HELP.filter(line => line.toLowerCase().includes(needle)).length ? HELP.filter(line => line.toLowerCase().includes(needle)) : ['No help matches. Try another search.'];
}
