import { TASKS, FORMATS, LEVELS, TONES, DEPTHS, PREFERENCE_LABELS, getDetailLabel } from './tasks.js';
import { validateInput, CUSTOM_TASK_MAX_LENGTH, getValidationFieldMeta } from './validation.js';
import { analyseWorkflow, improveWorkflow, WorkflowValidationError, WORKFLOW_MODES as MODE_LABELS, analysisFingerprint as analysisKeyOf } from './workflow.js';
import { readTextMaterial } from './materials.js';

const app = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
const desktop = window.matchMedia('(min-width: 960px)');

const STEPS = ['Task', 'Prompt', 'Analysis', 'Personalise', 'Compare'];
const TITLES = ['Choose a task', 'Improve your prompt', 'Prompt Analysis', 'Prompt Personalisation', 'Compare the prompts'];
const STATUS = {
  Present: { cls: 'present', icon: '✓' },
  Partial: { cls: 'partial', icon: '◐' },
  Missing: { cls: 'missing', icon: '!' },
  'N/A': { cls: 'na', icon: '–', spoken: 'not applicable' }
};

const blankState = () => ({
  screen: 0,
  taskId: '',
  pendingTask: '',
  original: '',
  details: {},
  preferences: {},
  errors: {},
  alert: '',
  analysis: null,
  analysisKey: '',
  analysing: false,
  expanded: new Set(),
  optionalOpen: null,
  files: {},
  draft: null,
  improved: '',
  generating: false,
  generateError: '',
  confirmReplace: false,
  confirmRestart: false,
  copy: { text: '', kind: '' },
  copiedValue: null
});

let state = blankState();
// Bumped on task change and restart so late async results cannot reach a newer session.
let epoch = 0;
let analysisSeq = 0;
let generateSeq = 0;
let readSeq = 0;

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const clean = value => typeof value === 'string' ? value.trim() : '';
const taskById = id => TASKS.find(task => task.id === id);
const truncate = (value, max) => value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
// 1000-based units to match the 1 MB (1,000,000-byte) reading limit.
const formatSize = bytes => bytes < 1000 ? `${bytes} bytes` : bytes < 1_000_000 ? `${(bytes / 1000).toFixed(bytes < 10_000 ? 1 : 0)} kB` : `${(bytes / 1_000_000).toFixed(2)} MB`;
const reqMark = '<span class="req" aria-hidden="true">*</span><span class="sr-only"> (required)</span>';
const requiredNote = '<p class="required-note"><span class="req" aria-hidden="true">*</span> marks a required field.</p>';

function announce(message) {
  if (!announcer) return;
  announcer.textContent = '';
  window.setTimeout(() => { announcer.textContent = message; }, 30);
}

// ---------- Workflow inputs ----------

function analysisInput() {
  const details = state.taskId === 'other' ? { taskDescription: state.details.taskDescription || '' } : {};
  return { taskId: state.taskId, original: state.original, details, preferences: {} };
}

const analysisValid = () => Boolean(state.analysis) && state.analysisKey === analysisKeyOf(analysisInput());

function generationInput() {
  const allowed = new Set((state.analysis?.fields || []).map(field => field.key));
  if (state.taskId === 'other') allowed.add('taskDescription');
  const details = {};
  for (const [key, value] of Object.entries(state.details)) {
    if (allowed.has(key) && typeof value === 'string' && value.trim()) details[key] = value;
  }
  const preferences = {};
  for (const key of Object.keys(PREFERENCE_LABELS)) {
    if (clean(state.preferences[key])) preferences[key] = state.preferences[key];
  }
  if (preferences.format === 'Other') preferences.otherFormat = state.preferences.otherFormat || '';
  return { taskId: state.taskId, original: state.original, details, preferences };
}

// ---------- Shared fragments ----------

function stepper() {
  return `<nav class="stepper" aria-label="Progress">
    <p class="step-count">Step ${state.screen + 1} of 5<span class="step-current">: ${STEPS[state.screen]}</span></p>
    <ol class="step-list">${STEPS.map((step, index) => `<li class="${index < state.screen ? 'is-done' : index === state.screen ? 'is-current' : ''}"${index === state.screen ? ' aria-current="step"' : ''}><span class="step-dot" aria-hidden="true"></span><span class="step-name">${step}</span></li>`).join('')}</ol>
  </nav>`;
}

function header() {
  if (state.screen === 0) {
    return `<header class="home-head"><p class="brand">PromptWise</p><p class="tagline">Improve your prompts. Get better AI responses.</p>${stepper()}</header>`;
  }
  const task = taskById(state.taskId);
  const custom = state.taskId === 'other' ? clean(state.details.taskDescription) : '';
  return `<header class="page-head">
    <div class="head-row">
      <button class="back-button" type="button" data-action="back" data-fk="back"><span aria-hidden="true">‹</span> Back</button>
      <p class="brand brand-small">PromptWise</p>
    </div>
    <p class="task-chip"><span class="task-chip-label">Task</span> <span class="task-chip-name">${esc(task?.label || '')}</span>${custom ? `<span class="task-chip-custom">${esc(truncate(custom, 70))}</span>` : ''}</p>
    ${stepper()}
  </header>`;
}

function footer(action, label, { busy = false, busyLabel = '' } = {}) {
  // aria-disabled rather than disabled keeps keyboard focus on the button while work is pending.
  return `<div class="action-bar"><div class="action-inner"><button class="primary-button" type="button" data-action="${action}" data-fk="primary-${action}"${busy ? ' aria-disabled="true"' : ''}>${busy ? `<span class="spinner spinner-light" aria-hidden="true"></span>${busyLabel}` : label}</button></div></div>`;
}

function errorText(key) {
  return state.errors[key] ? `<p class="field-error" id="err-${key}"><span class="error-icon" aria-hidden="true">!</span>${esc(state.errors[key])}</p>` : '';
}

const describedBy = (...ids) => {
  const list = ids.filter(Boolean);
  return list.length ? ` aria-describedby="${list.join(' ')}"` : '';
};
const invalid = key => state.errors[key] ? ' aria-invalid="true"' : '';
const errId = key => state.errors[key] ? `err-${key}` : '';

function alertBox() {
  return state.alert ? `<p class="form-alert" role="alert">${esc(state.alert)}</p>` : '';
}

function modeNote(mode, where) {
  if (mode !== 'local-rules') {
    return `<div class="mode-note"><p class="mode-title"><span class="mode-pill">${esc(MODE_LABELS[mode]?.pill || mode || 'Unknown mode')}</span> Result mode</p><p>Review this result before relying on it.</p></div>`;
  }
  if (where === 'analysis') {
    return `<div class="mode-note">
      <p class="mode-title"><span class="mode-pill">${MODE_LABELS['local-rules'].pill}</span> How this check works</p>
      <p>PromptWise looked for visible words and filled-in fields on this device. It does not use AI and cannot judge what your prompt means. A Present source only shows that text was supplied; it cannot confirm the material is complete or relevant.</p>
    </div>`;
  }
  return `<div class="mode-note">
    <p class="mode-title"><span class="mode-pill">${MODE_LABELS['local-rules'].pill}</span> Locally assembled draft</p>
    <p>PromptWise combined your original words, the details and preferences you supplied, and fixed wording for this task. It is not an AI rewrite and has not been checked for accuracy. Nothing was sent to an AI service.</p>
  </div>`;
}

function warningList(warnings, title) {
  const unique = [...new Set((warnings || []).filter(Boolean))];
  if (!unique.length) return '';
  return `<div class="notice notice-warn"><p class="notice-title">${esc(title)}</p><ul>${unique.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>`;
}

// ---------- Screen 1: Home ----------

function taskCard(task) {
  const checked = state.taskId === task.id;
  return `<label class="task-card${checked ? ' is-selected' : ''}" for="task-${task.id}">
    <input class="task-radio" type="radio" id="task-${task.id}" name="task" value="${task.id}"${checked ? ' checked' : ''} required${invalid('taskId')}${describedBy(errId('taskId'))}>
    <span class="task-text"><span class="task-title">${esc(task.label)}</span><span class="task-hint">${esc(task.hint)}</span></span>
    <span class="task-check" aria-hidden="true"></span>
  </label>`;
}

function descriptionWarnings(value) {
  if (!clean(value)) return [];
  return validateInput({ taskId: 'other', details: { taskDescription: value } }, { stage: 'task' }).warnings;
}

function pendingTaskBar() {
  if (!state.pendingTask) return '';
  const current = taskById(state.taskId)?.label || 'this task';
  const next = taskById(state.pendingTask)?.label || 'another task';
  return `<div class="confirm-bar" role="group" aria-labelledby="task-switch-message">
    <p id="task-switch-message">Switch to <strong>${esc(next)}</strong>? The details${state.draft ? ', files and improved prompt' : ' and files'} for ${esc(current)} will be cleared. Your prompt text and response preferences are kept.</p>
    <div class="confirm-actions">
      <button type="button" class="secondary-button" data-action="confirm-task" data-fk="confirm-task">Switch task</button>
      <button type="button" class="ghost-button" data-action="cancel-task" data-fk="cancel-task">Keep ${esc(current)}</button>
    </div>
  </div>`;
}

function home() {
  const description = state.details.taskDescription || '';
  const warnings = descriptionWarnings(description);
  const length = description.trim().length;
  return `${header()}<main class="content" id="main">
    <h1 class="screen-title" tabindex="-1" data-fk="screen-title">What are you working on?</h1>
    ${requiredNote}
    <fieldset class="task-fieldset"${describedBy(errId('taskId'))}>
      <legend class="group-label">Choose an academic task${reqMark}</legend>
      <div class="task-grid">${TASKS.map(taskCard).join('')}</div>
      ${errorText('taskId')}
    </fieldset>
    ${pendingTaskBar()}
    <div class="others-panel" id="others-panel"${state.taskId === 'other' ? '' : ' hidden'}>
      <label class="field-label" for="task-description">Describe your academic task${reqMark}</label>
      <p class="field-help" id="task-description-help">Say what you need to do, for example: prepare interview questions for a student research project.</p>
      <input class="text-field" type="text" id="task-description" data-detail="taskDescription" autocomplete="off" aria-required="true" value="${esc(description)}"${invalid('taskDescription')}${describedBy('task-description-help', 'task-description-count', errId('taskDescription'), 'task-description-warning')}>
      <p class="char-count${length > CUSTOM_TASK_MAX_LENGTH ? ' is-over' : ''}" id="task-description-count">${length} / ${CUSTOM_TASK_MAX_LENGTH} characters</p>
      ${errorText('taskDescription')}
      <p class="field-warning" id="task-description-warning"${warnings.length ? '' : ' hidden'}>${esc(warnings.join(' '))}</p>
    </div>
    <p class="support-text">Choose the task that best fits your goal. You can add details after the analysis.</p>
    ${alertBox()}
  </main>${footer('continue', 'Continue')}`;
}

// ---------- Screen 2: Prompt input ----------

function promptInput() {
  const task = taskById(state.taskId);
  return `${header()}<main class="content" id="main">
    <h1 class="screen-title" tabindex="-1" data-fk="screen-title">Improve your prompt</h1>
    ${requiredNote}
    <div class="field">
      <label class="field-label" for="original">What would you like AI to help you with?${reqMark}</label>
      <p class="field-help" id="original-help">Write your first version in your own words. Short is fine; you can add details after the analysis.</p>
      <textarea id="original" class="prompt-input" data-original required aria-required="true" spellcheck="true" placeholder="${esc(task?.promptHint || '')}"${invalid('original')}${describedBy('original-help', errId('original'))}>${esc(state.original)}</textarea>
      ${errorText('original')}
    </div>
    ${alertBox()}
  </main>${footer('analyse', 'Analyse Prompt', { busy: state.analysing, busyLabel: 'Analysing…' })}`;
}

// ---------- Screen 3: Analysis ----------

function statusBadge(status) {
  const meta = STATUS[status] || STATUS['N/A'];
  return `<span class="status-badge status-${meta.cls}"><span class="status-icon" aria-hidden="true">${meta.icon}</span>${esc(status)}${meta.spoken ? `<span class="sr-only"> (${meta.spoken})</span>` : ''}</span>`;
}

function criterionCard(row, wide) {
  const meta = STATUS[row.status] || STATUS['N/A'];
  const open = wide || state.expanded.has(row.key);
  const panelId = `criterion-${row.key}-panel`;
  const body = `<p class="criterion-reason">${esc(row.reason)}</p>${row.suggestion ? `<p class="criterion-suggestion"><span class="suggestion-label">Suggestion</span> ${esc(row.suggestion)}</p>` : ''}`;
  const head = wide
    ? `<h3 class="criterion-head" tabindex="-1" data-fk="toggle-${esc(row.key)}"><span class="criterion-name">${esc(row.label)}</span>${statusBadge(row.status)}</h3>`
    : `<h3 class="criterion-head"><button type="button" class="criterion-toggle" data-toggle="${esc(row.key)}" data-fk="toggle-${esc(row.key)}" aria-expanded="${open}" aria-controls="${panelId}"><span class="criterion-name">${esc(row.label)}</span>${statusBadge(row.status)}<span class="chevron" aria-hidden="true"></span></button></h3>`;
  return `<li class="criterion criterion-${meta.cls}${open ? ' is-open' : ''}">${head}<div class="criterion-panel" id="${panelId}"${open ? '' : ' hidden'}>${body}</div></li>`;
}

function analysisScreen() {
  const result = state.analysis;
  const wide = desktop.matches;
  const review = result.criteria.filter(row => row.status === 'Missing' || row.status === 'Partial');
  const allOpen = result.criteria.every(row => state.expanded.has(row.key));
  return `${header()}<main class="content" id="main">
    <h1 class="screen-title" tabindex="-1" data-fk="screen-title">Prompt Analysis</h1>
    <div class="analysis-layout">
      <section class="analysis-aside" aria-labelledby="original-heading">
        <h2 class="section-title" id="original-heading">Original prompt</h2>
        <div class="prompt-box" role="region" tabindex="0" data-fk="original-box" aria-labelledby="original-heading">${esc(state.original)}</div>
        ${modeNote(result.mode, 'analysis')}
        ${warningList(result.warnings, 'Guidance')}
      </section>
      <section class="analysis-main" aria-labelledby="evaluation-heading">
        <div class="section-heading"><h2 id="evaluation-heading">Prompt evaluation</h2><p class="small-note">Seven criteria · guidance, not a score</p></div>
        <p class="review-summary">${review.length ? `Worth reviewing: <strong>${review.map(row => esc(row.label)).join(', ')}</strong>.` : 'The local checks did not flag any active criterion. You can still add details.'}</p>
        ${wide ? '' : `<div class="card-tools"><p class="card-hint">Tap a criterion to see why and what to add.</p><button type="button" class="text-button" data-action="expand-all" data-fk="expand-all">${allOpen ? 'Collapse all' : 'Expand all'}</button></div>`}
        <ul class="criteria-list">${result.criteria.map(row => criterionCard(row, wide)).join('')}</ul>
        <p class="support-text">${review.length ? 'Add the details you know on the next screen. Leave genuinely unknown information blank.' : 'The local checks found matching words or details for every active criterion. Review the prompt yourself before relying on it.'}</p>
      </section>
    </div>
  </main>${footer('personalise', 'Improve My Prompt')}`;
}

// ---------- Screen 4: Personalisation ----------

function fieldLabel(key) {
  const field = (state.analysis?.fields || []).find(item => item.key === key) || taskById(state.taskId)?.fields.find(item => item.key === key);
  if (field) return field.label;
  return getDetailLabel(key, state.taskId);
}

function optionalCountText() {
  const optional = (state.analysis?.fields || []).filter(field => field.priority !== 'recommended');
  const filled = optional.filter(field => clean(state.details[field.key])).length;
  return `${filled} of ${optional.length} filled`;
}

function excludedNote() {
  const shown = new Set((state.analysis?.fields || []).map(field => field.key));
  const hidden = Object.entries(state.details).filter(([key, value]) => key !== 'taskDescription' && !shown.has(key) && clean(value)).map(([key]) => fieldLabel(key));
  if (!hidden.length) return '';
  return `<div class="notice notice-info"><p>Kept but not used for this prompt: <strong>${hidden.map(esc).join(', ')}</strong>. The current analysis does not ask for ${hidden.length > 1 ? 'these details' : 'this detail'}. Change your prompt to include ${hidden.length > 1 ? 'them' : 'it'} again.</p></div>`;
}

function fileControl(field) {
  const id = `detail-${field.key}`;
  const key = field.key;
  const file = state.files[key];
  const forField = `<span class="sr-only"> for ${esc(field.label)}</span>`;
  let status = '';
  if (file?.status === 'reading') {
    status = `<div class="file-choice"><p class="file-line"><span class="spinner" aria-hidden="true"></span><span>Reading <strong>${esc(file.name)}</strong>…</span></p>
      <div class="file-actions"><button type="button" class="ghost-button small" data-file-action="stop" data-field="${key}" data-fk="file-stop-${key}">Cancel reading${forField}</button></div></div>`;
  } else if (file?.status === 'pending') {
    status = `<div class="file-choice"><p class="file-line"><span><strong>${esc(file.name)}</strong> (${formatSize(file.size)}) is ready.${clean(state.details[key]) ? ' This field already has text.' : ''}</span></p>
      <div class="file-actions">
        <button type="button" class="secondary-button small" data-file-action="replace" data-field="${key}" data-fk="file-replace-${key}">Replace current text${forField}</button>
        <button type="button" class="secondary-button small" data-file-action="append" data-field="${key}" data-fk="file-append-${key}">Add below current text${forField}</button>
        <button type="button" class="ghost-button small" data-file-action="cancel" data-field="${key}" data-fk="file-cancel-${key}">Cancel${forField}</button>
      </div></div>`;
  } else if (file?.status === 'ready') {
    status = `<div class="file-ready"><p class="file-line file-ok"><span>Text from <strong>${esc(file.name)}</strong> (${formatSize(file.size)}) is in this field.</span></p>
      <div class="file-actions"><button type="button" class="ghost-button small" data-file-action="remove" data-field="${key}" data-fk="file-remove-${key}">Remove file text${forField}</button>${file.edited ? `<button type="button" class="ghost-button small" data-file-action="clear" data-field="${key}" data-fk="file-clear-${key}">Clear field${forField}</button>` : ''}</div></div>`;
  }
  const problem = file?.notice || file?.error;
  const error = problem ? `<div class="file-error" id="${id}-file-error"><p>${esc(problem)}</p>${file.error && !['reading', 'pending'].includes(file.status) ? `<button type="button" class="ghost-button small" data-file-action="dismiss" data-field="${key}" data-fk="file-dismiss-${key}">Dismiss${forField}</button>` : ''}</div>` : '';
  return `<div class="file-control">
    <input type="file" class="file-input" id="${id}-file" data-file-input="${key}" accept="${esc(field.material.accept)}" tabindex="-1" aria-hidden="true">
    <button type="button" class="file-button" data-file-pick="${key}" data-fk="file-pick-${key}"${describedBy(`${id}-file-note`, problem ? `${id}-file-error` : '')}><span class="file-icon" aria-hidden="true"></span>Add text from a .txt or .md file<span class="sr-only"> for ${esc(field.label)}</span></button>
    <p class="file-note" id="${id}-file-note">${esc(field.material.purpose)} Plain text or Markdown up to ${esc(field.material.limitLabel)}, read in this browser only. PDF, Word and image files are not supported yet.</p>
    <div class="file-status">${status}${error}</div>
  </div>`;
}

function detailField(field) {
  const id = `detail-${field.key}`;
  const value = state.details[field.key] || '';
  const criterion = state.analysis?.criteria.find(row => row.key === field.criterion);
  const help = field.priority === 'recommended' && field.guidance ? field.guidance : '';
  const fileCapable = field.multiline && field.material;
  const aria = `${invalid(field.key)}${describedBy(help ? `${id}-help` : '', errId(field.key))}`;
  const control = field.multiline
    ? `<textarea id="${id}" class="text-field multiline" data-detail="${field.key}" placeholder="${esc(field.placeholder || '')}" spellcheck="true"${aria}>${esc(value)}</textarea>`
    : `<input id="${id}" class="text-field" type="text" data-detail="${field.key}" placeholder="${esc(field.placeholder || '')}" value="${esc(value)}"${aria}>`;
  return `<div class="field${field.priority === 'recommended' ? ' is-recommended' : ''}" id="field-${field.key}">
    <div class="field-top"><label class="field-label" for="${id}">${esc(field.label)}</label>${criterion ? `<span class="criterion-tag criterion-tag-${(STATUS[criterion.status] || STATUS['N/A']).cls}">Helps: ${esc(criterion.label)}</span>` : ''}</div>
    ${help ? `<p class="field-help" id="${id}-help">${esc(help)}</p>` : ''}
    ${control}
    ${fileCapable ? fileControl(field) : ''}
    ${errorText(field.key)}
  </div>`;
}

function selectField(key, label, options, help = '') {
  return `<div class="field">
    <label class="field-label" for="pref-${key}">${label}</label>
    ${help ? `<p class="field-help" id="pref-${key}-help">${help}</p>` : ''}
    <select id="pref-${key}" class="text-field" data-pref="${key}"${invalid(key)}${describedBy(help ? `pref-${key}-help` : '', errId(key))}>
      <option value="">Not specified</option>
      ${options.map(option => `<option value="${esc(option)}"${state.preferences[key] === option ? ' selected' : ''}>${esc(option)}</option>`).join('')}
    </select>
    ${errorText(key)}
  </div>`;
}

function choiceGroup(key, label, options, help) {
  return `<div class="field">
    <p class="field-label" id="${key}-label">${label}</p>
    <p class="field-help" id="${key}-help">${help}</p>
    <div class="choice-grid choice-grid-${key}" role="group" aria-labelledby="${key}-label" aria-describedby="${key}-help">
      ${options.map(option => {
        const on = state.preferences[key] === option;
        return `<button type="button" class="choice${on ? ' is-selected' : ''}" data-${key}="${esc(option)}" data-fk="${key}-${esc(option)}" aria-pressed="${on}">${esc(option)}</button>`;
      }).join('')}
    </div>
    ${errorText(key)}
  </div>`;
}

function personalisationScreen() {
  const fields = state.analysis.fields;
  const recommended = fields.filter(field => field.priority === 'recommended');
  const optional = fields.filter(field => field.priority !== 'recommended');
  const optionalOpen = state.optionalOpen ?? (!recommended.length || optional.some(field => clean(state.details[field.key]) || state.files[field.key]));
  const otherFormat = state.preferences.format === 'Other';
  const task = taskById(state.taskId);
  return `${header()}<main class="content" id="main">
    <h1 class="screen-title" tabindex="-1" data-fk="screen-title">Prompt Personalisation</h1>
    <p class="intro">Add what you know for ${esc(task?.label || 'this task')}. These details are optional; leave unknown information blank and PromptWise will not invent it.</p>
    ${otherFormat ? requiredNote : ''}
    <details class="review-box">
      <summary data-fk="review-summary">Your prompt</summary>
      <div class="prompt-box compact">${esc(state.original)}</div>
    </details>
    <div class="personalise-layout">
      <div class="detail-column">
        ${recommended.length ? `<section class="form-section" aria-labelledby="recommended-heading">
          <h2 id="recommended-heading">Recommended for this prompt</h2>
          <p class="section-help">These relate to criteria flagged in the analysis.</p>
          <div class="form-stack">${recommended.map(detailField).join('')}</div>
        </section>` : ''}
        ${optional.length ? `<details class="optional-group" data-optional${optionalOpen ? ' open' : ''}>
          <summary data-fk="optional-summary"><span class="optional-title">${recommended.length ? 'More optional details' : 'Optional details'}</span><span class="optional-count">${optionalCountText()}</span></summary>
          <div class="form-stack">${optional.map(detailField).join('')}</div>
        </details>` : ''}
      </div>
      <section class="form-section pref-column" aria-labelledby="preferences-heading">
        <h2 id="preferences-heading">Response preferences <span class="optional-tag">Optional</span></h2>
        <p class="section-help">Nothing is chosen for you. Tone and depth are preferences, not quality criteria.</p>
        ${selectField('level', PREFERENCE_LABELS.level, LEVELS)}
        <div class="field">
          <label class="field-label" for="pref-audience">${PREFERENCE_LABELS.audience}</label>
          <p class="field-help" id="pref-audience-help">Who the response is for, if not you. For example: my classmates, a tutor, a general audience.</p>
          <input id="pref-audience" class="text-field" type="text" data-pref="audience" value="${esc(state.preferences.audience || '')}"${invalid('audience')}${describedBy('pref-audience-help', errId('audience'))}>
          ${errorText('audience')}
        </div>
        ${choiceGroup('depth', PREFERENCE_LABELS.depth, DEPTHS, 'Optional preference. Select again to clear.')}
        ${selectField('tone', PREFERENCE_LABELS.tone, TONES, 'Optional preference.')}
        ${choiceGroup('format', PREFERENCE_LABELS.format, FORMATS, 'Choosing a format addresses the Output format criterion. Select again to clear.')}
        ${otherFormat ? `<div class="field other-format-field">
          <label class="field-label" for="other-format">Describe the output format${reqMark}</label>
          <input id="other-format" class="text-field" type="text" data-pref="otherFormat" aria-required="true" placeholder="e.g. a two-column comparison" value="${esc(state.preferences.otherFormat || '')}"${invalid('otherFormat')}${describedBy(errId('otherFormat'))}>
          ${errorText('otherFormat')}
        </div>` : ''}
      </section>
    </div>
    ${excludedNote()}
    ${alertBox()}
    ${replaceBar()}
  </main>${footer('generate', 'Create Improved Prompt', { busy: state.generating, busyLabel: 'Assembling…' })}`;
}

function replaceBar() {
  if (!state.confirmReplace) return '';
  return `<div class="confirm-bar" role="group" aria-labelledby="replace-message">
    <p id="replace-message">You edited the previous draft. Creating a new one replaces those edits.</p>
    <div class="confirm-actions">
      <button type="button" class="secondary-button" data-action="confirm-replace" data-fk="confirm-replace">Replace with new draft</button>
      <button type="button" class="ghost-button" data-action="keep-draft" data-fk="keep-draft">Keep my edited draft</button>
    </div>
  </div>`;
}

// ---------- Screen 5: Comparison ----------

function usedDetails(input) {
  const fields = state.analysis?.fields || [];
  // Same order as the form: recommended fields first, then optional ones.
  const order = [...fields.filter(field => field.priority === 'recommended'), ...fields.filter(field => field.priority !== 'recommended')].map(field => field.key);
  const keys = Object.keys(input.details).sort((a, b) => {
    const rank = key => key === 'taskDescription' ? -1 : order.includes(key) ? order.indexOf(key) : order.length;
    return rank(a) - rank(b);
  });
  const rows = keys.map(key => {
    const value = input.details[key];
    const file = state.files[key]?.status === 'ready' && value.includes(insertedText(state.files[key])) ? ` <span class="from-file">from ${esc(state.files[key].name)}</span>` : '';
    return `<div class="used-row"><dt>${esc(fieldLabel(key))}</dt><dd>${esc(truncate(value.trim(), 180))}${file}</dd></div>`;
  });
  for (const [key, label] of Object.entries(PREFERENCE_LABELS)) {
    const value = key === 'format' && input.preferences.format === 'Other' ? input.preferences.otherFormat : input.preferences[key];
    if (clean(value)) rows.push(`<div class="used-row"><dt>${label}</dt><dd>${esc(truncate(value.trim(), 180))}</dd></div>`);
  }
  return `<details class="used-details"${desktop.matches ? ' open' : ''}>
    <summary data-fk="used-summary">What this draft includes</summary>
    ${rows.length ? `<dl class="used-list">${rows.join('')}</dl>` : '<p>No extra details or preferences were supplied, so the draft keeps your original words.</p>'}
    <p class="field-help">PromptWise may also add fixed wording for this task, such as asking the AI to flag claims you should verify or to request missing material.</p>
  </details>`;
}

function compareScreen() {
  const head = `${header()}<main class="content" id="main"><h1 class="screen-title" tabindex="-1" data-fk="screen-title">Compare the prompts</h1>`;
  if (state.generating) {
    return `${head}<div class="loading-panel" role="status"><span class="spinner" aria-hidden="true"></span>Assembling your draft…</div></main>`;
  }
  if (!state.draft) {
    return `${head}<div class="notice notice-error" role="alert"><p class="notice-title">The draft could not be created</p><p>${esc(state.generateError || 'Something went wrong.')}</p>
      <div class="confirm-actions"><button type="button" class="secondary-button" data-action="retry-generate" data-fk="retry-generate">Try again</button><button type="button" class="ghost-button" data-action="back" data-fk="back-to-details">Back to personalisation</button></div></div></main>`;
  }
  const input = generationInput();
  const stale = state.draft.key !== JSON.stringify(input);
  return `${head}
    ${modeNote(state.draft.mode, 'compare')}
    ${state.generateError ? `<div class="notice notice-error" role="alert"><p>${esc(state.generateError)}</p><button type="button" class="secondary-button small" data-action="retry-generate" data-fk="retry-generate">Try again</button></div>` : ''}
    ${stale ? `<div class="notice notice-info"><p>Your prompt or details changed after this draft was assembled.</p><button type="button" class="secondary-button small" data-action="regenerate" data-fk="regenerate">Create a new draft</button></div>` : ''}
    ${replaceBar()}
    ${warningList(state.draft.warnings, 'Check before using')}
    <div class="compare-grid">
      <section class="compare-col" aria-labelledby="compare-original-heading">
        <h2 class="section-title" id="compare-original-heading">Original prompt</h2>
        <div class="prompt-box" role="region" tabindex="0" data-fk="compare-original-box" aria-labelledby="compare-original-heading">${esc(state.original)}</div>
      </section>
      <section class="compare-col improved-col" aria-labelledby="improved-label">
        <div class="improved-head"><label class="field-label section-title" id="improved-label" for="improved">Improved prompt</label><span class="draft-tag">${esc(MODE_LABELS[state.draft.mode]?.tag || `Mode: ${state.draft.mode || 'unknown'}`)}</span><span class="editable-tag">Editable</span></div>
        <p class="field-help" id="improved-help">Edit anything before copying. Copy uses exactly what is in this box.</p>
        <textarea id="improved" class="improved-input" data-improved spellcheck="true" aria-describedby="improved-help">${esc(state.improved)}</textarea>
        <div class="copy-row">
          <button class="copy-button" type="button" data-action="copy" data-fk="copy">Copy Prompt</button>
          <p class="copy-message${state.copy.kind ? ` is-${state.copy.kind}` : ''}" id="copy-message">${esc(state.copy.text)}</p>
        </div>
      </section>
    </div>
    ${usedDetails(state.draft.input || input)}
    <p class="responsible-note"><strong>Use responsibly.</strong> Check facts, sources and your assessment requirements before using any AI response. Paste this prompt into your chosen AI tool yourself; PromptWise does not send it anywhere.</p>
    ${state.confirmRestart ? `<div class="confirm-bar" role="group" aria-labelledby="restart-message">
      <p id="restart-message">Start again? Your edited prompt has not been copied and will be cleared.</p>
      <div class="confirm-actions"><button type="button" class="secondary-button" data-action="confirm-restart" data-fk="confirm-restart">Start again</button><button type="button" class="ghost-button" data-action="cancel-restart" data-fk="cancel-restart">Stay here</button></div>
    </div>` : ''}
    <div class="button-stack"><button class="restart-button" type="button" data-action="restart" data-fk="restart">Improve another prompt</button></div>
  </main>`;
}

// ---------- Rendering and navigation ----------

const SCREENS = [home, promptInput, analysisScreen, personalisationScreen, compareScreen];

function render() {
  const active = document.activeElement;
  let key = null;
  let selection = null;
  if (active && active !== document.body && app.contains(active)) {
    key = active.dataset.fk ? `[data-fk="${CSS.escape(active.dataset.fk)}"]` : active.id ? `#${CSS.escape(active.id)}` : null;
    try { if (typeof active.selectionStart === 'number') selection = [active.selectionStart, active.selectionEnd]; } catch { selection = null; }
  }
  let screen = state.screen;
  if ((screen === 2 || screen === 3) && !state.analysis) screen = state.screen = 1;
  app.innerHTML = `<div class="app-shell screen-${screen}">${SCREENS[screen]()}</div>`;
  if (key) {
    const target = app.querySelector(key);
    if (target) {
      target.focus({ preventScroll: true });
      if (selection && typeof target.setSelectionRange === 'function') {
        try { target.setSelectionRange(...selection); } catch { /* not a text control */ }
      }
    }
  }
}

function allowedScreen(target) {
  let screen = Math.min(Math.max(target, 0), 4);
  if (screen === 4 && !state.draft && !state.generating) screen = 3;
  if (screen >= 2 && !analysisValid()) screen = 1;
  if (screen >= 1 && !state.taskId) screen = 0;
  return screen;
}

let historyDepth = 0;
// Entries from an earlier page load or a restarted session belong to state that no longer exists.
let sessionId = '';
const newSession = () => { sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; };
newSession();

function navigate(screen, { fromHistory = false, replace = false, keepErrors = false } = {}) {
  const changed = screen !== state.screen;
  state.screen = screen;
  state.pendingTask = '';
  state.confirmRestart = false;
  state.confirmReplace = false;
  state.alert = '';
  if (!keepErrors) state.errors = {};
  if (changed) {
    state.copy = { text: '', kind: '' };
    if (screen !== 3) state.optionalOpen = null;
  }
  render();
  if (!fromHistory) {
    if (replace) history.replaceState({ pw: screen, depth: historyDepth, sid: sessionId }, '');
    else if (changed) history.pushState({ pw: screen, depth: ++historyDepth, sid: sessionId }, '');
  }
  if (changed) {
    document.title = `${TITLES[screen]} – PromptWise`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    app.querySelector('.screen-title')?.focus({ preventScroll: true });
  }
}

function goBack() {
  if (state.screen === 0) return;
  // popstate skips entries that no longer lead anywhere new, so one press always moves back a screen.
  if (historyDepth > 0) history.back();
  else navigate(allowedScreen(state.screen - 1), { replace: true });
}

function fieldSelector(key) {
  if (key === 'taskId') return `#task-${state.taskId || TASKS[0].id}`;
  if (key === 'taskDescription') return '#task-description';
  if (key === 'original') return '#original';
  if (key === 'otherFormat') return '#other-format';
  if (key === 'depth' || key === 'format') return `[data-${key}]`;
  if (key in PREFERENCE_LABELS) return `#pref-${key}`;
  return `#detail-${CSS.escape(key)}`;
}

function errorScreen(key) {
  const stage = getValidationFieldMeta(key)?.stage;
  return ({ task: 0, analysis: 1, generation: 3 })[stage] ?? state.screen;
}

function showErrors(fields) {
  const rank = key => getValidationFieldMeta(key)?.order ?? 3;
  const ordered = Object.keys(fields).sort((a, b) => rank(a) - rank(b));
  if (!ordered.length) return;
  state.errors = { ...fields };
  const target = errorScreen(ordered[0]);
  if (target !== state.screen) navigate(target, { keepErrors: true });
  else render();
  // Errors without a visible control on this screen are summarised rather than lost.
  const unplaced = ordered.filter(key => !app.querySelector(fieldSelector(key)));
  if (unplaced.length) {
    state.alert = [...new Set(unplaced.map(key => fields[key]))].join(' ');
    render();
  }
  const first = ordered.map(key => app.querySelector(fieldSelector(key))).find(Boolean) || app.querySelector('.form-alert');
  if (first) {
    if (first.classList.contains('form-alert')) first.setAttribute('tabindex', '-1');
    first.focus();
    if (typeof first.value === 'string' && typeof first.setSelectionRange === 'function' && first.type !== 'radio') {
      try { first.setSelectionRange(first.value.length, first.value.length); } catch { /* not a text control */ }
    }
    first.scrollIntoView({ block: 'center' });
  }
  announce(`Check the highlighted field${ordered.length > 1 ? 's' : ''}. ${fields[ordered[0]]}`);
}

function clearFieldError(key) {
  if (!state.errors[key]) return;
  delete state.errors[key];
  document.getElementById(`err-${key}`)?.remove();
  const elements = key === 'taskId' ? app.querySelectorAll('.task-radio') : [app.querySelector(fieldSelector(key))];
  for (const element of elements) {
    if (!element) continue;
    element.removeAttribute('aria-invalid');
    const ids = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== `err-${key}`);
    if (ids.length) element.setAttribute('aria-describedby', ids.join(' '));
    else element.removeAttribute('aria-describedby');
  }
}

// ---------- Actions ----------

// A ready file record only counts while its text is still in the field.
const liveFile = (key, file) => file.status === 'reading' || file.status === 'pending' || (file.status === 'ready' && Boolean(insertedText(file)) && (state.details[key] || '').includes(insertedText(file)));

const draftEdited = () => Boolean(state.draft) && Boolean(state.improved.trim()) && state.improved !== state.draft.improvedPrompt && state.improved !== state.copiedValue;

function hasTaskDetails() {
  return Object.values(state.details).some(value => clean(value))
    || Object.entries(state.files).some(([key, file]) => liveFile(key, file))
    || draftEdited();
}

function applyTask(id) {
  epoch += 1;
  // Requests from the previous task are now stale; their results are ignored, so clear their busy flags too.
  state.analysing = false;
  state.generating = false;
  state.generateError = '';
  state.taskId = id;
  state.pendingTask = '';
  state.details = {};
  state.files = {};
  state.analysis = null;
  state.analysisKey = '';
  state.expanded = new Set();
  state.optionalOpen = null;
  state.draft = null;
  state.improved = '';
  state.copiedValue = null;
  state.errors = {};
  state.alert = '';
  render();
  if (id === 'other' && !state.pendingTask) announce('Describe your academic task in the field below the task cards.');
}

function selectTask(id, radio) {
  if (id === state.taskId) return;
  if (state.taskId && hasTaskDetails()) {
    radio.checked = false;
    const current = document.getElementById(`task-${state.taskId}`);
    if (current) current.checked = true;
    state.pendingTask = id;
    render();
    app.querySelector('[data-fk="confirm-task"]')?.focus();
    return;
  }
  applyTask(id);
}

function continueFromHome() {
  const input = { taskId: state.taskId, details: state.taskId === 'other' ? { taskDescription: state.details.taskDescription || '' } : {}, preferences: {} };
  const validation = validateInput(input, { stage: 'task' });
  if (!validation.valid) return showErrors(validation.fields);
  navigate(1);
}

async function analyse() {
  if (state.analysing) return;
  const input = analysisInput();
  const validation = validateInput(input, { stage: 'analysis' });
  if (!validation.valid) return showErrors(validation.fields);
  const key = analysisKeyOf(input);
  // Keep the saved first diagnosis while its prompt and task are unchanged.
  if (state.analysis && state.analysisKey === key) return navigate(2);
  const seq = ++analysisSeq;
  const startEpoch = epoch;
  const startScreen = state.screen;
  state.analysing = true;
  state.alert = '';
  render();
  announce('Analysing your prompt…');
  let result = null;
  let failure = null;
  try {
    result = await analyseWorkflow(input);
  } catch (error) {
    failure = error;
  }
  if (seq !== analysisSeq || startEpoch !== epoch) return;
  state.analysing = false;
  const current = key === analysisKeyOf(analysisInput());
  const stillHere = state.screen === startScreen;
  if (result && current) {
    state.analysis = result;
    state.analysisKey = key;
    state.expanded = new Set();
    state.optionalOpen = null;
  }
  if (!stillHere) {
    // The user moved on while the request was pending: keep any current result, but stay where they are.
    if (state.screen === 1) render();
    return;
  }
  if (result && current) return navigate(2);
  if (failure instanceof WorkflowValidationError) return showErrors(failure.fields);
  if (failure) {
    state.alert = 'The analysis could not be completed. Your prompt is unchanged; try again.';
    announce(state.alert);
  } else {
    announce('Your prompt changed during the analysis. Select Analyse Prompt again.');
  }
  render();
  app.querySelector('.form-alert')?.scrollIntoView({ block: 'nearest' });
}

function toPersonalisation() {
  if (!analysisValid()) return analyse();
  navigate(3);
}

function pendingFile() {
  const visible = new Set((state.analysis?.fields || []).map(field => field.key));
  return Object.entries(state.files).find(([key, file]) => visible.has(key) && (file.status === 'reading' || file.status === 'pending'));
}

async function generate({ replace = false } = {}) {
  if (state.generating) return;
  if (!analysisValid()) return analyse();
  const waiting = pendingFile();
  if (waiting) {
    const [key, file] = waiting;
    const message = file.status === 'reading'
      ? `Wait for ${file.name} to finish reading, or cancel it, before creating the prompt.`
      : `Choose whether to replace or add ${file.name}, or cancel it, before creating the prompt.`;
    state.files[key] = { ...file, notice: message };
    const field = state.analysis.fields.find(item => item.key === key);
    if (field && field.priority !== 'recommended') state.optionalOpen = true;
    if (state.screen !== 3) navigate(3, { keepErrors: true });
    else render();
    const target = app.querySelector(file.status === 'reading' ? `[data-fk="file-stop-${key}"]` : `[data-fk="file-replace-${key}"]`);
    target?.focus();
    target?.scrollIntoView({ block: 'center' });
    announce(message);
    return;
  }
  const input = generationInput();
  const validation = validateInput(input, { stage: 'generation' });
  if (!validation.valid) return showErrors(validation.fields);
  if (!replace && state.draft && state.improved !== state.draft.improvedPrompt) {
    state.confirmReplace = true;
    render();
    const bar = app.querySelector('[data-fk="confirm-replace"]');
    bar?.focus();
    bar?.scrollIntoView({ block: 'center' });
    return;
  }
  const seq = ++generateSeq;
  const startEpoch = epoch;
  state.generating = true;
  state.generateError = '';
  navigate(4);
  announce('Assembling your draft…');
  let draft = null;
  let failure = null;
  try {
    draft = await improveWorkflow(input);
  } catch (error) {
    failure = error;
  }
  if (seq !== generateSeq || startEpoch !== epoch) return;
  state.generating = false;
  if (draft) {
    state.draft = { ...draft, key: JSON.stringify(input), input };
    state.improved = draft.improvedPrompt;
    state.copiedValue = null;
    state.copy = { text: '', kind: '' };
  } else if (failure instanceof WorkflowValidationError) {
    if (state.screen === 4) return showErrors(failure.fields);
  } else {
    state.generateError = 'The draft could not be assembled. Your prompt, details and preferences are unchanged.';
  }
  if (state.screen === 4) {
    render();
    app.querySelector('.screen-title')?.focus({ preventScroll: true });
    announce(draft ? 'Your improved prompt is ready to review.' : state.generateError);
  } else if (state.screen === 3) {
    // The user went back while the draft was being assembled: release the busy button and report the outcome here.
    if (!draft) state.alert = state.generateError;
    render();
    if (!draft) app.querySelector('.form-alert')?.scrollIntoView({ block: 'nearest' });
    announce(draft ? 'Your improved prompt is ready. Select Create Improved Prompt to review it, or keep editing.' : state.generateError);
  }
}

function setCopyMessage(text, kind) {
  state.copy = { text, kind };
  const element = document.getElementById('copy-message');
  if (element) {
    element.textContent = text;
    element.className = `copy-message${kind ? ` is-${kind}` : ''}`;
  }
  if (text) announce(text);
}

async function copyDraft() {
  const field = document.getElementById('improved');
  const text = field ? field.value : state.improved;
  state.improved = text;
  if (!text.trim()) {
    setCopyMessage('The prompt box is empty. Add text before copying.', 'error');
    field?.focus();
    return;
  }
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    if (field) {
      field.focus();
      field.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
    }
  }
  if (copied) {
    state.copiedValue = text;
    setCopyMessage('Copied. Paste it into your chosen AI tool.', 'ok');
  } else {
    setCopyMessage('Copy is unavailable here. The text is selected; copy it with your keyboard or menu.', 'error');
  }
}

function restart(force = false) {
  if (!force && draftEdited()) {
    state.confirmRestart = true;
    render();
    app.querySelector('[data-fk="confirm-restart"]')?.focus();
    return;
  }
  epoch += 1;
  analysisSeq += 1;
  generateSeq += 1;
  state = blankState();
  state.screen = -1;
  newSession();
  navigate(0, { replace: true });
}

// ---------- Text files ----------

// Joining and removal trim surrounding whitespace, so file text is matched in its trimmed form.
const insertedText = file => (file?.inserted || '').trim();
const readyRecord = file => file?.status === 'ready' ? { ...file, error: '', notice: '' } : file?.previous || null;

async function readFileInto(key, file) {
  if (!file) return;
  const token = ++readSeq;
  const startEpoch = epoch;
  const previous = readyRecord(state.files[key]);
  state.files[key] = { status: 'reading', name: file.name, token, previous };
  render();
  announce(`Reading ${file.name}`);
  let message = '';
  try {
    const material = await readTextMaterial(file);
    if (startEpoch !== epoch || state.files[key]?.token !== token) return;
    const current = state.details[key] || '';
    if (current.trim()) {
      state.files[key] = { status: 'pending', name: material.name, size: material.size, text: material.text, token, previous };
      message = `${material.name} is ready. Choose whether to replace or add to the current text.`;
    } else {
      state.details[key] = material.text;
      state.files[key] = { status: 'ready', name: material.name, size: material.size, inserted: material.text, token };
      clearFieldError(key);
      message = `Added text from ${material.name}.`;
    }
  } catch (error) {
    if (startEpoch !== epoch || state.files[key]?.token !== token) return;
    message = `${file.name}: ${error?.message || 'This file could not be read. Try another file or paste the relevant extract.'}`;
    state.files[key] = previous ? { ...previous, error: message } : { status: 'error', name: file.name, error: message, token };
  }
  // A late read updates state quietly when the user has moved to another screen; its status shows on return.
  if (state.screen !== 3) return;
  if (!(state.analysis?.fields || []).some(field => field.key === key)) message = `Text from ${file.name} was kept, but this prompt does not use that field.`;
  const focusedHere = document.activeElement?.closest?.(`#field-${CSS.escape(key)} .file-control`);
  render();
  if (focusedHere) fileFocusTarget(key)?.focus();
  announce(message);
}

function fileFocusTarget(key) {
  const file = state.files[key];
  const fk = file?.status === 'pending' ? `file-replace-${key}`
    : file?.status === 'reading' ? `file-stop-${key}`
    : file?.status === 'ready' ? `file-remove-${key}`
    : `file-pick-${key}`;
  return app.querySelector(`[data-fk="${fk}"]`) || app.querySelector(`[data-fk="file-pick-${key}"]`);
}

function fileAction(action, key) {
  const file = state.files[key];
  if (!file) return;
  const current = state.details[key] || '';
  if (action === 'replace' || action === 'append') {
    if (file.status !== 'pending') return;
    const base = current.replace(/\s+$/, '');
    const joined = action === 'append' && base ? `${base}\n\n${file.text}` : file.text;
    state.details[key] = joined;
    // Appending keeps the earlier file's record so removing this one restores it.
    const keep = action === 'append' && file.previous && joined.includes(insertedText(file.previous)) ? file.previous : null;
    state.files[key] = { status: 'ready', name: file.name, size: file.size, inserted: file.text, token: file.token, previous: keep };
    clearFieldError(key);
    announce(action === 'append' ? `Added text from ${file.name} below the current text.` : `Replaced the field with text from ${file.name}.`);
  } else if (action === 'cancel' || action === 'stop') {
    readSeq += 1;
    if (file.previous && liveFile(key, file.previous)) state.files[key] = file.previous;
    else delete state.files[key];
    announce(action === 'stop' ? `Stopped reading ${file.name}. The field is unchanged.` : 'File not added. The field is unchanged.');
  } else if (action === 'remove') {
    const inserted = insertedText(file);
    const index = inserted ? current.lastIndexOf(inserted) : -1;
    if (index >= 0) {
      const before = current.slice(0, index).replace(/\s+$/, '');
      const after = current.slice(index + inserted.length).replace(/^\s+/, '');
      state.details[key] = [before, after].filter(Boolean).join('\n\n');
      if (file.previous && state.details[key].includes(insertedText(file.previous))) state.files[key] = file.previous;
      else delete state.files[key];
      announce(`Removed the text from ${file.name}.`);
    } else {
      state.files[key] = { ...file, edited: true, error: 'The file text was edited, so it was left in place. Edit the field directly or clear it.' };
      announce(state.files[key].error);
    }
  } else if (action === 'clear') {
    state.details[key] = '';
    delete state.files[key];
    announce('Field cleared.');
  } else if (action === 'dismiss') {
    if (file.status === 'error') delete state.files[key];
    else state.files[key] = { ...file, error: '', notice: '' };
  }
  render();
  // The pressed button is usually replaced, so move focus to the next useful control for this field.
  const target = action === 'clear' ? app.querySelector(`#detail-${key}`) : fileFocusTarget(key);
  target?.focus();
}

// ---------- Events ----------

app.addEventListener('click', event => {
  const toggle = event.target.closest('[data-toggle]');
  if (toggle) {
    const key = toggle.dataset.toggle;
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    if (open) state.expanded.add(key);
    else state.expanded.delete(key);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.closest('.criterion')?.classList.toggle('is-open', open);
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));
    if (panel) panel.hidden = !open;
    const all = app.querySelector('[data-action="expand-all"]');
    if (all) all.textContent = state.analysis.criteria.every(row => state.expanded.has(row.key)) ? 'Collapse all' : 'Expand all';
    return;
  }
  const depth = event.target.closest('[data-depth]');
  if (depth) {
    state.preferences.depth = state.preferences.depth === depth.dataset.depth ? '' : depth.dataset.depth;
    clearFieldError('depth');
    render();
    return;
  }
  const format = event.target.closest('[data-format]');
  if (format) {
    state.preferences.format = state.preferences.format === format.dataset.format ? '' : format.dataset.format;
    clearFieldError('format');
    if (state.preferences.format !== 'Other') delete state.errors.otherFormat;
    render();
    if (state.preferences.format === 'Other') {
      app.querySelector('#other-format')?.scrollIntoView({ block: 'nearest' });
      announce('Describe the output format in the required field below.');
    }
    return;
  }
  const pick = event.target.closest('[data-file-pick]');
  if (pick) {
    document.getElementById(`detail-${pick.dataset.filePick}-file`)?.click();
    return;
  }
  const fileButton = event.target.closest('[data-file-action]');
  if (fileButton) {
    fileAction(fileButton.dataset.fileAction, fileButton.dataset.field);
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'back') goBack();
  else if (action === 'continue') continueFromHome();
  else if (action === 'confirm-task') {
    const next = state.pendingTask;
    applyTask(next);
    app.querySelector(`#task-${next}`)?.focus();
    announce(`Switched to ${taskById(next)?.label}. The previous details were cleared.${next === 'other' ? ' Describe your academic task below the task cards.' : ''}`);
  }
  else if (action === 'cancel-task') { state.pendingTask = ''; render(); app.querySelector(`#task-${state.taskId}`)?.focus(); }
  else if (action === 'analyse') analyse();
  else if (action === 'expand-all') {
    const allOpen = state.analysis.criteria.every(row => state.expanded.has(row.key));
    state.expanded = allOpen ? new Set() : new Set(state.analysis.criteria.map(row => row.key));
    render();
  }
  else if (action === 'personalise') toPersonalisation();
  else if (action === 'generate' || action === 'regenerate') generate();
  else if (action === 'retry-generate') generate({ replace: !state.draft });
  else if (action === 'confirm-replace') generate({ replace: true });
  else if (action === 'keep-draft') { if (state.screen === 4) { state.confirmReplace = false; render(); app.querySelector('#improved')?.focus(); } else navigate(4); }
  else if (action === 'copy') copyDraft();
  else if (action === 'restart') restart();
  else if (action === 'confirm-restart') restart(true);
  else if (action === 'cancel-restart') { state.confirmRestart = false; render(); app.querySelector('[data-fk="restart"]')?.focus(); }
});

app.addEventListener('input', event => {
  const target = event.target;
  if (target.matches('[data-original]')) {
    state.original = target.value;
    clearFieldError('original');
  } else if (target.matches('[data-detail]')) {
    const key = target.dataset.detail;
    state.details[key] = target.value;
    clearFieldError(key);
    if (key === 'taskDescription') {
      const length = target.value.trim().length;
      const count = document.getElementById('task-description-count');
      if (count) {
        count.textContent = `${length} / ${CUSTOM_TASK_MAX_LENGTH} characters`;
        count.classList.toggle('is-over', length > CUSTOM_TASK_MAX_LENGTH);
      }
      const warning = document.getElementById('task-description-warning');
      if (warning) {
        const warnings = descriptionWarnings(target.value);
        warning.textContent = warnings.join(' ');
        warning.hidden = !warnings.length;
      }
    }
    const file = state.files[key];
    if (file?.status === 'ready' && !file.edited && !target.value.includes(insertedText(file))) file.edited = true;
    if (file && (file.error || file.notice) && file.status !== 'pending' && file.status !== 'reading') {
      if (file.status === 'error') delete state.files[key];
      else state.files[key] = { ...file, error: '', notice: '' };
      document.getElementById(`detail-${key}-file-error`)?.remove();
      const pick = app.querySelector(`[data-file-pick="${CSS.escape(key)}"]`);
      if (pick) pick.setAttribute('aria-describedby', `detail-${key}-file-note`);
    }
    // A pending choice no longer has existing text to replace or extend, so show the simpler message.
    if (state.files[key]?.status === 'pending' && !target.value.trim() && state.files[key].hadText !== false) {
      state.files[key].hadText = false;
      render();
    }
    // Emptying the field ends the link to an earlier file.
    if (state.files[key]?.status === 'ready' && !target.value.trim()) {
      delete state.files[key];
      const status = target.closest('.field')?.querySelector('.file-status');
      if (status) status.textContent = '';
    }
    const count = target.closest('.optional-group')?.querySelector('.optional-count');
    if (count) count.textContent = optionalCountText();
  } else if (target.matches('[data-pref]')) {
    state.preferences[target.dataset.pref] = target.value;
    clearFieldError(target.dataset.pref);
  } else if (target.matches('[data-improved]')) {
    state.improved = target.value;
    if (state.copy.text) setCopyMessage('', '');
  }
});

app.addEventListener('change', event => {
  const target = event.target;
  if (target.matches('.task-radio')) {
    selectTask(target.value, target);
  } else if (target.matches('[data-file-input]')) {
    const file = target.files?.[0];
    target.value = '';
    readFileInto(target.dataset.fileInput, file);
  } else if (target.matches('select[data-pref]')) {
    state.preferences[target.dataset.pref] = target.value;
    clearFieldError(target.dataset.pref);
  }
});

// <details> toggle events do not bubble, so listen during capture.
app.addEventListener('toggle', event => {
  if (event.target.matches?.('[data-optional]')) state.optionalOpen = event.target.open;
}, true);

window.addEventListener('popstate', event => {
  const depth = Number.isInteger(event.state?.depth) ? event.state.depth : 0;
  const direction = depth < historyDepth ? -1 : 1;
  historyDepth = depth;
  if (event.state?.sid !== sessionId) {
    // Step over entries from a previous session in the direction the user was moving.
    if (direction < 0) history.back();
    else history.forward();
    return;
  }
  const requested = Number.isInteger(event.state?.pw) ? event.state.pw : 0;
  const screen = allowedScreen(requested);
  if (screen !== requested) history.replaceState({ pw: screen, depth, sid: sessionId }, '');
  // An entry whose prerequisites are gone resolves to the current screen; step over it instead of
  // leaving the user pressing Back (or Forward) with nothing happening.
  if (screen === state.screen) {
    if (direction < 0) { history.back(); return; }
    if (direction > 0) { history.forward(); return; }
  }
  navigate(screen, { fromHistory: true });
});

// Keep a focused control clear of the sticky mobile action bar, which a fixed scroll padding cannot do for tall fields.
let lastPointer = 0;
document.addEventListener('pointerdown', () => { lastPointer = Date.now(); }, true);
app.addEventListener('focusin', event => {
  // Pointer focus happens on press; scrolling then would move the control away before the release.
  if (Date.now() - lastPointer < 800) return;
  const bar = app.querySelector('.action-bar');
  const target = event.target;
  if (!bar || bar.contains(target) || getComputedStyle(bar).position !== 'sticky') return;
  const barTop = bar.getBoundingClientRect().top;
  const rect = target.getBoundingClientRect();
  if (rect.bottom > barTop - 8) window.scrollBy({ top: Math.min(rect.bottom - barTop + 16, Math.max(rect.top - 16, 0)), behavior: 'instant' });
});

desktop.addEventListener('change', () => {
  if (state.screen === 2) render();
});

// A reload starts a fresh in-memory session at Home but keeps the tab's existing history depth.
historyDepth = Number.isInteger(history.state?.depth) ? history.state.depth : 0;
history.replaceState({ pw: 0, depth: historyDepth, sid: sessionId }, '');
document.title = `${TITLES[0]} – PromptWise`;
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
