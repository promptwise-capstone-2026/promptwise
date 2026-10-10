import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS, LEVELS } from '../src/tasks.js';
import { validateInput, CUSTOM_TASK_MAX_LENGTH, getValidationFieldMeta } from '../src/validation.js';
import { analyseWorkflow, improveWorkflow, WorkflowValidationError, analysisFingerprint, WORKFLOW_MODES } from '../src/workflow.js';

const customTask = taskDescription => ({ taskId: 'other', original: 'Help me prepare.', details: { taskDescription } });

test('Others rejects missing and obvious placeholder input without claiming semantic classification', () => {
  for (const description of ['', '   ', '12345', '!!!', 'Others', 'asdf', 'aaaa aaaa', 'TBD', 'xxx', 'none', 'placeholder', 'todo', 't.b.d.', '  TODO!  ']) {
    const result = validateInput(customTask(description), { stage: 'task' });
    assert.equal(result.valid, false, description);
    assert.ok(result.fields.taskDescription);
  }
  assert.equal(validateInput(customTask('a'.repeat(CUSTOM_TASK_MAX_LENGTH + 1)), { stage: 'task' }).valid, false);
});

test('personalisation offers distinct actionable guidance and correct file metadata', () => {
  for (const task of TASKS) {
    const input = { taskId: task.id, original: 'Explain the ideas in these notes.', details: task.id === 'other' ? { taskDescription: 'Prepare interview questions' } : {} };
    const { fields } = analyseWorkflow(input);
    const recommended = fields.filter(field => field.priority === 'recommended');
    assert.equal(new Set(recommended.map(field => field.guidance)).size, recommended.length, task.id);
    assert.ok(recommended.every(field => !/^Optional:/i.test(field.placeholder || '')));
    for (const field of fields) {
      assert.ok(['short', 'sentence', 'material'].includes(field.inputKind), `${task.id}: ${field.key}`);
      assert.equal(field.inputKind === 'material', Boolean(field.material), field.key);
      if (['language', 'targetLength', 'duration'].includes(field.key)) assert.equal(field.inputKind, 'short');
      if (['context', 'focus', 'goal', 'constraints'].includes(field.key)) assert.equal(field.inputKind, 'sentence');
    }
    for (const field of fields.filter(field => ['source', 'code', 'draft', 'criteria'].includes(field.key))) {
      assert.equal(field.material.accept, '.txt,.md,text/plain,text/markdown');
      assert.ok(field.material.purpose);
      assert.equal(getValidationFieldMeta(field.key).stage, 'generation');
    }
  }
  const study = analyseWorkflow({ taskId: 'study', original: 'Explain phishing.' });
  assert.equal(study.fields.find(field => field.key === 'currentKnowledge').priority, 'optional');
});

test('analysis fingerprints cover actual inputs and are stable across object ordering', () => {
  const input = { taskId: 'study', original: 'Explain phishing.', details: { context: 'Tutorial', focus: 'Warning signs' }, preferences: { tone: 'Academic', level: 'Undergraduate' } };
  assert.equal(analysisFingerprint(input), analysisFingerprint({ ...input, details: { focus: 'Warning signs', context: 'Tutorial' }, preferences: { level: 'Undergraduate', tone: 'Academic' } }));
  assert.equal(analyseWorkflow(input).inputFingerprint, analysisFingerprint(input));
  assert.notEqual(analysisFingerprint(input), analysisFingerprint({ ...input, details: { ...input.details, context: 'Exam revision' } }));
});

test('legitimate short and multilingual task descriptions are not blocked by a keyword whitelist', () => {
  for (const description of ['SQL', 'Prepare interview questions for a research project', 'Viết câu hỏi phỏng vấn cho dự án nghiên cứu', '研究访谈问题', 'เตรียมคำถามสัมภาษณ์สำหรับงานวิจัย']) {
    assert.equal(validateInput(customTask(description), { stage: 'task' }).valid, true, description);
  }
  assert.ok(validateInput(customTask('SQL'), { stage: 'task' }).warnings.length);
});

test('required validation depends on the workflow stage, not missing optional criteria', () => {
  const input = { taskId: 'study', original: ' ', preferences: { format: 'Other' } };
  assert.equal(validateInput(input, { stage: 'task' }).valid, true);
  assert.ok(validateInput(input).fields.original);
  const validPrompt = { ...input, original: 'Explain phishing.' };
  assert.equal(validateInput(validPrompt, { stage: 'analysis' }).valid, true);
  assert.ok(validateInput(validPrompt, { stage: 'generation' }).fields.otherFormat);
  assert.equal(validateInput({ ...validPrompt, preferences: {} }, { stage: 'generation' }).valid, true);
});

test('unknown task identifiers and invalid form shapes cannot silently use Study Support', () => {
  for (const input of [null, [], { taskId: 'unknown', original: 'Explain phishing.' }]) {
    assert.equal(validateInput(input).valid, false);
    assert.throws(() => analyseWorkflow(input), error => error instanceof WorkflowValidationError && Boolean(error.fields.taskId));
  }
  const invalidDetails = { taskId: 'summarisation', original: 'Summarise this article.', details: { source: { content: 'Not a text field' } } };
  assert.ok(validateInput(invalidDetails).fields.source);
  assert.throws(() => analyseWorkflow(invalidDetails), WorkflowValidationError);
  assert.equal(validateInput({ taskId: 'study', original: 'Explain phishing.', preferences: { format: 'Unsupported format' } }).valid, false);
});

test('the shared workflow supports all six branches without modifying user input', () => {
  for (const task of TASKS) {
    const input = { taskId: task.id, original: 'Explain the topic.', details: task.id === 'other' ? { taskDescription: 'Prepare research interview questions' } : {} };
    const before = structuredClone(input);
    const analysis = analyseWorkflow(input);
    const improvement = improveWorkflow(input);
    assert.equal(analysis.mode, 'local-rules');
    assert.equal(analysis.criteria.length, 7);
    assert.equal(improvement.mode, 'local-rules');
    for (const [mode, location] of [[analysis.mode, 'analysis'], [improvement.mode, 'compare']]) {
      const meta = WORKFLOW_MODES[mode];
      assert.ok(meta.pill && meta.tag);
      const note = meta.notes[location];
      assert.ok(note.title && note.disclosure && note.details.length > 0);
      assert.match(note.summary, /does not use AI/);
    }
    assert.ok(improvement.improvedPrompt.includes(input.original));
    assert.deepEqual(input, before);
    assert.ok(analysis.fields.every(field => field.required === false));
    assert.ok(analysis.fields.every(field => ['recommended', 'optional'].includes(field.priority)));
  }
});

test('personalisation avoids repeating Others and provides source intake for source-dependent study tasks', () => {
  const other = analyseWorkflow(customTask('Prepare interview questions for a research project'));
  assert.ok(!other.fields.some(field => field.key === 'taskDescription'));
  const study = analyseWorkflow({ taskId: 'study', original: 'Explain the ideas in these notes.' });
  const source = study.fields.find(field => field.key === 'source');
  assert.ok(source);
  assert.equal(source.priority, 'recommended');
  assert.equal(source.required, false);
  assert.ok(!analyseWorkflow({ taskId: 'study', original: 'Explain phishing.' }).fields.some(field => field.key === 'source'));
});

test('missing material remains visible while a request-for-source draft is still possible', () => {
  const result = improveWorkflow({ taskId: 'summarisation', original: 'Summarise this article.' });
  assert.ok(result.warnings.length);
  assert.match(result.improvedPrompt, /Ask me to provide the source material/);
  assert.ok(!LEVELS.includes('Classmates'));
  assert.ok(!LEVELS.includes('Tutor or educator'));
});
