import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const MODEL_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/;
export const EFFORTS = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']);

export function readModelCatalog(home = process.env.CODEX_HOME || join(homedir(), '.codex')) {
  try {
    const cache = JSON.parse(readFileSync(join(home, 'models_cache.json'), 'utf8'));
    return (Array.isArray(cache.models) ? cache.models : [])
      .filter(model => MODEL_ID.test(model?.slug || '') && model.visibility !== 'hide')
      .map(model => ({ id: model.slug, name: model.display_name || model.slug,
        efforts: (Array.isArray(model.supported_reasoning_levels) ? model.supported_reasoning_levels : [])
          .map(level => level.effort).filter(effort => EFFORTS.has(effort)) }));
  } catch { return []; }
}

export function modelLabel(member) {
  return `${member.model || 'Codex default (inherited)'} | effort: ${member.reasoningEffort || 'Codex default (inherited)'}`;
}

export function validateModelChoice(model, effort, catalog = readModelCatalog()) {
  if (typeof model !== 'string' || !MODEL_ID.test(model)) throw new Error('Enter a valid model ID from /model list or your provider.');
  if (effort !== undefined && !EFFORTS.has(effort)) throw new Error('Invalid reasoning effort. Use /model list to check supported efforts.');
  const known = catalog.find(choice => choice.id === model);
  if (effort && known?.efforts.length && !known.efforts.includes(effort)) {
    throw new Error(`${model} supports these reasoning efforts: ${known.efforts.join(', ')}.`);
  }
}
