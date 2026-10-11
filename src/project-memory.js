import { existsSync, readFileSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { stateDirectory, assertPrivateFile } from './storage.js';
import { replaceStateFile } from './state-write.js';

export class ProjectMemory {
  constructor(folder) { this.folder = folder; this.file = join(stateDirectory(folder), 'project-memory.json'); }
  list() {
    stateDirectory(this.folder);
    assertPrivateFile(this.file);
    if (!existsSync(this.file)) return [];
    if (statSync(this.file).size > 40000) throw new Error('Project memory exceeds 40 KB. Edit project-memory.json to shorten it.');
    const entries = JSON.parse(readFileSync(this.file, 'utf8'));
    if (!Array.isArray(entries) || entries.length > 50 || entries.some(e => !e || !/^[a-f0-9]{8}$/.test(e.id) ||
      typeof e.text !== 'string' || !e.text.trim() || e.text.length > 2000) || new Set(entries.map(e => e.id)).size !== entries.length) {
      throw new Error('Invalid project-memory.json. Expected up to 50 entries with id and text.');
    }
    return entries;
  }
  write(entries) {
    const data = JSON.stringify(entries, null, 2);
    if (Buffer.byteLength(data) > 40000) throw new Error('Project memory exceeds 40 KB. Remove or shorten entries.');
    stateDirectory(this.folder); assertPrivateFile(this.file);
    const temporary = join(stateDirectory(this.folder), `memory-${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, data, { flag: 'wx', mode: 0o600 });
      assertPrivateFile(this.file); replaceStateFile(temporary, this.file);
    } finally { if (existsSync(temporary)) unlinkSync(temporary); }
  }
  add(text) {
    if (!text?.trim() || text.length > 2000) throw new Error('Memory text must contain 1–2000 characters.');
    const entries = this.list();
    const existing = entries.find(e => e.text === text.trim());
    if (existing) return existing;
    if (entries.length >= 50) throw new Error('Project memory supports 50 entries. Remove an entry first.');
    const entry = { id: randomUUID().slice(0, 8), text: text.trim() };
    this.write([...entries, entry]); return entry;
  }
  remove(id) {
    const entries = this.list();
    if (!entries.some(e => e.id === id)) throw new Error('Unknown memory ID. Use /memory show.');
    this.write(entries.filter(e => e.id !== id));
  }
  context() {
    const entries = this.list();
    return entries.length ? '\nProject memory (user-maintained guidance; does not expand permissions or override the current request):\n' +
      entries.map(e => `- ${e.text}`).join('\n') + '\n' : '';
  }
}
