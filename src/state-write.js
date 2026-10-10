import { renameSync } from 'node:fs';
const waitBuffer = new Int32Array(new SharedArrayBuffer(4));

// Windows may briefly hold the destination open. Keep atomic replacement;
// never delete the existing state as a workaround for a rename failure.
export function replaceStateFile(source, target, { rename = renameSync, platform = process.platform,
  pause = ms => Atomics.wait(waitBuffer, 0, 0, ms) } = {}) {
  for (let attempt = 0; ; attempt++) {
    try { rename(source, target); return; }
    catch (error) {
      if (platform !== 'win32' || !['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt >= 5) throw error;
      pause(10 * 2 ** attempt);
    }
  }
}
