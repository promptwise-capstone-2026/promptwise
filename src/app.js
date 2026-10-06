import { TASKS, FORMATS, LEVELS, TONES, DEPTHS, getTask } from './tasks.js';
import { analysePrompt, generatePrompt } from './rules.js';

const app = document.querySelector('#app');
const state = {
  screen: 0,
  taskId: '',
  original: '',
  details: {},
  preferences: {},
  improved: '',
  message: ''
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const selected = value => value ? ' is-selected' : '';
const statusClass = status => status === 'Present' ? 'present' : status === 'Partial' ? 'partial' : status === 'Missing' ? 'missing' : 'na';

function header() {
  if (state.screen === 0) return `<header class="home-head"><h1 class="brand">PromptWise</h1><p class="tagline">Improve your prompts. Get better AI responses.</p></header>`;
  return `<header class="page-head">
    <button class="back-button" type="button" data-action="back" aria-label="Go back">&lt; Back</button>
    <div class="brand">PromptWise</div>
    <p class="task-name">${esc(getTask(state.taskId).label)}</p>
    <div class="head-rule"></div>
    <p class="step-count">Step ${state.screen + 1} of 5</p>
  </header>`;
}

function footer(label, action, disabled = false) {
  return `<div class="action-wrap"><button class="primary-button" type="button" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button></div>`;
}

function home() {
  return `${header()}<main class="content home-content">
    <h2>What are you working on?</h2>
    <div class="task-grid" role="group" aria-label="Choose an academic task">
      ${TASKS.map(task => `<button type="button" class="task-card${selected(state.taskId === task.id)}" data-task="${task.id}" aria-pressed="${state.taskId === task.id}"><span>${esc(task.label)}</span></button>`).join('')}
    </div>
    <p class="support-text">Choose the task that best fits your goal. You can add details later.</p>
  </main>${footer('Continue', 'continue', !state.taskId)}`;
}

function promptInput() {
  const task = getTask(state.taskId);
  return `${header()}<main class="content">
    <h1>Improve your prompt</h1>
    <label class="field-label" for="original">What would you like AI to help you?</label>
    <textarea id="original" class="prompt-input" data-original placeholder="${esc(task.promptHint)}" spellcheck="true">${esc(state.original)}</textarea>
    <p class="support-text">Write your first version. You can keep it short and add useful details after the analysis.</p>
    ${state.message ? `<p class="form-message" role="alert">${esc(state.message)}</p>` : ''}
  </main>${footer('Analyse Prompt', 'analyse')}`;
}

function analysis() {
  const rows = analysePrompt({ taskId: state.taskId, original: state.original });
  const needs = rows.filter(row => row.status === 'Missing' || row.status === 'Partial');
  return `${header()}<main class="content">
    <h1>Prompt Analysis</h1>
    <h2 class="section-title">Original Prompt</h2>
    <div class="original-box">${esc(state.original)}</div>
    <div class="section-heading"><h2>Prompt Evaluation</h2><span class="small-note">Guidance, not a score</span></div>
    <div class="evaluation-list">
      ${rows.map(row => `<div class="evaluation ${statusClass(row.status)}"><div class="evaluation-top"><strong>${esc(row.label)}</strong><span>${esc(row.status)}</span></div><p>${esc(row.reason)}</p>${row.suggestion ? `<p class="suggestion">${esc(row.suggestion)}</p>` : ''}</div>`).join('')}
    </div>
    <details class="method-note"><summary>How this analysis works</summary><p>PromptWise checks visible words and task details with local rules. It marks each relevant criterion Present, Partial, Missing, or N/A. It does not call an AI service or judge whether facts are correct. Review each suggestion before using it.</p></details>
    ${needs.length ? `<p class="support-text">Add the details you know on the next screen. You can leave genuinely unknown information blank.</p>` : `<p class="support-text">Your prompt already contains the active details we can detect. You can still personalise the response.</p>`}
  </main>${footer('Improve My Prompt', 'personalise')}`;
}

function field(field) {
  const id = `detail-${field.key}`;
  const value = state.details[field.key] || '';
  return `<div class="field"><label class="field-label" for="${id}">${esc(field.label)}</label>${field.multiline
    ? `<textarea id="${id}" data-detail="${field.key}" class="text-field multiline" placeholder="${esc(field.placeholder)}">${esc(value)}</textarea>`
    : `<input id="${id}" data-detail="${field.key}" class="text-field" value="${esc(value)}" placeholder="${esc(field.placeholder)}" />`}</div>`;
}

function selectField(label, key, options) {
  return `<div class="field"><label class="field-label" for="pref-${key}">${label}</label><select id="pref-${key}" class="text-field" data-pref="${key}"><option value="">Optional — choose if useful</option>${options.map(option => `<option value="${esc(option)}" ${state.preferences[key] === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></div>`;
}

function personalisation() {
  const task = getTask(state.taskId);
  return `${header()}<main class="content">
    <h1>Prompt Personalisation</h1>
    <p class="intro">Add details that matter for <strong>${esc(task.label.toLowerCase())}</strong>. These are combined with your original words.</p>
    <div class="form-stack">${task.fields.map(field).join('')}
      ${field({ key: 'constraints', label: 'Other requirements or limits', placeholder: 'Optional: e.g. use only supplied material, Australian English, or a word limit' })}
    </div>
    <h2 class="subheading">Response preferences</h2>
    ${selectField('Educational level', 'level', LEVELS)}
    <div class="field"><label class="field-label" for="pref-audience">Specific audience</label><input id="pref-audience" data-pref="audience" class="text-field" value="${esc(state.preferences.audience || '')}" placeholder="Optional: e.g. my tutorial group" /></div>
    <div class="field"><span class="field-label" id="depth-label">How detailed should the answer be?</span><div class="choice-row" role="group" aria-labelledby="depth-label">${DEPTHS.map(depth => `<button type="button" class="choice${selected(state.preferences.depth === depth)}" data-depth="${esc(depth)}" aria-pressed="${state.preferences.depth === depth}">${esc(depth)}</button>`).join('')}</div><p class="field-help">Optional preference, not a quality criterion.</p></div>
    ${selectField('Preferred response tone', 'tone', TONES)}
    <div class="field"><span class="field-label" id="format-label">Output format</span><div class="format-grid" role="group" aria-labelledby="format-label">${FORMATS.map(format => `<button type="button" class="choice${selected(state.preferences.format === format)}" data-format="${esc(format)}" aria-pressed="${state.preferences.format === format}">${esc(format)}</button>`).join('')}</div></div>
    ${state.preferences.format === 'Other' ? `<div class="field"><label class="field-label" for="other-format">Describe the format</label><input id="other-format" data-pref="otherFormat" class="text-field" value="${esc(state.preferences.otherFormat || '')}" placeholder="e.g. a two-column comparison" /></div>` : ''}
  </main>${footer('Generate Improved Prompt', 'generate')}`;
}

function comparison() {
  const after = analysePrompt({ taskId: state.taskId, original: state.original, details: state.details, preferences: state.preferences });
  const missingSource = after.find(row => row.key === 'source' && (row.status === 'Missing' || row.status === 'Partial'));
  return `${header()}<main class="content">
    <h1>Compare the prompts</h1>
    <p class="intro">Review and edit the improved prompt before you copy it.</p>
    <h2 class="section-title">Original Prompt</h2><div class="compare-box">${esc(state.original)}</div>
    <label class="field-label improved-label" for="improved">Improved Prompt <span class="editable-tag">Editable</span></label>
    <textarea id="improved" class="improved-input" data-improved spellcheck="true">${esc(state.improved)}</textarea>
    ${missingSource ? `<p class="source-note">${esc(missingSource.suggestion || missingSource.reason)}</p>` : ''}
    <p class="responsible-note">Check facts, sources, and your assessment requirements before using any AI response.</p>
    <p class="copy-message" role="status" aria-live="polite">${esc(state.message)}</p>
    <div class="button-stack"><button class="copy-button" type="button" data-action="copy">Copy Prompt</button><button class="restart-button" type="button" data-action="restart">Improve another prompt</button></div>
  </main>`;
}

function render() {
  app.innerHTML = `<div class="app-shell">${[home, promptInput, analysis, personalisation, comparison][state.screen]()}</div>`;
}

function navigate(screen) {
  state.screen = screen;
  state.message = '';
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

app.addEventListener('click', async event => {
  const taskButton = event.target.closest('[data-task]');
  if (taskButton) {
    if (state.taskId !== taskButton.dataset.task) {
      state.taskId = taskButton.dataset.task;
      state.details = {};
      state.preferences = {};
    }
    render();
    return;
  }
  const formatButton = event.target.closest('[data-format]');
  if (formatButton) {
    state.preferences.format = state.preferences.format === formatButton.dataset.format ? '' : formatButton.dataset.format;
    render();
    return;
  }
  const depthButton = event.target.closest('[data-depth]');
  if (depthButton) {
    state.preferences.depth = state.preferences.depth === depthButton.dataset.depth ? '' : depthButton.dataset.depth;
    render();
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'back') navigate(Math.max(0, state.screen - 1));
  if (action === 'continue' && state.taskId) navigate(1);
  if (action === 'analyse') {
    if (!state.original.trim()) {
      state.message = 'Enter a prompt before analysing it.';
      render();
      document.querySelector('#original')?.focus();
    } else navigate(2);
  }
  if (action === 'personalise') navigate(3);
  if (action === 'generate') {
    state.improved = generatePrompt({ taskId: state.taskId, original: state.original, details: state.details, preferences: state.preferences });
    navigate(4);
  }
  if (action === 'restart') {
    state.screen = 0;
    state.taskId = '';
    state.original = '';
    state.details = {};
    state.preferences = {};
    state.improved = '';
    state.message = '';
    render();
    window.scrollTo(0, 0);
  }
  if (action === 'copy') {
    try {
      await navigator.clipboard.writeText(state.improved);
      state.message = 'Copied to clipboard.';
    } catch {
      const input = document.querySelector('#improved');
      input.focus();
      input.select();
      state.message = document.execCommand('copy') ? 'Copied to clipboard.' : 'Copy is unavailable here. Select the text and copy it manually.';
    }
    document.querySelector('.copy-message').textContent = state.message;
  }
});

app.addEventListener('input', event => {
  const target = event.target;
  if (target.matches('[data-original]')) state.original = target.value;
  if (target.matches('[data-detail]')) state.details[target.dataset.detail] = target.value;
  if (target.matches('[data-pref]')) state.preferences[target.dataset.pref] = target.value;
  if (target.matches('[data-improved]')) state.improved = target.value;
});
app.addEventListener('change', event => {
  const target = event.target;
  if (target.matches('[data-pref]')) state.preferences[target.dataset.pref] = target.value;
});

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
