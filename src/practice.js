import { TASKS, PREFERENCE_LABELS } from './tasks.js';
import { CRITERIA } from './rules.js';
import { analysisFingerprint } from './workflow.js';

export const PRACTICE_KEY = 'promptwise.practice.v1';
export const FRAMEWORK_VERSION = 'criteria-2026-10-10-v1';
export const MAX_RECORDS = 50;
export const MAX_STORAGE_CHARS = 1_800_000;
const modes = new Set(['local-rules', 'openai']);
const statuses = new Set(['Present', 'Partial', 'Missing', 'N/A']);
const taskIds = new Set(TASKS.map(t => t.id));
const detailKeys = new Set(['taskDescription', 'constraints', ...TASKS.flatMap(t => t.fields.map(f => f.key))]);
const clone = value => JSON.parse(JSON.stringify(value));
// Keep the v1 envelope compatible so existing saved history is preserved.
// Its legacy profile metadata is not an account or an authentication identity.
const empty = () => ({ schema: 1, profile: { id: 'demo-local', name: 'Demo learner' }, records: [], current: null });
const plain = v => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
function text(v, max = 1_000_000) { if (typeof v !== 'string' || v.length > max) throw new Error('Invalid saved text.'); return v; }
function identifier(v) { if (typeof v !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(v)) throw new Error('Invalid saved identifier.'); return v; }
function date(v) { if (typeof v !== 'string' || !Number.isFinite(Date.parse(v))) throw new Error('Invalid saved date.'); return v; }
function mode(v) { if (!modes.has(v)) throw new Error('Invalid saved review mode.'); return v; }
function map(v, keys) {
  if (!plain(v)) throw new Error('Invalid saved details.');
  return Object.fromEntries(Object.entries(v).filter(([k]) => keys.has(k)).map(([k, value]) => [k, text(value)]));
}
function input(v) {
  if (!plain(v) || !taskIds.has(v.taskId)) throw new Error('Invalid saved task.');
  return { taskId: v.taskId, original: text(v.original), details: map(v.details, detailKeys), preferences: map(v.preferences, new Set([...Object.keys(PREFERENCE_LABELS), 'otherFormat'])) };
}
function warnings(v) { if (!Array.isArray(v) || v.length > 100) throw new Error('Invalid saved warnings.'); return v.map(s => text(s, 20_000)); }
function analysis(v) {
  if (!plain(v) || !Array.isArray(v.criteria) || v.criteria.length !== 7 || new Set(v.criteria.map(r => r?.key)).size !== 7) throw new Error('Invalid saved evaluation.');
  return { mode: mode(v.mode), model: text(v.model || '', 200), frameworkVersion: text(v.frameworkVersion || FRAMEWORK_VERSION, 100), inputFingerprint: text(v.inputFingerprint), warnings: warnings(v.warnings || []), criteria: CRITERIA.map(([key, label]) => {
    const row = v.criteria.find(r => r.key === key);
    if (!row || !statuses.has(row.status)) throw new Error('Invalid saved criterion.');
    return { key, label, status: row.status, reason: text(row.reason, 30_000), suggestion: text(row.suggestion || '', 30_000) };
  }) };
}
function draft(v) {
  if (v == null) return null;
  if (!plain(v)) throw new Error('Invalid saved rewrite.');
  return { mode: mode(v.mode), model: text(v.model || '', 200), improvedPrompt: text(v.improvedPrompt), warnings: warnings(v.warnings || []), input: input(v.input), analysisKey: text(v.analysisKey), key: text(v.key) };
}
export function normaliseSnapshot(v) {
  if (v == null) return null;
  if (!plain(v) || !Number.isInteger(v.screen) || v.screen < 0 || v.screen > 4) throw new Error('Invalid saved session.');
  const i = input(v.input), a = v.analysis == null ? null : analysis(v.analysis);
  const diagnostic = {taskId:i.taskId,original:i.original,details:i.taskId==='other'?{taskDescription:i.details.taskDescription||''}:{},preferences:{}};
  if (a && a.inputFingerprint !== analysisFingerprint(diagnostic)) throw new Error('Saved evaluation does not match its prompt.');
  const d = draft(v.draft);
  if (d && (!a || d.analysisKey !== a.inputFingerprint || analysisFingerprint({taskId:d.input.taskId,original:d.input.original,details:d.input.taskId==='other'?{taskDescription:d.input.details.taskDescription||''}:{},preferences:{}}) !== a.inputFingerprint)) throw new Error('Saved rewrite does not match its original evaluation.');
  return { input: i, engine: mode(v.engine), screen: v.screen, continued: v.continued === true, personalised: v.personalised === true, analysis: a, draft: d, improved: text(v.improved || ''), attemptId: v.attemptId ? identifier(v.attemptId) : '', attemptFingerprint: text(v.attemptFingerprint || ''), example: v.example === true, savedAt: date(v.savedAt), materialNotice: v.materialNotice === true };
}
function record(v) {
  if (!plain(v) || !taskIds.has(v.taskId)) throw new Error('Invalid history entry.');
  const a = analysis(v.analysis), original = text(v.original), taskDescription = text(v.taskDescription || '', 240);
  if (a.inputFingerprint !== analysisFingerprint({taskId:v.taskId,original,details:v.taskId==='other'?{taskDescription}:{},preferences:{}})) throw new Error('History evaluation does not match its original prompt.');
  return { id: identifier(v.id), createdAt: date(v.createdAt), updatedAt: date(v.updatedAt), taskId: v.taskId, taskDescription, original, example: v.example === true, analysis: a,
    rewrite: v.rewrite == null ? null : { mode: mode(v.rewrite.mode), model: text(v.rewrite.model || '', 200), generated: text(v.rewrite.generated), edited: text(v.rewrite.edited), warnings: warnings(v.rewrite.warnings || []) } };
}
function envelope(v) {
  if (!plain(v) || v.schema !== 1 || !plain(v.profile) || v.profile.id !== 'demo-local' || !Array.isArray(v.records) || v.records.length > MAX_RECORDS) throw new Error('Unsupported or damaged saved profile.');
  const records = v.records.map(record);
  if (new Set(records.map(r => r.id)).size !== records.length) throw new Error('Duplicate history entries.');
  return {schema:1,profile:{id:'demo-local',name:'Demo learner'},records,current:normaliseSnapshot(v.current)};
}
export function createPracticeStore(storage) {
  let data = empty(), enabled = false, error = '', damaged = false, storedRaw = null;
  try {
    const raw = storage.getItem(PRACTICE_KEY); storedRaw = raw;
    if (raw != null) { if (raw.length > MAX_STORAGE_CHARS) throw new Error('Saved history exceeds its limit.'); data = envelope(JSON.parse(raw)); enabled = true; }
  } catch { error = 'Saved work could not be read. It has not been overwritten. Export the existing file if needed, or remove saved data to start again. The prompt workflow still works.'; damaged = true; }
  function write(next) {
    try {
      if (storage.getItem(PRACTICE_KEY) !== storedRaw) throw new Error('History changed in another tab');
      next = envelope(next);
      const raw = JSON.stringify(next);
      if (raw.length > MAX_STORAGE_CHARS) throw new Error('Storage limit reached');
      if (storedRaw !== raw || !enabled) storage.setItem(PRACTICE_KEY, raw);
      data = next; storedRaw = raw; enabled = true; error = ''; return true;
    } catch { error = `Work was not saved. Storage may be unavailable, changed in another tab, or full (maximum ${MAX_RECORDS} attempts). Export or remove saved entries, then retry. Your open prompt is unchanged.`; return false; }
  }
  return {
    get enabled() {return enabled;}, get error() {return error;},
    read: () => clone(data),
    enable() {return damaged ? false : write(data);},
    save(current, entry = null) {
      if (!enabled || damaged) return false;
      try {
        const next = clone(data); next.current = normaliseSnapshot(current);
        if (entry) {
          const clean = record(entry), at = next.records.findIndex(r => r.id === clean.id);
          if (at < 0) {if (next.records.length >= MAX_RECORDS) throw new Error('History is full'); next.records.push(clean);}
          else next.records[at] = clean;
        }
        return write(next);
      } catch {error = 'Work was not saved. History may be full or this session too large. Export or remove saved entries and retry; your open prompt is unchanged.'; return false;}
    },
    remove(id) {const next = clone(data); next.records = next.records.filter(r => r.id !== id); if(next.current?.attemptId===id)next.current=null; return write(next);},
    clear() {try {storage.removeItem(PRACTICE_KEY);data=empty();storedRaw=null;enabled=false;damaged=false;error='';return true;}catch{error='Saved data could not be removed. Use your browser site-data settings. Saving has not been reported as disabled.';return false;}},
    exportJSON() {if(damaged){try{const raw=storage.getItem(PRACTICE_KEY);if(raw!=null)return raw;}catch{}}return JSON.stringify(data,null,2);}
  };
}
