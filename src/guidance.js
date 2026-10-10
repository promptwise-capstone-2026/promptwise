import { TASKS } from './tasks.js';
import { analysePrompt } from './rules.js';
import { MATERIAL_FIELDS } from './materials.js';

const criterionForField = {
  context: 'context', purpose: 'context', focus: 'specificity',
  currentKnowledge: 'context', language: 'context', goal: 'specificity',
  actual: 'specificity', criteria: 'constraints', draft: 'source',
  preserve: 'constraints', topic: 'specificity', targetLength: 'constraints',
  duration: 'constraints', source: 'source', code: 'source',
  speakerNotes: 'format', constraints: 'constraints'
};

const shortFields = new Set(['language', 'targetLength', 'duration']);

const fieldGuidance = {
  context: 'Add the subject, course or situation that explains why you need this response.',
  purpose: 'State the report question and what your report should achieve.',
  focus: 'Name the aspects or questions the response should concentrate on.',
  currentKnowledge: 'Share what you understand or find unclear if it would help tailor the explanation.',
  language: 'Name the programming language, framework or environment involved.',
  goal: 'Describe what the code should do when it works.',
  actual: 'Describe what happens instead, including the exact error if available.',
  criteria: 'Add the actual assessment requirements or sections the response must follow.',
  draft: 'Supply your own draft or notes if you want feedback on that material.',
  preserve: 'Identify arguments, wording or references you want to keep.',
  topic: 'State the presentation topic and the message the audience should take away.',
  targetLength: 'Give the requested summary length if you know it.',
  duration: 'Give the presentation time or slide limit if one applies.',
  source: 'Supply the relevant material this request depends on; a filename alone is insufficient.',
  code: 'Supply the relevant code if the request depends on an existing implementation.',
  speakerNotes: 'Describe the talking points or speaker notes you would find useful.',
  constraints: 'Add real limits or requirements; leave this blank if none apply.'
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
    const material = field.multiline && MATERIAL_FIELDS[field.key];
    const criterion = criterionForField[field.key];
    const row = byKey.get(criterion);
    const priority = field.key !== 'currentKnowledge' && row && ['Missing', 'Partial'].includes(row.status) ? 'recommended' : 'optional';
    return {
      ...field, criterion, required: false,
      inputKind: material ? 'material' : shortFields.has(field.key) ? 'short' : 'sentence',
      priority,
      placeholder: priority === 'recommended' ? field.placeholder?.replace(/^Optional:\s*/i, '') : field.placeholder,
      guidance: fieldGuidance[field.key] || row?.suggestion || row?.reason || '',
      ...(material ? { material } : {})
    };
  });
}
