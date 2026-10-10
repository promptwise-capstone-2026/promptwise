import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLES, createExamplePicker } from '../src/examples.js';
import { TASKS } from '../src/tasks.js';
import { validateInput } from '../src/validation.js';
import { analyseWorkflow, improveWorkflow } from '../src/workflow.js';

test('practice scenarios cover all six tasks and fit the real intake and generation workflow', () => {
  assert.deepEqual(new Set(EXAMPLES.map(x => x.taskId)), new Set(TASKS.map(x => x.id)));
  assert.equal(new Set(EXAMPLES.map(x => x.id)).size, EXAMPLES.length);
  assert.equal(new Set(EXAMPLES.map(x => x.original)).size, EXAMPLES.length);
  for (const example of EXAMPLES) {
    assert.equal(validateInput(example, { stage: 'generation' }).valid, true, example.id);
    const diagnosis = analyseWorkflow({ taskId: example.taskId, original: example.original, details: example.taskId === 'other' ? { taskDescription: example.details.taskDescription } : {}, preferences: {} });
    const supported = new Set([...diagnosis.fields.map(x => x.key), 'taskDescription']);
    assert.ok(Object.keys(example.details).every(key => supported.has(key)), example.id);
    const draft = improveWorkflow(example);
    assert.ok(draft.improvedPrompt.trim(), example.id);
  }
});

test('example deck does not repeat within a cycle or at the cycle boundary and edits cannot mutate samples', () => {
  for (const random of [() => 0, () => .999999, Math.random]) {
    const next = createExamplePicker(random);
    const first = Array.from({ length: EXAMPLES.length }, next);
    assert.equal(new Set(first.map(x => x.id)).size, EXAMPLES.length);
    const second = Array.from({ length: EXAMPLES.length }, next);
    assert.equal(new Set(second.map(x => x.id)).size, EXAMPLES.length);
    assert.notEqual(first.at(-1).id, second[0].id);
    const original = EXAMPLES.find(x => x.id === first[0].id);
    first[0].details.context = 'Edited by student'; first[0].preferences.format = 'Other';
    assert.notEqual(original.details.context, 'Edited by student');
    assert.notEqual(original.preferences.format, 'Other');
  }
});
