import { analysePrompt, generatePrompt } from './rules.js';
import { getPersonalisationFields } from './guidance.js';
import { validateInput } from './validation.js';

export const WORKFLOW_MODES = { 'local-rules': { tag: 'Local draft', pill: 'Local rules' } };

/** Fingerprint all diagnostic inputs, independent of object insertion order. */
export function analysisFingerprint(input) {
  const ordered = values => Object.fromEntries(Object.entries(values || {}).sort(([a], [b]) => a.localeCompare(b)));
  return JSON.stringify([input.taskId, input.original, ordered(input.details), ordered(input.preferences)]);
}

export class WorkflowValidationError extends Error {
  constructor(fields) {
    super('Review the highlighted fields before continuing.');
    this.name = 'WorkflowValidationError';
    this.fields = fields;
  }
}

function check(input, stage) {
  const validation = validateInput(input, { stage });
  if (!validation.valid) throw new WorkflowValidationError(validation.fields);
  return validation;
}

/** Local adapter. The UI may await it so a future server adapter can use this boundary. */
export function analyseWorkflow(input) {
  const validation = check(input, 'analysis');
  const criteria = analysePrompt(input);
  return {
    mode: 'local-rules', inputFingerprint: analysisFingerprint(input), criteria,
    fields: getPersonalisationFields(input, criteria),
    warnings: validation.warnings
  };
}

/** Returns an assembled local draft, never a simulated AI rewrite. */
export function improveWorkflow(input) {
  const validation = check(input, 'generation');
  const criteria = analysePrompt(input);
  const source = criteria.find(row => row.key === 'source');
  const warnings = [...validation.warnings];
  if (source && ['Missing', 'Partial'].includes(source.status)) warnings.push(source.suggestion || source.reason);
  return { mode: 'local-rules', improvedPrompt: generatePrompt(input), warnings };
}
