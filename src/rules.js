import { getTask } from './tasks.js';

export const CRITERIA = [
  ['clarity', 'Clarity'],
  ['context', 'Context'],
  ['specificity', 'Specificity'],
  ['constraints', 'Constraints'],
  ['format', 'Output format'],
  ['audience', 'Audience / level'],
  ['source', 'Input / source material']
];

const clean = value => String(value || '').trim();
const words = value => clean(value).match(/\b[\p{L}\p{N}]+\b/gu) || [];
const anyValue = (details, keys) => keys.some(key => clean(details[key]));
const has = (value, pattern) => pattern.test(clean(value));
const taskVerb = /\b(explain|summari[sz]e|analyse|analyze|compare|critique|review|outline|draft|plan|debug|fix|write|create|generate|describe|teach|help|show|list|prepare|improve|translate|evaluate|check|identify|discuss|give|provide)\b/i;
const vague = /^(help me|make this better|do this|tell me about|i need help)\.?$/i;
const formatPattern = /\b(bullet(?: points)?|table|paragraph|outline|steps?|list|cards?|slides?|headings?|code block|json|markdown)\b/i;
const audiencePattern = /\b(first.year|undergraduate|postgraduate|student|classmates|tutor|lecturer|educator|beginner|expert|non.technical|audience|year \d|course level)\b/i;
const contextPattern = /\b(for my|in my|for a|in a|course|unit|assignment|assessment|tutorial|lecture|project|majoring|studying|preparing for)\b/i;
const constraintPattern = /\b(only|avoid|without|under|at most|at least|maximum|minimum|limit|words?|minutes?|slides?|must|do not|don't|using only|australian english)\b/i;
const specificityPattern = /\b(focus on|include|cover|especially|with examples?|such as|for example|key message|expected|actual|error|warning signs|main arguments)\b/i;
const sourceReferencePattern = /\b(this (text|article|source|code|draft)|attached|below|provided (text|material|code)|these notes)\b/i;

function sourceNeeded(taskId, prompt, details) {
  if (taskId === 'summarisation') return true;
  if (taskId === 'coding') return has(prompt, /\b(debug|fix|error|bug|this code|my code|function|script)\b/i) || anyValue(details, ['actual', 'code']);
  if (taskId === 'report') return has(prompt, /\b(review|feedback|edit|revise|critique|improve my|my draft)\b/i) || anyValue(details, ['draft']);
  if (taskId === 'presentation' || taskId === 'other') return has(prompt, /\b(summari[sz]e|review|based on|using these|from this)\b/i);
  return false;
}

function sourceProvided(taskId, prompt, details) {
  if (anyValue(details, taskId === 'coding' ? ['code'] : taskId === 'report' ? ['draft', 'source'] : ['source'])) return true;
  return clean(prompt).includes('\n') && words(prompt).length > 35;
}

function result(key, status, reason, suggestion = '') {
  return { key, label: CRITERIA.find(([id]) => id === key)[1], status, reason, suggestion };
}

/** Explainable, task-aware guidance. It does not infer meaning with an AI model. */
export function analysePrompt({ taskId, original, details = {}, preferences = {} }) {
  const task = getTask(taskId);
  const prompt = clean(original);
  const count = words(prompt).length;
  const results = [];

  if (has(prompt, taskVerb) && !has(prompt, vague)) {
    results.push(result('clarity', 'Present', 'A requested action is visible in your prompt.'));
  } else if (prompt) {
    results.push(result('clarity', 'Partial', 'The intended action may need clearer wording.', 'Start with a direct action such as explain, summarise, debug, or outline.'));
  } else {
    results.push(result('clarity', 'Missing', 'No request was entered.', 'Describe what you want the tool to do.'));
  }

  if (anyValue(details, ['context', 'purpose', 'topic', 'taskDescription']) || has(prompt, contextPattern)) {
    results.push(result('context', 'Present', 'You supplied background or a situation for this task.'));
  } else if (count > 1) {
    results.push(result('context', 'Partial', 'A topic is visible, but your course or purpose is not clear.', `Add the context that matters for ${task.label.toLowerCase()}.`));
  } else {
    results.push(result('context', 'Missing', 'There is not enough background to place the request.', 'Add a topic, purpose, or course context.'));
  }

  if (anyValue(details, ['focus', 'goal', 'actual', 'criteria', 'topic', 'taskDescription']) || has(prompt, specificityPattern) || count >= 18) {
    results.push(result('specificity', 'Present', 'You included a focus, expected outcome, or task detail.'));
  } else if (count >= 3 || has(prompt, taskVerb)) {
    results.push(result('specificity', 'Partial', 'The request could use a more precise focus.', 'Name the aspect, outcome, example, or question that matters most.'));
  } else {
    results.push(result('specificity', 'Missing', 'No task-specific detail is visible.', 'Add the key topic or expected outcome.'));
  }

  const constraintsActive = ['summarisation', 'report', 'presentation'].includes(taskId) || anyValue(details, ['constraints', 'targetLength', 'duration']) || has(prompt, constraintPattern);
  if (!constraintsActive) {
    results.push(result('constraints', 'N/A', 'A limit is not necessary for this request. Add one only if it matters.'));
  } else if (anyValue(details, ['constraints', 'targetLength', 'duration']) || has(prompt, constraintPattern)) {
    results.push(result('constraints', 'Present', 'A relevant boundary or length is visible.'));
  } else {
    results.push(result('constraints', 'Missing', 'A useful boundary has not been supplied.', 'Add a word limit, duration, required sections, or other real requirement if known.'));
  }

  if ((preferences.format === 'Other' && clean(preferences.otherFormat)) || (preferences.format && preferences.format !== 'Other') || has(prompt, formatPattern)) {
    results.push(result('format', 'Present', 'A response structure is specified.'));
  } else {
    results.push(result('format', 'Missing', 'The response structure is not specified.', 'Choose a useful format such as bullet points, a table, or an outline.'));
  }

  if (clean(preferences.level) || clean(preferences.audience) || has(prompt, audiencePattern)) {
    results.push(result('audience', 'Present', 'An audience or learning level is visible.'));
  } else {
    results.push(result('audience', 'Missing', 'The intended audience or level is not specified.', 'Say who the response is for or what level of explanation you need.'));
  }

  if (!sourceNeeded(taskId, prompt, details)) {
    results.push(result('source', 'N/A', 'This request does not clearly depend on supplied material.'));
  } else if (sourceProvided(taskId, prompt, details)) {
    results.push(result('source', 'Present', 'Relevant input material is supplied.'));
  } else if (has(prompt, sourceReferencePattern)) {
    results.push(result('source', 'Partial', 'The prompt refers to material but it is not included.', 'Paste the source, code, or draft before using the improved prompt.'));
  } else {
    const noun = taskId === 'coding' ? 'code or error details' : taskId === 'report' ? 'draft' : 'source material';
    results.push(result('source', 'Missing', `The ${noun} needed for this task is not supplied.`, `Add the ${noun} or ask the tool to request it first.`));
  }

  return results;
}

const add = (lines, label, value) => { if (clean(value)) lines.push(`${label}: ${clean(value)}`); };

/** Compose only user-provided facts plus explicit task guidance and missing-input prompts. */
export function generatePrompt({ taskId, original, details = {}, preferences = {} }) {
  const task = getTask(taskId);
  const lines = [clean(original)];
  if (taskId === 'other') add(lines, 'Academic task', details.taskDescription);
  add(lines, 'Context', details.context);
  add(lines, 'Focus', details.focus);
  add(lines, 'Current knowledge', details.currentKnowledge);
  add(lines, 'Goal or expected behaviour', details.goal);
  add(lines, 'Actual behaviour or error', details.actual);
  add(lines, 'Language or framework', details.language);
  add(lines, 'Report purpose', details.purpose);
  add(lines, 'Assessment criteria or required sections', details.criteria);
  add(lines, 'Keep or preserve', details.preserve);
  add(lines, 'Topic and key message', details.topic);
  add(lines, 'Target length', details.targetLength);
  add(lines, 'Duration or slide count', details.duration);
  add(lines, 'Speaker notes', details.speakerNotes);
  add(lines, 'Other requirements', details.constraints);
  add(lines, 'Learning level', preferences.level);
  add(lines, 'Intended audience', preferences.audience);
  add(lines, 'Response depth', preferences.depth);
  add(lines, 'Tone', preferences.tone);
  add(lines, 'Output format', preferences.format === 'Other' ? preferences.otherFormat : preferences.format);

  if (clean(details.source)) add(lines, 'Source material', details.source);
  if (clean(details.code)) add(lines, 'Relevant code', details.code);
  if (clean(details.draft)) add(lines, 'My draft or notes', details.draft);

  if (taskId === 'summarisation') {
    lines.push(clean(details.source) ? 'Use the supplied source. Distinguish its claims from any outside knowledge.' : 'Ask me to provide the source material before summarising. Do not invent a source.');
  } else if (taskId === 'coding') {
    lines.push('Explain the reasoning behind any suggested code changes. If essential code or error details are missing, ask for them first.');
  } else if (taskId === 'report') {
    lines.push('Support my planning or revision while preserving my ownership of the report. Flag claims or references I should verify.');
  } else if (taskId === 'presentation') {
    lines.push('Give me a structure I can substantiate and refine. Flag claims I should verify.');
  } else if (taskId === 'study') {
    lines.push('Help me understand the topic and check any factual claims I should verify.');
  }

  const output = lines.filter(Boolean).join('\n\n');
  return output || `Describe the ${task.label.toLowerCase()} task and the help you need.`;
}
