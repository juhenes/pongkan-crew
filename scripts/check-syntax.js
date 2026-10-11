// Offline syntax check for all JavaScript files; does not execute code or call Codex.
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const dirs = ['src', 'test', 'scripts'];
let checked = 0;

for (const dir of dirs) {
  for (const file of readdirSync(resolve(dir))) {
    if (file.endsWith('.js')) {
      execFileSync(process.execPath, ['--check', resolve(dir, file)], { stdio: 'inherit' });
      checked++;
    }
  }
}

console.log(`Syntax check passed: ${checked} JavaScript files verified.`);
