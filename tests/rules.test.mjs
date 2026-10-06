import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS } from '../src/tasks.js';
import { analysePrompt, generatePrompt, CRITERIA } from '../src/rules.js';

const statuses = input => Object.fromEntries(analysePrompt(input).map(row => [row.key, row.status]));

test('all seven report criteria are returned for every task pathway', () => {
  for (const task of TASKS) {
    const rows = analysePrompt({ taskId: task.id, original: 'Help me understand this topic.' });
    assert.deepEqual(rows.map(row => row.key), CRITERIA.map(([key]) => key));
    assert.ok(rows.every(row => ['Present', 'Partial', 'Missing', 'N/A'].includes(row.status)));
  }
});

test('study example follows task-aware report statuses, with tone and depth absent', () => {
  const rows = analysePrompt({ taskId: 'study', original: 'Explain phishing.' });
  assert.equal(rows.length, 7);
  assert.deepEqual(statuses({ taskId: 'study', original: 'Explain phishing.' }), {
    clarity: 'Present', context: 'Partial', specificity: 'Partial', constraints: 'N/A',
    format: 'Missing', audience: 'Missing', source: 'N/A'
  });
  assert.ok(rows.every(row => !/tone|depth/i.test(row.label)));
});

test('summarisation needs supplied source and uses it when given', () => {
  const input = { taskId: 'summarisation', original: 'Summarise this article.' };
  assert.equal(statuses(input).source, 'Partial');
  assert.equal(statuses({ ...input, details: { source: 'The article argues that...' } }).source, 'Present');
  const output = generatePrompt(input);
  assert.match(output, /ask me to provide the source material/i);
  assert.doesNotMatch(output, /The article argues/);
});

test('coding debugging asks for missing code and includes supplied details', () => {
  const input = { taskId: 'coding', original: 'Help me debug my function.' };
  assert.equal(statuses(input).source, 'Missing');
  const details = { language: 'JavaScript', code: 'function add(a,b) { return a-b; }', goal: 'Add two numbers', actual: 'It subtracts' };
  assert.equal(statuses({ ...input, details }).source, 'Present');
  const output = generatePrompt({ ...input, details });
  assert.match(output, /JavaScript/);
  assert.match(output, /function add/);
  assert.match(output, /Explain the reasoning/);
});

test('report feedback uses draft and preserves student ownership guidance', () => {
  const input = { taskId: 'report', original: 'Review my report draft.' };
  assert.equal(statuses(input).source, 'Missing');
  assert.equal(statuses({ ...input, details: { draft: 'My introduction...' } }).source, 'Present');
  assert.match(generatePrompt({ ...input, details: { draft: 'My introduction...' } }), /preserving my ownership/);
});

test('presentation and other branches generate usable prompts without invented facts', () => {
  const presentation = generatePrompt({ taskId: 'presentation', original: 'Plan a short talk.', details: { topic: 'Cyber safety', duration: 'Five minutes' } });
  assert.match(presentation, /Cyber safety/);
  assert.match(presentation, /Five minutes/);
  assert.match(presentation, /Flag claims I should verify/);
  const other = generatePrompt({ taskId: 'other', original: 'Create interview questions.', details: { taskDescription: 'Student research project' } });
  assert.match(other, /Student research project/);
  assert.doesNotMatch(other, /Copilot|ChatGPT/);
});

test('optional preferences alter the draft but are not universal criteria', () => {
  const input = { taskId: 'study', original: 'Explain phishing.', preferences: { level: 'Undergraduate', depth: 'Moderate', tone: 'Academic', format: 'Bullet points' } };
  const output = generatePrompt(input);
  assert.match(output, /Learning level: Undergraduate/);
  assert.match(output, /Response depth: Moderate/);
  assert.match(output, /Tone: Academic/);
  assert.match(output, /Output format: Bullet points/);
  assert.equal(statuses(input).format, 'Present');
  assert.equal(statuses(input).audience, 'Present');
});

test('an unspecified Other format does not count as an output format', () => {
  const base = { taskId: 'study', original: 'Explain phishing.' };
  assert.equal(statuses({ ...base, preferences: { format: 'Other' } }).format, 'Missing');
  assert.equal(statuses({ ...base, preferences: { format: 'Other', otherFormat: 'Two-column comparison' } }).format, 'Present');
});
