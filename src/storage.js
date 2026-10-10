import { lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

// Fail closed on redirected metadata. This is not a sandbox against a process
// that can concurrently replace paths using the same OS account.
export function assertPrivateFile(file) {
  let stat;
  try { stat = lstatSync(file); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) throw new Error(`Unsafe crew state file: ${file}`);
}
export function stateDirectory(folder) {
  const directory = join(realpathSync(folder), '.pongkan-crew');
  let stat;
  try { stat = lstatSync(directory); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) throw new Error(`Unsafe crew state directory: ${directory}`);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (realpathSync(directory) !== directory) throw new Error(`Unsafe crew state directory: ${directory}`);
  return directory;
}
