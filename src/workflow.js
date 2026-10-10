import { analysePrompt, generatePrompt } from './rules.js';
import { getPersonalisationFields } from './guidance.js';
import { validateInput } from './validation.js';

export const CRITERION_STATUS = {
  Present: { cls: 'present', icon: '✓' },
  Partial: { cls: 'partial', icon: '◐' },
  Missing: { cls: 'missing', icon: '!' },
  'N/A': { cls: 'na', icon: '–', spoken: 'not applicable' }
};

// Public mode descriptions travel with the adapter, so the UI cannot mislabel a future AI result.
export const WORKFLOW_MODES = {
  openai: {
    tag: 'AI rewrite', pill: 'OpenAI review',
    notes: {
      analysis: {
        title: 'AI-assisted review.',
        summary: 'OpenAI reviewed your original prompt using PromptWise’s seven task-aware criteria.',
        disclosure: 'How this review works',
        details: [
          'The criteria come from the project’s research-informed framework. The AI applies them and can make mistakes; the results are not a validated measure of prompt quality.',
          'Each finding explains its judgement and suggests useful information. Not every criterion applies to every task.',
          'Your original prompt and custom task description were sent through the PromptWise server to OpenAI. Later personalisation details do not alter this first diagnosis.'
        ]
      },
      compare: {
        title: 'AI-assisted rewrite.',
        summary: 'OpenAI rewrote your prompt using your supplied details and optional preferences.',
        disclosure: 'How this rewrite works',
        details: [
          'Your prompt, details and accepted source text were sent through the PromptWise server to OpenAI. Original files, pictures and video were not sent.',
          'The rewrite may miss details or introduce errors. Check that it preserves your intent, facts and assessment requirements, then edit it before copying.',
          'PromptWise does not submit this prompt to another tool or complete the academic task. API requests use store: false; this does not guarantee zero provider retention.'
        ]
      }
    }
  },
  'local-rules': {
    tag: 'Local draft', pill: 'Local rules',
    notes: {
      analysis: {
        title: 'Local rules review.',
        summary: 'PromptWise checks visible wording and supplied details against seven task-aware criteria. It does not use AI.',
        disclosure: 'How this review works',
        details: [
          'Each status shows whether matching wording or filled-in details were found. The checks cannot judge what your prompt means.',
          'A Present source only shows that text was supplied; it cannot confirm the material is complete or relevant.',
          'The review runs in this browser. Nothing you type is sent to an AI service.'
        ]
      },
      compare: {
        title: 'Locally assembled draft.',
        summary: 'PromptWise combined your prompt with the details you supplied. It does not use AI.',
        disclosure: 'How this draft works',
        details: [
          'The draft is not an AI rewrite and has not been checked for accuracy.',
          'It contains your words, the details you supplied and fixed wording for this task, such as asking the AI to flag claims to verify or to request missing material.',
          'Nothing was sent to an AI service. Review and edit the draft before copying it.'
        ]
      }
    }
  }
};

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
