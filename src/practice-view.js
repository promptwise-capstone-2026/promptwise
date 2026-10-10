import { TASKS } from './tasks.js';
import { cohortKey, summarisePractice, MAX_RECORDS } from './practice.js';
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const taskName = id => TASKS.find(t=>t.id===id)?.label || 'Academic task';
const short = s => s.length>110?s.slice(0,109)+'…':s;
const when = v => new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const modeName = m => m==='openai'?'OpenAI':'Local rules';
const cohortName = r => `${modeName(r.analysis.mode)} · ${r.analysis.model || 'browser checks'} · ${r.analysis.frameworkVersion}`;
export function profileControls({enabled,error,count=0}) {
  return `<section class="surface profile-panel" aria-labelledby="profile-heading">
    <div class="section-heading"><h2 id="profile-heading">Demo learner <span class="optional-tag">Local demo profile</span></h2><a href="#practice" data-nav="practice">My practice</a></div>
    <p class="field-help">One profile in this browser. No sign-in, cloud backup or cross-device sync yet.</p>
    <label class="remember-choice" for="practice-enabled"><input type="checkbox" id="practice-enabled" data-practice-enable aria-describedby="practice-privacy"${enabled?' checked':''}> Remember my work on this device</label>
    <p class="field-help" id="practice-privacy">Saves text locally, including accepted material. Avoid saving sensitive work or using this on a shared device.</p>
    <details class="profile-privacy"><summary>What is saved?</summary><p class="field-help">Prompts, evaluations, edited drafts, preferences and accepted material text can be recovered. Original files and pending file choices are not saved. History entries omit separate material fields, but a prompt or rewrite can still contain source text. Exported JSON can contain accepted material from your current session.</p></details>
    <p class="field-help" id="practice-save-status" role="status">${enabled?`Local saving on · ${count} of ${MAX_RECORDS} attempts saved. Browser data can be cleared; export anything important.`:'Saving off. Your work stays in this tab until you leave or refresh.'}</p>
    ${error?`<p class="notice notice-error" role="alert">${esc(error)}</p><button type="button" class="ghost-button small" data-action="retry-save">Retry saving</button>`:''}
    ${(enabled||error)?'<div class="confirm-actions"><button type="button" class="ghost-button small" data-action="export-practice">Export saved work (JSON)</button><button type="button" class="ghost-button small" data-action="clear-practice">Remove saved data &amp; turn saving off</button></div>':''}
  </section>`;
}
function historyDetail(r) {
  return `<section class="surface history-detail" aria-labelledby="saved-heading">
    <div class="section-heading"><h2 id="saved-heading">${esc(taskName(r.taskId))}</h2><a href="#history" data-nav="history">All attempts</a></div>
    <p class="field-help">${esc(when(r.createdAt))} · ${esc(cohortName(r))}${r.example?' · Practice example (excluded from dashboard)':''}</p>
    ${r.taskDescription?`<p>${esc(r.taskDescription)}</p>`:''}
    <h3>Original prompt</h3><div class="prompt-box" role="region" tabindex="0" aria-label="Saved original prompt">${esc(r.original)}</div>
    <h3>Initial evaluation</h3><p class="field-help">This reviews the original prompt before personalisation. It is not a grade. Select a criterion to read its explanation.</p>
    <ul class="saved-criteria">${r.analysis.criteria.map(c=>`<li><details><summary><span>${esc(c.label)}</span><strong>${esc(c.status)}</strong></summary><p>${esc(c.reason)}</p>${c.suggestion?`<p><strong>Suggestion:</strong> ${esc(c.suggestion)}</p>`:''}</details></li>`).join('')}</ul>
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
export function renderPractice({data,enabled,error,view='dashboard',selectedId='',taskFilter='',cohortFilter=''}) {
  const records=data.records,real=records.filter(r=>!r.example).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const taskId=TASKS.some(t=>t.id===taskFilter)?taskFilter:real[0]?.taskId||'study';
  const cohortRows=[...new Map(real.filter(r=>r.taskId===taskId).map(r=>[cohortKey(r),r])).values()];
  const cohort=cohortRows.some(r=>cohortKey(r)===cohortFilter)?cohortFilter:cohortRows[0]?cohortKey(cohortRows[0]):'';
  const stats=summarisePractice(records,{taskId,cohort});
  const tips=stats.criteria.filter(c=>c.review).sort((a,b)=>b.review-a.review).slice(0,1);
  let body='';
  if(view==='history') {
    const selected=records.find(r=>r.id===selectedId);
    if(selectedId) body=selected?historyDetail(selected):'<p class="notice notice-info">This saved attempt is no longer available. <a href="#history" data-nav="history">Return to history</a>.</p>';
    else body=records.length?`<p class="support-text">${records.length} saved attempts. Examples are labelled and do not count towards your practice patterns.</p><ul class="history-list">${[...records].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(r=>`<li><a href="#history/${r.id}" data-nav="history" data-record="${r.id}" class="surface history-card"><span class="section-heading"><strong>${esc(taskName(r.taskId))}</strong><span class="optional-tag">${r.example?'Example':'Your attempt'}</span></span><span>${esc(short(r.original))}</span><span class="field-help">${esc(when(r.createdAt))} · ${esc(modeName(r.analysis.mode))} · ${r.rewrite?'Draft saved':'Evaluation saved'}</span></a></li>`).join('')}</ul>`:'<div class="surface practice-empty"><h2>Your history starts with your next review</h2><p>Turn on local saving, then analyse your own prompt. You can save an evaluation before creating an improved prompt.</p></div>';
  } else {
    body=`<p class="intro">Notice useful habits and choose one thing to try next. These are patterns in initial reviews, not a score or a measure of your ability.</p>
      <div class="practice-filters"><div class="field"><label for="practice-task" class="field-label">Academic task</label><select id="practice-task" class="text-field" data-practice-task>${TASKS.map(t=>`<option value="${t.id}"${t.id===taskId?' selected':''}>${esc(t.label)}</option>`).join('')}</select></div><div class="field"><label for="practice-cohort" class="field-label">Comparable review group</label><select id="practice-cohort" class="text-field" data-practice-cohort${cohortRows.length?'':' disabled'}>${cohortRows.length?cohortRows.map(r=>`<option value="${esc(cohortKey(r))}"${cohortKey(r)===cohort?' selected':''}>${esc(cohortName(r))}</option>`).join(''):'<option>No personal reviews for this task yet</option>'}</select></div></div>
      <p class="field-help selected-review-group">${cohortRows.length?`Selected group: ${esc(cohortName(cohortRows.find(r=>cohortKey(r)===cohort)))}. `:''}Tasks, review modes, models and framework versions are kept separate. Practice examples are excluded. N/A is excluded from applicable counts.</p>
      ${stats.count?`<section class="surface next-practice"><h2>One useful next step</h2><p>${stats.count} personal ${stats.count===1?'review':'reviews'} in this group.</p>${tips.length?tips.map(c=>`<p><strong>${esc(c.label)}:</strong> ${c.review} of ${c.applicable} applicable reviews suggested clarification. ${esc(c.tip)}</p>`).join(''):'<p>No clarification patterns were flagged in these reviews. Try a new question and keep checking whether the guidance fits your goal.</p>'}<p class="field-help">Different goals can need different details. Review judgements can be wrong; a change in these counts alone does not prove learning.</p></section>
      <section aria-labelledby="pattern-heading"><h2 id="pattern-heading">What your reviews suggested</h2><ul class="pattern-list">${stats.criteria.map(c=>`<li class="surface pattern-card"><div class="section-heading"><h3>${esc(c.label)}</h3><strong>${c.applicable?`${c.review} / ${c.applicable} needed clarification`:'Not applicable in these reviews'}</strong></div><div class="pattern-track" aria-hidden="true"><span style="width:${c.applicable?Math.round(c.review/c.applicable*100):0}%"></span></div><p class="field-help">Present ${c.counts.Present} · Partial ${c.counts.Partial} · Missing ${c.counts.Missing} · N/A ${c.counts['N/A']}</p><p>${esc(c.tip)}</p></li>`).join('')}</ul></section>
      <section class="surface timeline-section" aria-labelledby="timeline-heading"><h2 id="timeline-heading">Your practice over time</h2><p class="field-help">Each row is a different original-prompt attempt. Generated rewrites do not count as new attempts.</p><div class="table-scroll" role="region" tabindex="0" aria-label="Initial review history"><table class="practice-table"><caption>Initial evaluation statuses — ${esc(taskName(taskId))}</caption><thead><tr><th scope="col">Attempt</th><th scope="col">Present</th><th scope="col">Partial</th><th scope="col">Missing</th><th scope="col">N/A</th></tr></thead><tbody>${stats.timeline.map((r,i)=>`<tr><th scope="row"><a href="#history/${r.id}" data-nav="history" data-record="${r.id}">${i+1} · ${esc(when(r.date))}</a></th><td>${r.counts.Present}</td><td>${r.counts.Partial}</td><td>${r.counts.Missing}</td><td>${r.counts['N/A']}</td></tr>`).join('')}</tbody></table></div></section>`:'<section class="surface practice-empty"><h2>Build your own practice story</h2><p>Analyse your own prompt with local saving enabled. Examples are useful for exploring the app and stay in History, but they do not count as your personal progress.</p><p>Start with one prompt. There is no target score to reach.</p></section>'}`;
  }
  return {taskId,cohort,html:`<header class="home-head"><p class="brand brand-small">PromptWise</p><p class="tagline">Demo learner · local profile</p></header><main class="content practice-page" id="main" tabindex="-1"><h1 class="screen-title" tabindex="-1" data-fk="screen-title">${view==='history'?'Saved attempts':'My practice'}</h1><nav class="practice-nav" aria-label="Practice pages"><a href="#practice" data-nav="practice"${view==='dashboard'?' aria-current="page"':''}>Learning dashboard</a><a href="#history" data-nav="history"${view==='history'?' aria-current="page"':''}>History</a><button class="ghost-button small" data-action="close-about" type="button">Return to prompt</button></nav>${body}${profileControls({enabled,error,count:records.length})}</main>`};
}
