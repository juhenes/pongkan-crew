import { readdirSync, readFileSync, statSync, lstatSync, realpathSync } from 'node:fs';
import { join, relative, isAbsolute, sep } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const OMIT = new Set(['.git', '.pongkan-crew', 'node_modules', '.venv', 'venv', 'dist', 'build', 'target', '.next', '__pycache__']);
const MAX_FILE = 128 * 1024, MAX_TOTAL = 4 * 1024 * 1024, MAX_DIFF = 200000;
const sensitive = name => /^(?:\.env(?:\..*)?|\.npmrc|\.pypirc|credentials(?:\.json)?|id_rsa|id_ed25519)$/i.test(name) || /\.(?:pem|key|p12|pfx)$/i.test(name) || ['.aws', '.ssh', '.codex', '.agents'].includes(name.toLowerCase());
function textFile(file) {
  if (lstatSync(file).isSymbolicLink() || statSync(file).size > MAX_FILE) return null;
  const data = readFileSync(file);
  if (data.includes(0)) return null;
  return data.toString('utf8');
}
export function captureWorkspace(folder) {
  const files = Object.create(null), skipped = [];
  let total = 0, count = 0, scanned = 0;
  const visit = (directory, depth = 0) => {
    if (depth > 20 || scanned > 10000) { skipped.push('Traversal limit'); return; }
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); }
    catch { skipped.push(relative(folder, directory)); return; }
    for (const entry of entries) {
      if (++scanned > 10000) { skipped.push('Traversal limit'); break; }
      if (OMIT.has(entry.name) || sensitive(entry.name) || entry.isSymbolicLink()) continue;
      const file = join(directory, entry.name);
      const name = relative(folder, file).split(sep).join('/');
      if (entry.isDirectory()) visit(file, depth + 1);
      else if (entry.isFile()) {
        if (count >= 1000 || total >= MAX_TOTAL) { skipped.push(name); continue; }
        try {
          const text = textFile(file);
          if (text === null || total + Buffer.byteLength(text) > MAX_TOTAL) { skipped.push(name); continue; }
          files[name] = text; total += Buffer.byteLength(text); count++;
        } catch { skipped.push(name); }
      }
    }
  };
  visit(folder);
  return { files, skipped };
}
function lines(text) { const result = text.split('\n'); if (result.at(-1) === '') result.pop(); return result; }
function patch(name, before, after) {
  const old = before === undefined ? [] : lines(before), fresh = after === undefined ? [] : lines(after);
  const label = JSON.stringify(name);
  return [`diff --pongkan ${label}`, `--- ${before === undefined ? '/dev/null' : label}`, `+++ ${after === undefined ? '/dev/null' : label}`,
    `@@ -${old.length ? 1 : 0},${old.length} +${fresh.length ? 1 : 0},${fresh.length} @@`,
    ...old.map(line => '-' + line), ...fresh.map(line => '+' + line)].join('\n');
}
export function compareWorkspace(before, after) {
  const files = [], chunks = [];
  for (const name of new Set([...Object.keys(before.files), ...Object.keys(after.files)])) {
    if (before.files[name] === after.files[name]) continue;
    // A skipped/unreadable file is not evidence of deletion or creation.
    if (before.skipped.includes(name) || after.skipped.includes(name)) continue;
    files.push(name);
    chunks.push(patch(name, before.files[name], after.files[name]));
  }
  let text = chunks.join('\n\n');
  if (text.length > MAX_DIFF) text = text.slice(0, MAX_DIFF) + '\n[Diff truncated at 200,000 characters]';
  if (before.skipped.length || after.skipped.length) text += '\n[Snapshot excludes binary, large, unreadable, and skipped files; limits: 1,000 files, 128 KiB/file, 4 MiB total.]';
  return { files, text: text || 'No text changes captured.', at: Date.now() };
}
export async function gitDiff(folder) {
  const root = realpathSync(folder);
  const git = async args => (await exec('git', ['-c', `safe.directory=${root}`, '-C', root, ...args], {
    windowsHide: true, timeout: 10000, maxBuffer: 2 * 1024 * 1024,
  })).stdout;
  try { await git(['rev-parse', '--show-toplevel']); }
  catch (error) { throw new Error(`Git diff unavailable for this folder. Use /diff last after a writer task. ${error.code === 'ENOENT' ? 'Git is not installed.' : (error.stderr || error.message).trim()}`); }
  let tracked;
  try { await git(['rev-parse', '--verify', 'HEAD']); tracked = await git(['diff', '--no-ext-diff', '--no-textconv', '--no-color', 'HEAD', '--', '.']); }
  catch { tracked = await git(['diff', '--no-ext-diff', '--no-textconv', '--no-color', '--cached', '--', '.']) + await git(['diff', '--no-ext-diff', '--no-textconv', '--no-color', '--', '.']); }
  const names = (await git(['ls-files', '--others', '--exclude-standard', '-z', '--', '.'])).split('\0').filter(Boolean);
  const additions = [];
  for (const name of names.slice(0, 200)) {
    if (name.split('/').some(part => OMIT.has(part) || sensitive(part))) continue;
    const file = join(root, name);
    try {
      const rel = relative(root, realpathSync(file));
      if (isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep)) continue;
      const text = textFile(file);
      additions.push(text === null ? `[Untracked binary/large file: ${name}]` : patch(name, undefined, text));
    } catch { additions.push(`[Unreadable untracked file: ${name}]`); }
    if (additions.join('\n').length > MAX_DIFF) break;
  }
  const output = [tracked.trim(), ...additions].filter(Boolean).join('\n\n');
  return output.length > MAX_DIFF ? output.slice(0, MAX_DIFF) + '\n[Diff truncated at 200,000 characters]' : output || 'No repository changes.';
}
