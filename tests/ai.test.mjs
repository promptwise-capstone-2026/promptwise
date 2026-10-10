import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { requestOpenAI, normaliseInput, validateResult, MAX_INPUT_CHARS } from '../server/openai.mjs';
import { createAppServer } from '../scripts/serve.mjs';
import { CRITERIA } from '../src/rules.js';
import { runAI } from '../src/ai-client.js';
const input = { taskId: 'study', original: 'Explain phishing.', details: {}, preferences: {} };
const analysis = () => ({ criteria: CRITERIA.map(([key]) => ({ key, status: key === 'source' || key === 'constraints' ? 'N/A' : 'Partial', reason: 'Needs review.', evidence: key === 'clarity' ? 'Explain phishing.' : '', suggestion: 'Add relevant detail.' })), warnings: [] });
const complete = data => new Response(JSON.stringify({ status: 'completed', model: 'fixture-model', output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(data) }] }], usage: { input_tokens: 100, output_tokens: 50 } }));

test('AI requests use structured criteria, private credentials, no storage/tools and normalised inputs', async () => {
  let sent;
  const result = await requestOpenAI('analysis', { ...input, details: { source: 'Later private material' }, preferences: {}, apiKey: 'never-forward' }, { apiKey: 'fixture-key', fetchImpl: async (url, options) => {
    sent = { url, options, body: JSON.parse(options.body) }; return complete(analysis());
  } });
  assert.equal(result.mode, 'openai'); assert.equal(result.criteria.length, 7);
  assert.equal(result.criteria.find(row => row.key === 'source').status, 'N/A');
  assert.equal(sent.url, 'https://api.openai.com/v1/responses');
  assert.equal(sent.options.headers.Authorization, 'Bearer fixture-key');
  assert.equal(sent.body.store, false); assert.equal(sent.body.text.format.strict, true);
  assert.equal(sent.body.tools, undefined);
  assert.doesNotMatch(sent.options.body, /Later private material|never-forward/);
  assert.ok(result.fields.some(field => field.key === 'source'));
  assert.equal(result.usage.inputTokens, 100);
});

test('rewrites include accepted source text and preferences but no unsupported detail fields', async () => {
  const result = await requestOpenAI('rewrite', { ...input, details: { source: 'Reviewed slide text', irrelevant: 'not-sent' }, preferences: { audience: 'First-year students' } }, { apiKey: 'fixture', fetchImpl: async (_, options) => {
    const body = JSON.parse(options.body); assert.match(body.input, /Reviewed slide text/); assert.doesNotMatch(body.input, /not-sent/);
    assert.match(body.instructions, /never complete/); return complete({ improvedPrompt: 'Explain phishing to first-year students using these notes.', warnings: ['Check the source.'] });
  } });
  assert.match(result.improvedPrompt, /first-year/); assert.equal(result.mode, 'openai');
});

test('validation rejects oversize, missing inputs, incomplete criteria and invented evidence', () => {
  assert.throws(() => normaliseInput({ ...input, original: 'a'.repeat(MAX_INPUT_CHARS) }, 'analysis'), error => error.status === 413);
  assert.throws(() => normaliseInput({ ...input, original: '' }, 'analysis'), error => Boolean(error.status === 400 && error.fields.original));
  const bad = analysis(); bad.criteria[1].key = bad.criteria[0].key;
  assert.throws(() => validateResult(bad, 'analysis', input), error => error.status === 502);
  const invented = analysis(); invented.criteria[0].evidence = 'Invented quotation';
  assert.throws(() => validateResult(invented, 'analysis', input), /not supplied/);
});

test('provider errors, refusals, malformed output, timeout and cancellation never fall back locally', async () => {
  for (const response of [new Response('{}', { status: 401 }), new Response('{}', { status: 429 }), new Response(JSON.stringify({ status: 'incomplete' })), new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }] })), new Response(JSON.stringify({ status: 'completed', output: [] }))]) {
    await assert.rejects(requestOpenAI('analysis', input, { apiKey: 'fixture', fetchImpl: async () => response }));
  }
  const hanging = (_, { signal }) => new Promise((_, reject) => { signal.addEventListener('abort', () => reject(signal.reason), { once: true }); if (signal.aborted) reject(signal.reason); });
  // Keep the process alive while AbortSignal.timeout's unref'ed timer runs.
  const timer = setTimeout(() => {}, 1000);
  try { await assert.rejects(requestOpenAI('analysis', input, { apiKey: 'fixture', fetchImpl: hanging, timeoutMs: 5 }), /timed out/); }
  finally { clearTimeout(timer); }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(requestOpenAI('analysis', input, { apiKey: 'fixture', fetchImpl: hanging, signal: controller.signal }), error => error.status === 499);
});

async function serverFixture(t, options = {}) {
  const server = createAppServer({ apiOptions: options }); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (data, headers = {}) => fetch(url + '/api/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: url, ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });
  return { url, post };
}
test('disabled AI config leaks no key and rejects requests without outbound calls', async t => {
  let calls = 0;
  const { url, post } = await serverFixture(t, { env: { OPENAI_API_KEY: 'SECRET-SENTINEL' }, fetchImpl: async () => { calls++; } });
  const config = await fetch(url + '/api/config'); assert.equal(config.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await config.json(), { aiAvailable: false, model: null, localOnly: true });
  assert.equal((await post(input)).status, 503); assert.equal(calls, 0);
});
test('HTTP AI enforces origin, types, limits and test allowance before making requests', async t => {
  let calls = 0;
  const { post } = await serverFixture(t, { env: { PROMPTWISE_AI_ENABLED: 'true', OPENAI_API_KEY: 'SECRET-SENTINEL', PROMPTWISE_AI_MAX_CALLS: '1' }, fetchImpl: async () => { calls++; return complete(analysis()); } });
  assert.equal((await post(input, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(input, { Origin: '' })).status, 403);
  assert.equal((await post(input, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post('{bad')).status, 400);
  assert.equal((await post({ ...input, original: '' })).status, 400);
  assert.equal((await post({ ...input, original: 'a'.repeat(60001) })).status, 413);
  const ok = await post(input); assert.equal(ok.status, 200); assert.doesNotMatch(await ok.text(), /SECRET-SENTINEL/);
  assert.equal((await post(input)).status, 429); assert.equal(calls, 1);
});
test('AI client surfaces server failures and cannot return a local result as AI', async () => {
  await assert.rejects(runAI('analyse', input, { fetchImpl: async () => new Response(JSON.stringify({ error: 'Check billing.' }), { status: 429 }) }), /Check billing/);
  await assert.rejects(runAI('improve', input, { fetchImpl: async () => new Response(JSON.stringify({ mode: 'local-rules', improvedPrompt: 'bad' })) }), /unexpected mode/);
});
