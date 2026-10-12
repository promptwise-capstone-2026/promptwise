import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { requestOpenAI, normaliseInput, validateResult, buildOpenAIRequest, MAX_INPUT_CHARS } from '../server/openai.mjs';
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

test('remote callers cannot enable or invoke the local AI handler', async () => {
  const { createApiHandler } = await import('../server/api.mjs');
  let outbound = 0;
  const handle = createApiHandler({ env: { PROMPTWISE_AI_ENABLED: 'true', OPENAI_API_KEY: 'fixture' }, fetchImpl: async () => { outbound++; } });
  const capture = () => ({ destroyed: false, writeHead(status, headers) { this.status = status; this.headers = headers; return this; }, end(body) { this.body = JSON.parse(body); } });
  const request = { method: 'GET', socket: { remoteAddress: '203.0.113.5' }, headers: {} };
  const config = capture(); await handle(request, config, '/api/config'); assert.equal(config.body.aiAvailable, false);
  const response = capture(); await handle({ ...request, method: 'POST' }, response, '/api/analyse');
  assert.equal(response.status, 503); assert.equal(outbound, 0);
});

test('simultaneous local AI calls are rejected while the first provider request is pending', async t => {
  let release, started;
  const begun = new Promise(resolve => { started = resolve; });
  const { post } = await serverFixture(t, { env: { PROMPTWISE_AI_ENABLED: 'true', OPENAI_API_KEY: 'fixture' }, fetchImpl: async () => { started(); return new Promise(resolve => { release = () => resolve(complete(analysis())); }); } });
  const first = post(input); await begun;
  try { assert.equal((await post(input)).status, 429); }
  finally { release(); }
  assert.equal((await first).status, 200);
});


test('analysis evidence choices preserve the S2 source and keep invented quotes invalid', async () => {
  const original = 'Summarise this text.\n\nA fictional university library piloted a laptop-loan service with 60 laptops. Each loan lasted 48 hours. Collection and return were available Tuesday to Friday, 9 am to 5 pm. During the pilot, 120 students borrowed a laptop. Of the 96 borrowers who answered an optional survey, 84 described the service as useful and 12 did not. The library did not measure grades, retention or long-term learning. It plans to review opening hours before deciding whether to continue the service.';
  const raw = { taskId: 'summarisation', original, details: { source: 'LATER-PERSONALISATION-SENTINEL' }, preferences: {} };
  const request = buildOpenAIRequest('analysis', raw);
  const choices = request.text.format.schema.properties.criteria.items.properties.evidence.enum;
  assert.ok(choices.includes(''));
  assert.ok(choices.includes('Collection and return were available Tuesday to Friday, 9 am to 5 pm.'));
  assert.ok(choices.includes('Of the 96 borrowers who answered an optional survey, 84 described the service as useful and 12 did not.'));
  assert.ok(choices.every(quote => original.includes(quote)));
  assert.doesNotMatch(JSON.stringify(request), /LATER-PERSONALISATION-SENTINEL/);
  assert.ok(!choices.includes('9 a.m. to 5 p.m.'));
  const result = await requestOpenAI('analysis', raw, { apiKey: 'fixture', fetchImpl: async () => {
    const data = analysis();
    data.criteria[0].evidence = 'Summarise this text.';
    data.criteria.find(row => row.key === 'source').evidence = choices.find(quote => quote.includes('96 borrowers'));
    return complete(data);
  } });
  assert.match(result.criteria.find(row => row.key === 'source').reason, /96 borrowers/);
  const invented = analysis(); invented.criteria[0].evidence = 'All 120 borrowers found it useful';
  assert.throws(() => validateResult(invented, 'analysis', normaliseInput(raw, 'analysis')), /not supplied/);
});

test('evidence choices work across all six tasks without leaking later material', () => {
  for (const taskId of ['study', 'summarisation', 'coding', 'report', 'presentation', 'other']) {
    const raw = { taskId, original: 'Review this supplied text: “60 laptops” — keep 48 hours.\nSecond line.', details: { source: 'PRIVATE-LATER-SENTINEL', ...(taskId === 'other' ? { taskDescription: 'Review a fictional schedule.' } : {}) }, preferences: { audience: 'LATER-AUDIENCE-SENTINEL' } };
    const request = buildOpenAIRequest('analysis', raw);
    const choices = request.text.format.schema.properties.criteria.items.properties.evidence.enum;
    assert.ok(choices.every(quote => raw.original.includes(quote) || (raw.details.taskDescription || '').includes(quote)));
    assert.doesNotMatch(JSON.stringify(request), /PRIVATE-LATER-SENTINEL|LATER-AUDIENCE-SENTINEL/);
    if (taskId === 'other') assert.ok(choices.includes(raw.details.taskDescription));
  }
});

test('long Unicode evidence choices are bounded, source-exact and request-isolated', () => {
  const original = Array.from({ length: 80 }, (_, n) => `Line ${n}: ` + '🧑🏽‍🎓'.repeat(40)).join('\n');
  const request = buildOpenAIRequest('analysis', { ...input, original });
  const choices = request.text.format.schema.properties.criteria.items.properties.evidence.enum;
  assert.equal(choices.length, 33);
  assert.ok(choices.every(quote => original.includes(quote) && quote.length <= 1500));
  assert.ok(choices.some(quote => quote.includes('Line 79:')));
  const separate = buildOpenAIRequest('analysis', input);
  assert.deepEqual(separate.text.format.schema.properties.criteria.items.properties.evidence.enum, ['', 'Explain phishing.']);
  const rewrite = buildOpenAIRequest('rewrite', input);
  assert.equal(rewrite.text.format.schema.properties.criteria, undefined);
});
