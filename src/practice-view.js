import { TASKS } from './tasks.js';
import { CRITERION_STATUS } from './workflow.js';
import { MAX_RECORDS } from './practice.js';
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const taskName = id => TASKS.find(t=>t.id===id)?.label || 'Academic task';
const short = s => s.length>110?s.slice(0,109)+'…':s;
const when = v => new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const modeName = m => m==='openai'?'OpenAI':'Local rules';
const cohortName = r => `${modeName(r.analysis.mode)}${r.analysis.model?` · ${r.analysis.model}`:''}`;
export function historyControls({enabled,error,count=0,compact=false}) {
  const choice=`<label class="remember-choice" for="practice-enabled"><input type="checkbox" id="practice-enabled" data-practice-enable aria-describedby="practice-privacy"${enabled?' checked':''}> Save history on this device</label>`;
  const privacy='<p class="field-help" id="practice-privacy">Saves prompts, results and accepted material text in this browser only. No account or device sync. Avoid sensitive work and shared devices.</p>';
  if(compact)return `<section class="history-short" aria-label="Optional history"><div class="section-heading">${choice}<a href="#history" data-nav="history">History${count?` (${count})`:''}</a></div>${privacy}${error?`<p class="notice notice-error" role="alert">${esc(error)} <a href="#history" data-nav="history">Manage history</a></p>`:''}</section>`;
  return `<section class="surface history-settings" aria-labelledby="history-settings-heading">
    <h2 id="history-settings-heading">History settings</h2>${choice}${privacy}
    <details class="history-privacy"><summary>What is saved?</summary><p class="field-help">History keeps your original prompt, its evaluation, generated draft and latest edited version. Your unfinished prompt, preferences and accepted material text can also be recovered after refresh. Original files and pending file choices are not saved. Separate material fields are not kept in history entries, but prompts and rewrites may contain source text. Browser data can be lost; export anything important.</p></details>
    <p class="field-help" id="practice-save-status" role="status">${enabled?`Saving on · ${count} of ${MAX_RECORDS} attempts saved on this device.`:'Saving off. Work stays in this tab until you leave or refresh.'}</p>
    ${error?`<p class="notice notice-error" role="alert">${esc(error)}</p><button type="button" class="ghost-button small" data-action="retry-save">Retry saving</button>`:''}
    ${(enabled||error)?'<div class="confirm-actions"><button type="button" class="ghost-button small" data-action="export-practice">Export history (JSON)</button><button type="button" class="ghost-button small" data-action="clear-practice">Remove saved data &amp; turn saving off</button></div>':''}
  </section>`;
}
function historyDetail(r) {
  return `<section class="surface history-detail" aria-labelledby="saved-heading">
    <h2 id="saved-heading">${esc(taskName(r.taskId))}</h2>
    <p class="field-help">${esc(when(r.createdAt))} · ${esc(cohortName(r))}${r.example?' · Practice example':''}</p>
    ${r.taskDescription?`<p>${esc(r.taskDescription)}</p>`:''}
    <h3>Original prompt</h3><div class="prompt-box" role="region" tabindex="0" aria-label="Saved original prompt">${esc(r.original)}</div>
    <h3>Initial evaluation</h3><p class="field-help">This reviews the original prompt before personalisation. It is not a grade. Select a criterion to read its explanation.</p>
    <ul class="saved-criteria">${r.analysis.criteria.map(c=>{const meta=CRITERION_STATUS[c.status]||CRITERION_STATUS['N/A'];return `<li class="criterion criterion-${meta.cls}"><details><summary><span class="criterion-name">${esc(c.label)}</span><span class="status-badge status-${meta.cls}"><span class="status-icon" aria-hidden="true">${meta.icon}</span>${esc(c.status)}${meta.spoken?`<span class="sr-only"> (${meta.spoken})</span>`:''}</span></summary><p>${esc(c.reason)}</p>${c.suggestion?`<p><strong>Suggestion:</strong> ${esc(c.suggestion)}</p>`:''}</details></li>`;}).join('')}</ul>
    ${r.analysis.warnings.length?`<ul>${r.analysis.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:''}
    ${r.rewrite?`<label class="field-label" for="saved-prompt">Your last edited prompt <span class="optional-tag">Saved copy</span></label><textarea id="saved-prompt" class="improved-input" readonly>${esc(r.rewrite.edited)}</textarea>
      <button class="copy-button" type="button" data-action="copy-saved" data-record="${r.id}">Copy saved prompt</button>
      <details><summary>Generated draft before your edits</summary><div class="prompt-box">${esc(r.rewrite.generated)}</div></details>
      <p class="field-help">Rewrite mode: ${esc(modeName(r.rewrite.mode))}${r.rewrite.model?` · ${esc(r.rewrite.model)}`:''}. No separate evaluation of the rewrite was performed.</p>
      ${r.rewrite.warnings.length?`<ul>${r.rewrite.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:''}`:'<p class="notice notice-info">Only the initial evaluation is saved so far. No improved prompt has been generated for this attempt.</p>'}
    <p class="field-help">Original files and separate material fields are not included in this history entry. Its original prompt or rewrite may still contain source text.</p>
    <div class="confirm-actions"><button class="secondary-button" type="button" data-action="reuse-saved" data-record="${r.id}">Use original for a new attempt</button><button class="ghost-button" type="button" data-action="delete-saved" data-record="${r.id}">Delete saved attempt</button></div>
  </section>`;
}
export function renderHistory({data,enabled,error,selectedId=''}) {
  const records=data.records,selected=records.find(r=>r.id===selectedId);
  const body=selectedId?(selected?historyDetail(selected):'<p class="notice notice-info">This saved attempt is no longer available. <a href="#history" data-nav="history">Return to history</a>.</p>'):
    records.length?`<p class="support-text">${records.length} saved attempts on this device.</p><ul class="history-list">${[...records].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(r=>`<li><a href="#history/${r.id}" data-nav="history" data-record="${r.id}" class="surface history-card"><span class="section-heading"><strong>${esc(taskName(r.taskId))}</strong><span class="optional-tag">${r.example?'Example':'Your attempt'}</span></span><span>${esc(short(r.original))}</span><span class="field-help">${esc(when(r.createdAt))} · ${esc(modeName(r.analysis.mode))} · ${r.rewrite?'Draft saved':'Evaluation saved'}</span></a></li>`).join('')}</ul>`:
    '<section class="surface history-empty"><h2>No saved prompts yet</h2><p>Enable Save history on this device, then analyse a prompt. Your evaluation is saved before you create an improved prompt.</p></section>';
  return `<header class="home-head"><p class="brand brand-small">PromptWise</p></header><main class="content practice-page" id="main" tabindex="-1"><h1 class="screen-title" tabindex="-1" data-fk="screen-title">History</h1><p class="intro">Prompts saved in this browser. They are not shared with other devices.</p><nav class="practice-nav" aria-label="History navigation"><a href="#history" data-nav="history"${selectedId?'':' aria-current="page"'}>All attempts</a><button class="ghost-button small" data-action="close-about" type="button">Return to prompt</button></nav>${body}${historyControls({enabled,error,count:records.length})}</main>`;
}
