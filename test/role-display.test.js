import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roleRows, spacedRoleText } from '../src/role-display.js';
import { ROLES } from '../src/roles.js';
import { cellWidth } from '../src/markdown.js';

test('all catalog descriptions separate headings and paragraphs without losing instructions', () => {
  for (const role of Object.values(ROLES)) {
    for (const width of [24, 72, 92]) {
      const rows = roleRows(role.role, width);
      const heading = rows.findIndex(r => r.text === 'RESPONSIBILITIES');
      assert.ok(heading > 0);
      assert.equal(rows[heading - 1].text, '');
      assert.equal(rows[heading].tone, 'heading');
      assert.ok(rows.some(r => r.text === 'HANDOFF'));
      assert.ok(rows.every(r => cellWidth(r.text) <= width));
    }
    assert.match(spacedRoleText(role.role), /\n\nRULES AND CHECKS\n/);
  }
});
test('custom role paragraphs remain readable and terminal escape codes are stripped', () => {
  const rows = roleRows('My role\n\nKeep this paragraph.\n\x1b[31mAnother instruction.', 40);
  assert.match(rows.map(r => r.text).join('\n'), /Keep this paragraph/);
  assert.doesNotMatch(rows.map(r => r.text).join('\n'), /\x1b/);
});
