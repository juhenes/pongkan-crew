import test from 'node:test';
import assert from 'node:assert/strict';
import { enableWindowsMouse } from '../src/windows-input.js';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { terminalInput } from '../src/scroll.js';

test('native Windows console reader forwards wheel reports and keyboard text', { skip: process.platform !== 'win32' }, () => {
  const output = execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File',
    fileURLToPath(new URL('../src/windows-input.ps1', import.meta.url)), '-SelfTest'],
  { windowsHide: true, encoding: 'utf8', timeout: 15000 });
  assert.equal(output[0], '\0');
  let text = '';
  const wheel = [];
  terminalInput(chunk => { text += chunk; }, delta => wheel.push(delta))(output.slice(1));
  assert.deepEqual(wheel, [3, -3]);
  assert.equal(text, '\t\x1bOQ\x1b[A\x7fhello\r');
});

test('Windows mouse setup enables VT input and restores original mode once', () => {
  const calls = [];
  const restore = enableWindowsMouse('win32', mode => { calls.push(mode); return 503; });
  assert.deepEqual(calls, [null]);
  restore(); restore();
  assert.deepEqual(calls, [null, 503]);
});

test('other platforms do not change Windows console settings', () => {
  enableWindowsMouse('linux', () => { throw new Error('unexpected Windows call'); })();
});
