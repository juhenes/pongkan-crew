import { clean, wrapText } from './markdown.js';

export const isRoleHeading = text => /^(RESPONSIBILITIES|RULES AND CHECKS|COLLABORATION|HANDOFF)$/.test(text);

export function spacedRoleText(role) {
  return clean(role).split('\n').map(line => {
    const section = line.match(/^(Responsibilities|Rules and checks|Collaboration|Handoff):\s*(.*)$/i);
    return section ? `\n${section[1].toUpperCase()}\n${section[2]}` : line;
  }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function roleRows(role, width) {
  return spacedRoleText(role).split('\n').flatMap((line, index) => {
    const heading = index === 0 || isRoleHeading(line);
    return wrapText(line, width).map(text => ({ text, tone: heading ? 'heading' : 'body' }));
  });
}
