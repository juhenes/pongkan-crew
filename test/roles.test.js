import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Crew } from '../src/crew.js';
import { execute } from '../src/commands.js';
import { validateState } from '../src/state.js';
import { validatePlan } from '../src/workflows.js';
import { screen } from '../src/ui.js';
import { completions } from '../src/controls.js';

function setup(t, runner = async () => {}) {
  const folder = mkdtempSync(join(tmpdir(), 'pongkan-roles-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  return new Crew(folder, { runner });
}
test('catalog previews specialist instructions and installs roles with explicit access', t => {
  const crew = setup(t);
  const app = { crew, selected: 'chief' };
  execute(app, '/roles list');
  assert.match(app.panel.lines.join('\n'), /database-dev/);
  execute(app, '/roles show seo-aeo-geo-specialist');
  assert.match(app.panel.lines.join('\n'), /structured data/i);
  execute(app, '/crew add search --role seo-aeo-geo-specialist');
  assert.equal(crew.member('search').writable, true);
  execute(app, '/crew role search --role security-reviewer');
  assert.match(crew.member('search').role, /security/i);
  assert.equal(crew.member('search').writable, false);
  assert.match(new Crew(crew.folder).member('search').role, /security/i);
  assert.throws(() => execute(app, '/crew add invalid --role missing'), /Unknown role/);
  assert.equal(
    crew.state.members.some(m => m.name === 'invalid'),
    false,
  );
});
test('expanded web crew supports database, issues, and search specialists with shared roster context', async t => {
  let captured;
  const crew = setup(t, async (args, prompt, event) => {
    captured = prompt;
    event({
      type: 'item.completed',
      item: { type: 'agent_message', text: 'Coordinate the schema contract with backend-dev.' },
    });
  });
  crew.presets.apply('web');
  assert.ok(crew.state.members.length > 6);
  for (const name of ['database-dev', 'version-control', 'seo-aeo-geo-specialist', 'security-reviewer'])
    crew.member(name);
  await crew.send('database-dev', 'Review the data model', { readOnly: true });
  assert.match(captured, /Team roster/);
  assert.match(captured, /backend-dev/);
  assert.match(captured, /Handoff/);
  assert.match(captured, /automatic messages/i);
  crew.presets.save('expanded');
  validateState(crew.state);
  assert.ok(new Crew(crew.folder).presets.get('expanded').members.length > 6);
  crew.queue.pause();
  const discussion = crew.discussions.start('Discuss responsibilities');
  assert.equal(discussion.taskIds.length, crew.state.members.length * 2 + 1);
  crew.discussions.stop();
});
test('catalog roles respect busy members and reviewer access; apply does not overwrite existing crew automatically', t => {
  const crew = setup(t);
  const app = { crew, selected: 'chief' };
  crew.presets.apply('web');
  assert.throws(() => execute(app, '/crew role qa-reviewer --role database-dev'), /read-only/);
  crew.running.set('backend-dev', new AbortController());
  assert.throws(() => execute(app, '/crew role backend-dev --role database-dev'), /Stop/);
  crew.running.clear();
  crew.member('backend-dev').role = 'My custom instructions';
  assert.equal(
    new Crew(crew.folder).member('backend-dev').role,
    crew.presets.get('web').members.find(m => m.name === 'backend-dev').role,
  );
  crew.save();
  assert.equal(new Crew(crew.folder).member('backend-dev').role, 'My custom instructions');
});
test('expanded workflows accept seven specialist steps while keeping a bounded plan', t => {
  const crew = setup(t);
  crew.presets.apply('web');
  const steps = [
    'architect',
    'ui-ux-designer',
    'database-dev',
    'backend-dev',
    'frontend-dev',
    'test-engineer',
    'version-control',
  ].map(member => ({ member, task: 'Complete assigned scope and provide verification and handoff.' }));
  assert.equal(
    validatePlan({ steps, reviewer: 'qa-reviewer' }, crew.state.members, crew.leadName, crew.reviewerName).steps.length,
    7,
  );
  assert.throws(
    () => validatePlan({ steps: [...steps, ...steps], reviewer: 'qa-reviewer' }, crew.state.members, crew.leadName),
    /Invalid/,
  );
});
test('role completion and expanded sidebar keep specialist selection and view controls visible', t => {
  assert.deepEqual(completions('/roles show database', []), ['/roles show database-dev']);
  assert.deepEqual(completions('/crew add data --role database', []), ['/crew add data --role database-dev']);
  const crew = setup(t);
  crew.presets.apply('web');
  const output = screen(crew, 'qa-reviewer', '', '', 120, 40);
  assert.match(output, /> Qa-reviewer/);
  assert.match(output, /F2: switch view/);
});
