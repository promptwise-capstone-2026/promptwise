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

const taskFieldGuidance = {
  summarisation: { context: 'Explain what you will use the summary for so its focus matches your purpose.' },
  study: { source: 'Supply the lecture slides, textbook extract or notes you want explained. Name the term, question, page or slide in your focus above.' },
  coding: { source: 'Supply the relevant documentation or lecture material. Put actual code in the separate code field.', criteria: 'Supply the problem specification, allowed tools or required tests if this is an assignment.' },
  report: { source: 'Supply the case study, readings or evidence the report should use. Put your own writing in the separate draft field.', criteria: 'Supply the assignment guide, rubric or template sections the report should follow.' },
  presentation: { source: 'Supply the evidence, notes or existing slide text the presentation should use.', criteria: 'Supply the presentation brief, marking criteria or required sections if available.' }
};

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
  examples: 'Choose examples, analogies or practice only if they help you learn. This is an optional preference, not a quality criterion.',
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
  fields.push({ key: 'constraints', label: 'Other requirements or limits', placeholder: 'Optional: use only supplied material, a word limit, or another real requirement' });

  return fields.map(field => {
    const material = field.multiline && MATERIAL_FIELDS[field.key];
    const criterion = criterionForField[field.key];
    const row = byKey.get(criterion);
    const debugging = /\b(debug|fix|error|bug|crash|not working|actual behaviour)\b/i.test(input.original || '');
    const revision = /\b(review|feedback|edit|revise|my draft|my report)\b/i.test(input.original || '');
    const relevant = !['currentKnowledge', 'examples', 'speakerNotes'].includes(field.key) && (field.key !== 'actual' || debugging) && (field.key !== 'preserve' || revision);
    const priority = relevant && row && ['Missing', 'Partial'].includes(row.status) ? 'recommended' : 'optional';
    return {
      ...field, criterion, required: false,
      inputKind: material ? 'material' : shortFields.has(field.key) ? 'short' : 'sentence',
      // Material availability is independent of whether the original diagnosis needs it.
      alwaysVisible: Boolean(material) && field.key !== 'criteria',
      priority,
      placeholder: priority === 'recommended' ? field.placeholder?.replace(/^Optional:\s*([a-z]?)/i, (_, initial) => initial.toUpperCase()) : field.placeholder,
      guidance: taskFieldGuidance[task.id]?.[field.key] || fieldGuidance[field.key] || row?.suggestion || row?.reason || '',
      ...(material ? { material } : {})
    };
  });
}
