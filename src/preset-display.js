import { wrapText, cellWidth } from './markdown.js';

export function presetListRows(presets, active, width) {
  const rows = [];
  const add = (text, tone = 'body') => rows.push(...wrapText(text, width).map(text => ({ text, tone })));
  const field = (label, value, tone = 'body') => {
    const prefix = `${label}: `;
    const indent = ' '.repeat(cellWidth(prefix));
    wrapText(value, Math.max(2, width - cellWidth(prefix))).forEach((text, index) => {
      rows.push({ text: `${index ? indent : prefix}${text}`, tone });
    });
  };
  add(`Active crew: ${active || 'default / customized'}`, 'selected');
  add('Preview: /preset show NAME', 'muted');
  add('Use: /preset apply NAME', 'muted');
  add('');
  for (const [name, preset] of Object.entries(presets)) {
    add(`${name.toUpperCase()} · ${preset.title}${active === name ? ' · ACTIVE' : ''}`, 'heading');
    add(`${preset.members.length} teammates`, 'muted');
    field('Lead', preset.lead);
    field('Reviewer', preset.reviewer);
    field('Can edit', preset.members.filter(m => m.writable).map(m => m.name).join(', ') || 'None', 'assistant');
    field('Read-only', preset.members.filter(m => !m.writable).map(m => m.name).join(', ') || 'None', 'muted');
    add('');
    add('');
  }
  add('Applying archives your current crew. /undo restores it.', 'muted');
  return rows;
}
