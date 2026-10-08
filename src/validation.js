import { TASKS, FORMATS, LEVELS, TONES, DEPTHS } from './tasks.js';

// Prototype limit for a task label, not a report requirement or a semantic test.
export const CUSTOM_TASK_MAX_LENGTH = 240;
const stages = new Set(['task', 'analysis', 'generation']);
const placeholderTasks = new Set(['other', 'others', 'something', 'anything', 'test', 'testing', 'asdf', 'asdasd', 'qwerty', 'n/a']);
const text = value => typeof value === 'string' ? value.trim() : '';
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Basic form checks only. These checks cannot establish academic suitability. */
export function validateInput(input = {}, { stage = 'analysis' } = {}) {
  if (!stages.has(stage)) throw new RangeError(`Unknown workflow stage: ${stage}`);
  const fields = {};
  const warnings = [];
  if (!record(input)) return { valid: false, fields: { taskId: 'Choose an academic task.' }, warnings };
  const details = record(input.details) ? input.details : {};
  const preferences = record(input.preferences) ? input.preferences : {};
  if (input.details !== undefined && !record(input.details)) fields.details = 'Review the task details.';
  if (input.preferences !== undefined && !record(input.preferences)) fields.preferences = 'Review the response preferences.';
  for (const [key, value] of [...Object.entries(details), ...Object.entries(preferences)]) {
    if (typeof value !== 'string') fields[key] = 'Enter text for this field.';
  }
  for (const [key, options] of [['format', FORMATS], ['level', LEVELS], ['tone', TONES], ['depth', DEPTHS]]) {
    if (preferences[key] && !options.includes(preferences[key])) fields[key] = 'Choose one of the available options.';
  }

  if (!TASKS.some(task => task.id === input.taskId)) {
    fields.taskId = 'Choose an academic task.';
  } else if (input.taskId === 'other') {
    const description = text(details.taskDescription);
    const compact = description.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (!description) {
      fields.taskDescription = 'Describe the academic task you are working on.';
    } else if (description.length > CUSTOM_TASK_MAX_LENGTH) {
      fields.taskDescription = `Keep the task description within ${CUSTOM_TASK_MAX_LENGTH} characters.`;
    } else if (!/\p{L}/u.test(description) || placeholderTasks.has(description.toLowerCase()) || /^([\p{L}\p{N}])\1{3,}$/u.test(compact)) {
      fields.taskDescription = 'Describe a real task, such as preparing interview questions for a research project.';
    } else {
      // Accept short or unfamiliar descriptions rather than reject valid tasks
      // through an English-only action-word or academic-keyword whitelist.
      const tokens = description.match(/[\p{L}\p{N}]+/gu) || [];
      if (tokens.length === 1 && description.length < 12) {
        warnings.push('Add what you want to do with this topic if the task is still unclear.');
      }
    }
  }

  if (stage !== 'task' && !text(input.original)) {
    fields.original = 'Enter a prompt before analysing or improving it.';
  }
  if (stage === 'generation' && preferences.format === 'Other' && !text(preferences.otherFormat)) {
    fields.otherFormat = 'Describe the output format, or choose another format.';
  }
  return { valid: Object.keys(fields).length === 0, fields, warnings };
}
