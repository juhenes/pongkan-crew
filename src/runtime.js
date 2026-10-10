import { mkdirSync, openSync, closeSync, writeFileSync, readFileSync, unlinkSync, realpathSync, existsSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';

const exec = promisify(execFile);
export function codexExecutable() {
  if (process.env.PONGKAN_CODEX_BIN) return process.env.PONGKAN_CODEX_BIN;
  if (process.platform !== 'win32') return 'codex';
  const candidates = (process.env.PATH || '').split(delimiter).map(dir => join(dir.replace(/^"|"$/g, ''), 'codex.exe'));
  if (process.env.LOCALAPPDATA) candidates.push(join(process.env.LOCALAPPDATA, 'Programs/OpenAI/Codex/bin/codex.exe'));
  return candidates.find(path => existsSync(path)) || 'codex';
}
export async function probeCodex(args) {
  const { stdout, stderr } = await exec(codexExecutable(), args, { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
  return `${stdout}\n${stderr}`.trim();
}
export async function checkRuntime(probe = probeCodex) {
  const lines = [`Node: ${process.version}`];
  try { lines.push(`Codex: ${await probe(['--version'])}`); }
  catch (error) { return { ok: false, lines: [...lines, `Codex unavailable: ${error.message}`, 'Install Codex CLI or set PONGKAN_CODEX_BIN to its native executable.'] }; }
  try {
    const login = await probe(['login', 'status']);
    if (!/logged in/i.test(login) || /not logged in/i.test(login)) throw new Error(login || 'No login found');
    lines.push(`Login: ${login}`);
  } catch (error) { return { ok: false, lines: [...lines, `Login unavailable: ${error.message}`, 'Run codex login in your terminal, then restart.'] }; }
  return { ok: true, lines };
}

export function acquireLock(folder) {
  const directory = join(realpathSync(folder), '.pongkan-crew');
  mkdirSync(directory, { recursive: true });
  const file = join(directory, 'app.lock');
  const token = randomUUID();
  let fd;
  try { fd = openSync(file, 'wx'); }
  catch (error) {
    if (error.code !== 'EEXIST') throw new Error(`Cannot write folder state: ${error.message}`);
    let owner;
    try { owner = JSON.parse(readFileSync(file, 'utf8')); } catch { /* incomplete lock must remain protected */ }
    let alive = true;
    if (Number.isInteger(owner?.pid) && owner.pid > 0) {
      try { process.kill(owner.pid, 0); } catch (error) { alive = error.code !== 'ESRCH'; }
    }
    throw new Error(alive ? `Pongkan Crew is already open in this folder (PID ${owner?.pid || 'unknown'}). Close the other instance first.` :
      `Stale folder lock (PID ${owner.pid}). After checking the old app has stopped, delete only ${file} and restart. Saved conversations are intact.`);
  }
  try { writeFileSync(fd, JSON.stringify({ pid: process.pid, token, started: new Date().toISOString() })); }
  catch (error) { closeSync(fd); unlinkSync(file); throw error; }
  closeSync(fd);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    try { if (JSON.parse(readFileSync(file, 'utf8')).token === token) unlinkSync(file); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  };
}
