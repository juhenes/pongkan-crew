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

export function modelCatalogLines(catalog, target) {
  return ['From the installed Codex model cache; availability may have changed.',
    'Enter one example command at a time. Changes affect future tasks.',
    `One teammate = ${target} (currently selected); all = your current crew.`, '',
    ...(catalog.length ? catalog.flatMap(choice => {
      const effort = choice.efforts.includes('medium') ? 'medium' : choice.efforts[0];
      const selection = choice.id + (effort ? ` ${effort}` : '');
      return [choice.id, ...(choice.name !== choice.id ? [`  ${choice.name}`] : []),
        `  Efforts: ${choice.efforts.join(', ') || 'Codex default'}`,
        `  All teammates: /model set all ${selection}`,
        `  One teammate: /model set ${target} ${selection}`, ''];
    }) : ['No readable model cache. Open the Codex CLI to refresh it, or enter a provider model ID.', '']),
    'RESET TO CODEX DEFAULTS', `/model reset ${target}`, '/model reset all'];
}

export function validateModelChoice(model, effort, catalog = readModelCatalog()) {
  if (typeof model !== 'string' || !MODEL_ID.test(model)) throw new Error('Enter a valid model ID from /model list or your provider.');
  if (effort !== undefined && !EFFORTS.has(effort)) throw new Error('Invalid reasoning effort. Use /model list to check supported efforts.');
  const known = catalog.find(choice => choice.id === model);
  if (effort && known?.efforts.length && !known.efforts.includes(effort)) {
    throw new Error(`${model} supports these reasoning efforts: ${known.efforts.join(', ')}.`);
  }
}
