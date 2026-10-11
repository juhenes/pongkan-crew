import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { codexExecutable } from './runtime.js';

export const MODEL_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/;
export const EFFORTS = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']);

export function readModelCatalog(home = process.env.CODEX_HOME || join(homedir(), '.codex')) {
  try {
    const cache = JSON.parse(readFileSync(join(home, 'models_cache.json'), 'utf8'));
    return (Array.isArray(cache.models) ? cache.models : [])
      .filter(model => MODEL_ID.test(model?.slug || '') && model.visibility !== 'hide')
      .map(model => ({
        id: model.slug,
        name: model.display_name || model.slug,
        efforts: (Array.isArray(model.supported_reasoning_levels) ? model.supported_reasoning_levels : [])
          .map(level => level.effort)
          .filter(effort => EFFORTS.has(effort)),
      }));
  } catch {
    return [];
  }
}

export function modelLabel(member, defaults = {}) {
  return `${member.model || (defaults.model ? `${defaults.model} (inherited)` : 'Codex default (unresolved)')} | effort: ${member.reasoningEffort || (defaults.reasoningEffort ? `${defaults.reasoningEffort} (inherited)` : 'Codex default (unresolved)')}`;
}

// Ask Codex to resolve its own config layers; never parse or display credentials.
// No thread or model turn is started by these read-only RPCs.
export function readModelDefaults(folder, { spawnProcess = spawn, timeoutMs = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(codexExecutable(), ['app-server'], {
      cwd: folder,
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = createInterface({ input: child.stdout });
    let done = false,
      config = {};
    const finish = (error, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      lines.close();
      child.stdin.destroy();
      child.kill();
      if (error) reject(new Error('Unable to resolve inherited model from Codex.'));
      else resolve(value);
    };
    const timer = setTimeout(() => finish(true), timeoutMs);
    const send = (id, method, params) =>
      child.stdin.write(JSON.stringify({ ...(id ? { id } : {}), method, params }) + '\n');
    child.on('error', () => finish(true));
    child.on('close', () => finish(true));
    child.stdin.on('error', () => finish(true));
    child.stderr.on('data', () => {});
    lines.on('line', line => {
      let response;
      try {
        response = JSON.parse(line);
      } catch {
        return;
      }
      if (done || ![1, 2, 3].includes(response.id)) return;
      if (response.error) return finish(true);
      if (response.id === 1) {
        send(null, 'initialized', {});
        send(2, 'config/read', { includeLayers: false, cwd: folder });
      } else if (response.id === 2) {
        config = response.result?.config || {};
        if (config.model && config.model_reasoning_effort) {
          finish(false, { model: config.model, reasoningEffort: config.model_reasoning_effort });
        } else send(3, 'model/list', { limit: 100, includeHidden: false });
      } else {
        const choices = response.result?.data || [];
        const choice = config.model ? choices.find(m => m.model === config.model) : choices.find(m => m.isDefault);
        finish(false, {
          model: config.model || choice?.model,
          reasoningEffort: config.model_reasoning_effort || choice?.defaultReasoningEffort,
        });
      }
    });
    send(1, 'initialize', { clientInfo: { name: 'pongkan_crew', version: '0.2.0' } });
  });
}

export function modelCatalogLines(catalog, target) {
  return [
    'From the installed Codex model cache; availability may have changed.',
    'Enter one example command at a time. Changes affect future tasks.',
    `One teammate = ${target} (currently selected); all = your current crew.`,
    '',
    ...(catalog.length
      ? catalog.flatMap(choice => {
          const effort = choice.efforts.includes('medium') ? 'medium' : choice.efforts[0];
          const selection = choice.id + (effort ? ` ${effort}` : '');
          return [
            choice.id,
            ...(choice.name !== choice.id ? [`  ${choice.name}`] : []),
            `  Efforts: ${choice.efforts.join(', ') || 'Codex default'}`,
            `  All teammates: /model set all ${selection}`,
            `  One teammate: /model set ${target} ${selection}`,
            '',
          ];
        })
      : ['No readable model cache. Open the Codex CLI to refresh it, or enter a provider model ID.', '']),
    'RESET TO CODEX DEFAULTS',
    `/model reset ${target}`,
    '/model reset all',
  ];
}

export function validateModelChoice(model, effort, catalog = readModelCatalog()) {
  if (typeof model !== 'string' || !MODEL_ID.test(model))
    throw new Error('Enter a valid model ID from /model list or your provider.');
  if (effort !== undefined && !EFFORTS.has(effort))
    throw new Error('Invalid reasoning effort. Use /model list to check supported efforts.');
  const known = catalog.find(choice => choice.id === model);
  if (effort && known?.efforts.length && !known.efforts.includes(effort)) {
    throw new Error(`${model} supports these reasoning efforts: ${known.efforts.join(', ')}.`);
  }
}
