import { TASKS } from './tasks.js';
import { analysePrompt } from './rules.js';

const criterionForField = {
  context: 'context', purpose: 'context', focus: 'specificity',
  currentKnowledge: 'context', language: 'context', goal: 'specificity',
  actual: 'specificity', criteria: 'constraints', draft: 'source',
  preserve: 'constraints', topic: 'specificity', targetLength: 'constraints',
  duration: 'constraints', source: 'source', code: 'source',
  speakerNotes: 'format', constraints: 'constraints'
};

/** Prioritise task questions without turning every missing criterion into a required field. */
export function getPersonalisationFields(input, criteria = analysePrompt(input)) {
  const task = TASKS.find(item => item.id === input.taskId);
  if (!task) throw new RangeError('Choose a known task before requesting guidance.');
  const byKey = new Map(criteria.map(row => [row.key, row]));
  // Others is described on Home. Keep its value in details.taskDescription;
  // do not ask the same question again during personalisation.
  const fields = task.fields.filter(field => field.key !== 'taskDescription');
  if (task.id === 'study' && byKey.get('source')?.status !== 'N/A') {
    fields.push({ key: 'source', label: 'Relevant source material', placeholder: 'Paste the notes or text this request depends on.', multiline: true });
  }
  fields.push({ key: 'constraints', label: 'Other requirements or limits', placeholder: 'Optional: use only supplied material, a word limit, or another real requirement' });

  return fields.map(field => {
    const criterion = criterionForField[field.key];
    const row = byKey.get(criterion);
    return {
      ...field, criterion, required: false,
      priority: row && ['Missing', 'Partial'].includes(row.status) ? 'recommended' : 'optional',
      guidance: row?.suggestion || row?.reason || ''
    };
  });
}
