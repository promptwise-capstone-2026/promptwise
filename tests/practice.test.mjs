import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeStore, PRACTICE_KEY, FRAMEWORK_VERSION, MAX_RECORDS, normaliseSnapshot, cohortKey, summarisePractice } from '../src/practice.js';
import { analyseWorkflow, improveWorkflow } from '../src/workflow.js';
import { renderPractice } from '../src/practice-view.js';
function memory() {const values=new Map();return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
const now='2026-10-10T06:00:00.000Z';
const input={taskId:'study',original:'Explain phishing.',details:{constraints:'Under 200 words',source:'Accepted lecture text.'},preferences:{format:'Other',otherFormat:'A numbered checklist'}};
function fixture(id='attempt-1') {
  const analysis={...analyseWorkflow({...input,details:{},preferences:{}}),frameworkVersion:FRAMEWORK_VERSION,model:''};
  const generated=improveWorkflow(input);
  const draft={...generated,input,analysisKey:analysis.inputFingerprint,key:JSON.stringify(input)};
  const snapshot={input,engine:'local-rules',screen:4,continued:true,personalised:true,analysis,draft,improved:'Student edit.',attemptId:id,attemptFingerprint:analysis.inputFingerprint,example:false,savedAt:now,materialNotice:true,apiKey:'NEVER-SAVE',files:{bytes:'NEVER-SAVE'}};
  const record={id,createdAt:now,updatedAt:now,taskId:'study',original:input.original,taskDescription:'',example:false,analysis,rewrite:{mode:'local-rules',model:'',generated:generated.improvedPrompt,edited:'Student edit.',warnings:[]}};
  return {snapshot,record};
}
test('practice saving is opt-in, deduplicates attempts and keeps generated and edited versions separately',()=>{
  const storage=memory(),store=createPracticeStore(storage),f=fixture();
  assert.equal(store.enabled,false);assert.equal(store.save(f.snapshot,f.record),false);assert.equal(storage.values.size,0);
  assert.equal(store.enable(),true);assert.equal(store.save(f.snapshot,f.record),true);
  assert.equal(store.save(f.snapshot,{...f.record,rewrite:{...f.record.rewrite,edited:'Another student edit.'}}),true);
  const saved=store.read();assert.equal(saved.records.length,1);assert.equal(saved.records[0].rewrite.edited,'Another student edit.');assert.equal(saved.records[0].rewrite.generated,f.record.rewrite.generated);
  const reopened=createPracticeStore(storage);assert.equal(reopened.enabled,true);assert.equal(reopened.read().records.length,1);
  assert.equal(store.clear(),true);assert.equal(storage.getItem(PRACTICE_KEY),null);assert.equal(store.enabled,false);
});
test('recovery preserves accepted source/Other-format text but strips credentials, original file objects and unknown fields',()=>{
  const {snapshot}=fixture(),safe=normaliseSnapshot(snapshot);
  assert.equal(safe.input.details.source,input.details.source);assert.equal(safe.input.details.constraints,input.details.constraints);assert.equal(safe.input.preferences.otherFormat,'A numbered checklist');
  assert.equal(safe.improved,'Student edit.');assert.doesNotMatch(JSON.stringify(safe),/NEVER-SAVE|apiKey|files/);
  assert.throws(()=>normaliseSnapshot({...snapshot,input:{...snapshot.input,original:'A changed prompt'}}),/does not match/);
  assert.throws(()=>normaliseSnapshot({...snapshot,analysis:{...snapshot.analysis,criteria:snapshot.analysis.criteria.slice(1)}}),/evaluation/);
  assert.throws(()=>normaliseSnapshot({...snapshot,draft:{...snapshot.draft,input:{...snapshot.draft.input,original:'A different original'}}}),/rewrite does not match/);
});
test('quota/permission failures retain the last successful data and never report an unsaved update as saved',()=>{
  const storage=memory(),store=createPracticeStore(storage),f=fixture();store.enable();store.save(f.snapshot,f.record);
  const old=store.exportJSON(),raw=storage.getItem(PRACTICE_KEY);
  storage.setItem=()=>{throw new Error('QuotaExceededError');};
  assert.equal(store.save({...f.snapshot,improved:'Unsaved edit'}),false);assert.match(store.error,/not saved/);assert.equal(store.exportJSON(),old);assert.equal(storage.getItem(PRACTICE_KEY),raw);
  storage.removeItem=()=>{throw new Error('Denied');};assert.equal(store.clear(),false);assert.equal(store.enabled,true);
});
test('damaged or unknown-version profiles are not overwritten without explicit removal',()=>{
  for(const raw of ['{broken',JSON.stringify({schema:99})]){
    const storage=memory();storage.setItem(PRACTICE_KEY,raw);const store=createPracticeStore(storage);
    assert.equal(store.enabled,false);assert.ok(store.error);assert.equal(store.enable(),false);assert.equal(storage.getItem(PRACTICE_KEY),raw);
    assert.equal(store.clear(),true);assert.equal(store.enable(),true);
  }
});
test('bounded history refuses overflow atomically and deletion also removes that attempt from recovery',()=>{
  const store=createPracticeStore(memory());store.enable();
  for(let n=0;n<MAX_RECORDS;n++){const f=fixture('attempt-'+n);assert.equal(store.save(f.snapshot,f.record),true);}
  const previous=store.read();const more=fixture('overflow');assert.equal(store.save(more.snapshot,more.record),false);assert.deepEqual(store.read(),previous);
  assert.equal(store.remove('attempt-49'),true);assert.equal(store.read().current,null);assert.equal(store.read().records.length,MAX_RECORDS-1);assert.equal(store.save(more.snapshot,more.record),true);
});
test('learning counts separate task/mode/model/version, exclude examples and N/A, and never count generated rewrites as attempts',()=>{
  const {record}=fixture();const a=record,b=structuredClone(record);b.id='second';b.analysis.criteria.find(c=>c.key==='context').status='Present';
  const example={...record,id:'example',example:true},ai=structuredClone(record);ai.id='ai';ai.analysis.mode='openai';ai.analysis.model='fixture-model';
  const otherVersion=structuredClone(record);otherVersion.id='version';otherVersion.analysis.frameworkVersion='future-v2';
  const otherTask={...record,id:'report',taskId:'report'};
  const stats=summarisePractice([a,b,example,ai,otherVersion,otherTask],{taskId:'study',cohort:cohortKey(record)});
  assert.equal(stats.count,2);assert.equal(stats.timeline.length,2);
  const context=stats.criteria.find(c=>c.key==='context');assert.equal(context.review,1);assert.equal(context.applicable,2);
  const source=stats.criteria.find(c=>c.key==='source');assert.equal(source.applicable,0);assert.equal(source.review,0);assert.equal(source.counts['N/A'],2);
});
test('saved user text is escaped in history views and empty dashboard has no fabricated progress',()=>{
  const {record}=fixture();record.original='<img src=x onerror=alert(1)>';
  const html=renderPractice({data:{records:[record]},enabled:true,error:'',view:'history',selectedId:record.id}).html;
  assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);
  const empty=renderPractice({data:{records:[]},enabled:false,error:''}).html;
  assert.match(empty,/Build your own practice story/);assert.doesNotMatch(empty,/prompting ability|100%|You improved/i);
});

test('a stale profile writer cannot overwrite work saved by another tab',()=>{
  const storage=memory(),first=createPracticeStore(storage),staleBeforeEnable=createPracticeStore(storage);
  first.enable();assert.equal(staleBeforeEnable.enable(),false);
  const stale=createPracticeStore(storage),f=fixture();assert.equal(first.save(f.snapshot,f.record),true);
  const raw=storage.getItem(PRACTICE_KEY);assert.equal(stale.save(null),false);assert.equal(storage.getItem(PRACTICE_KEY),raw);
});
