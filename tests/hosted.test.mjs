import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { mkdtemp, rm, writeFile, readFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createUsageAllowance, createHostedAccess, reservationMicroUSD } from '../server/hosted.mjs';
import { buildOpenAIRequest, DEFAULT_MODEL } from '../server/openai.mjs';
import { createAppServer } from '../scripts/serve.mjs';
import { runInNewContext } from 'node:vm';
import { CRITERIA } from '../src/rules.js';
// Native HTTP preserves the explicit Host header; Node fetch replaces it with
// the URL host. Exercise the same host Render forwards, without external DNS/TLS.
function http(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(url, options, response => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })));
    });
    request.on('error', reject); request.end(options.body);
  });
}
const password = 'fixture-demo-password-32-characters';
const origin = 'https://demo.example';
const input = { taskId: 'study', original: 'Explain phishing.', details: {}, preferences: {} };
const base = { PROMPTWISE_HOSTED: 'true', PROMPTWISE_PUBLIC_ORIGIN: origin, PROMPTWISE_DEMO_PASSWORD: password };
const basic = 'Basic ' + Buffer.from('demo:' + password).toString('base64');
const headers = { Host: 'demo.example', 'X-Forwarded-Proto': 'https', Authorization: basic };
async function directory(t) { const d = await mkdtemp(join(tmpdir(), 'pw-hosted-')); t.after(() => rm(d, { recursive: true, force: true })); return d; }
async function fixture(t, overrides = {}, fetchImpl = async () => { throw new Error('Unexpected provider call'); }) {
  const dir = await directory(t);
  const env = { ...base, PROMPTWISE_AI_ENABLED: 'true', OPENAI_API_KEY: 'fixture-secret-never-real', PROMPTWISE_DATA_DIR: dir, ...overrides };
  let server;
  const start = async () => { server = createAppServer({ apiOptions: { env, fetchImpl } }); server.listen(0, '127.0.0.1'); await once(server, 'listening'); return `http://127.0.0.1:${server.address().port}`; };
  let url = await start();
  t.after(() => new Promise(resolve => server.close(resolve)));
  return { dir, env,
    get: (path, extra = {}) => http(url + path, { headers: { ...headers, ...extra } }),
    post: (data = input, extra = {}, path = '/api/analyse') => http(url + path, { method: 'POST', headers: { ...headers, Origin: origin, 'Content-Type': 'application/json', ...extra }, body: typeof data === 'string' ? data : JSON.stringify(data) }),
    restart: async () => { await new Promise(resolve => server.close(resolve)); url = await start(); }
  };
}
const complete = () => new Response(JSON.stringify({ status: 'completed', model: DEFAULT_MODEL, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ criteria: CRITERIA.map(([key]) => ({ key, status: 'Partial', reason: 'Review this detail.', evidence: '', suggestion: 'Add a relevant detail.' })), warnings: [] }) }] }], usage: { input_tokens: 100, output_tokens: 50 } }));

test('hosted configuration requires HTTPS, a strong shared password and supported model/storage', async t => {
  assert.equal(createHostedAccess({}), null);
  for (const env of [{ ...base, PROMPTWISE_PUBLIC_ORIGIN: '' }, { ...base, PROMPTWISE_PUBLIC_ORIGIN: 'http://demo.example' }, { ...base, PROMPTWISE_PUBLIC_ORIGIN: origin + '/path' }, { ...base, PROMPTWISE_PUBLIC_ORIGIN: 'https://user:pass@demo.example' }, { ...base, PROMPTWISE_DEMO_PASSWORD: 'short' }]) assert.throws(() => createHostedAccess(env));
  assert.equal(createHostedAccess({ ...base, PROMPTWISE_PUBLIC_ORIGIN: '', RENDER_EXTERNAL_HOSTNAME: 'pilot.onrender.com' }).origin, 'https://pilot.onrender.com');
  const dir = await directory(t);
  assert.throws(() => createUsageAllowance({}, 50), /absolute/);
  assert.throws(() => createUsageAllowance({ PROMPTWISE_DATA_DIR: dir, OPENAI_MODEL: 'different-model' }, 50), /pinned/);
  for (const budget of ['0', '-1', 'NaN', '100', '0.001']) assert.throws(() => createUsageAllowance({ PROMPTWISE_DATA_DIR: dir, PROMPTWISE_AI_BUDGET_USD: budget }, 50), /BUDGET/);
  await writeFile(join(dir, 'demo-usage.sqlite'), 'corrupted database');
  assert.throws(() => createUsageAllowance({ PROMPTWISE_DATA_DIR: dir }, 50));
});

test('reservations cover Unicode body bytes and maximum output, not reported actual billing', () => {
  const analysis = buildOpenAIRequest('analysis', input);
  const rewrite = buildOpenAIRequest('rewrite', { ...input, details: { source: '講義'.repeat(100) } });
  assert.ok(reservationMicroUSD(rewrite) > reservationMicroUSD(analysis));
  assert.equal(reservationMicroUSD(analysis), Math.ceil((Buffer.byteLength(JSON.stringify(analysis)) + 4096) * 0.4 + 3000 * 1.6));
  assert.throws(() => reservationMicroUSD({ ...analysis, model: 'unpriced-model' }), /pinned/);
});

test('global calls, conservative budget and cooldown survive reopening and share across connections', async t => {
  const env = { PROMPTWISE_DATA_DIR: await directory(t), PROMPTWISE_AI_BUDGET_USD: '0.02' };
  let first = createUsageAllowance(env, 3);
  const second = createUsageAllowance(env, 3);
  try {
    first.reserve(6000, 50000);
    assert.throws(() => second.reserve(6000, 50001), /10 seconds/);
    first.close(); first = createUsageAllowance(env, 3);
    assert.throws(() => first.reserve(6000, 51000), /10 seconds/);
    second.reserve(6000, 60000);
    first.reserve(6000, 70000);
    assert.throws(() => second.reserve(1, 80000), /allowance/);
  } finally { first.close(); second.close(); }
  const budgetDir = await directory(t);
  const capped = createUsageAllowance({ PROMPTWISE_DATA_DIR: budgetDir, PROMPTWISE_AI_BUDGET_USD: '0.01' }, 100);
  capped.reserve(9999, 50000);
  assert.throws(() => capped.reserve(2, 60000), /allowance/);
  capped.close();
  const reopened = createUsageAllowance({ PROMPTWISE_DATA_DIR: budgetDir, PROMPTWISE_AI_BUDGET_USD: '0.01' }, 100);
  try { assert.throws(() => reopened.reserve(2, 60000), /allowance/); } finally { reopened.close(); }
});

test('symlinked usage files are rejected and runtime storage failures stop requests', async t => {
  const dir = await directory(t); const outside = join(await directory(t), 'sentinel'); await writeFile(outside, 'untouched');
  await symlink(outside, join(dir, 'demo-usage.sqlite'));
  assert.throws(() => createUsageAllowance({ PROMPTWISE_DATA_DIR: dir }, 50), /symlinks/);
  assert.equal(await readFile(outside, 'utf8'), 'untouched');
  const allowance = createUsageAllowance({ PROMPTWISE_DATA_DIR: await directory(t) }, 50);
  allowance.close();
  assert.throws(() => allowance.reserve(100), error => error.status === 503);
});

test('hosted app content requires credentials and rejects invalid Host and TLS', async t => {
  const f = await fixture(t, { PROMPTWISE_AI_ENABLED: 'false' });
  for (const path of ['/', '/index.html', '/src/app.js', '/api/config']) {
    const denied = await f.get(path, { Authorization: '' });
    assert.equal(denied.status, 401, path);
    assert.match(denied.headers.get('www-authenticate'), /Basic/);
    assert.equal(denied.headers.get('cache-control'), 'no-store');
    assert.equal(denied.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(denied.headers.get('content-disposition'), null);
    assert.equal((await f.get(path, { Authorization: 'Basic ' + Buffer.from('demo:wrong').toString('base64') })).status, 401);
  }
  assert.equal((await f.get('/', { Host: 'evil.example' })).status, 421);
  assert.equal((await f.get('/', { 'X-Forwarded-Proto': 'http' })).status, 403);
  const health = await f.get('/healthz', { Authorization: '', 'X-Forwarded-Proto': '', Host: 'internal' });
  assert.deepEqual(await health.json(), { ok: true });
  assert.equal((await f.get('/')).status, 200);
  const config = await f.get('/api/config');
  assert.deepEqual(await config.json(), { aiAvailable: false, model: null, localOnly: false });
  for (const path of ['/.env', '/server/hosted.mjs', '/data/demo-usage.sqlite', '/private/report.pdf']) assert.equal((await f.get(path)).status, 403);
});

test('hosted AI rejects forged origins, invalid input and exhausted limits before outbound calls', async t => {
  let calls = 0;
  const f = await fixture(t, { PROMPTWISE_AI_MAX_CALLS: '1' }, async () => { calls++; return complete(); });
  assert.equal((await f.post(input, { Authorization: '' })).status, 401);
  for (const extra of [{ Origin: 'https://evil.example' }, { Origin: '' }, { 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await f.post(input, extra)).status, 403);
  assert.equal((await f.post(input, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await f.post('{invalid')).status, 400);
  assert.equal((await f.post({ ...input, original: '' })).status, 400);
  assert.equal((await f.post({ ...input, original: 'x'.repeat(60000) })).status, 413);
  assert.equal(calls, 0);
  const config = await f.get('/api/config'); assert.equal((await config.json()).aiAvailable, true);
  const ok = await f.post(); assert.equal(ok.status, 200); assert.doesNotMatch(await ok.text(), /fixture-secret|fixture-demo-password/);
  assert.equal((await f.post(input, { 'X-Forwarded-For': '1.2.3.4' })).status, 429);
  await f.restart();
  assert.equal((await f.post(input, { 'X-Forwarded-For': '8.8.8.8' })).status, 429);
  assert.equal(calls, 1);
  const bytes = await readFile(join(f.dir, 'demo-usage.sqlite'));
  assert.doesNotMatch(bytes.toString(), /Explain phishing|fixture-secret|fixture-demo-password/);
});

test('failed provider attempts stay reserved after restart and cannot be retried around allowance', async t => {
  let calls = 0;
  const f = await fixture(t, { PROMPTWISE_AI_MAX_CALLS: '1' }, async () => { calls++; return new Response('{}', { status: 500 }); });
  assert.equal((await f.post()).status, 502);
  await f.restart();
  assert.equal((await f.post()).status, 429);
  assert.equal(calls, 1);
});

test('content-free hosted recovery resources work without credentials while app content stays gated', async t => {
  const f = await fixture(t, { PROMPTWISE_AI_ENABLED: 'false' });
  const entry = await f.get('/demo', { Authorization: '' });
  assert.equal(entry.status, 200);
  assert.equal(entry.headers.get('content-type'), 'text/html; charset=utf-8');
  const html = await entry.text();
  assert.match(html, /Updating app files/);
  assert.doesNotMatch(html, /src\/app.js|fixture-demo-password|fixture-secret/);
  assert.equal((await f.get('/', { Authorization: '' })).status, 401);
  const worker = await f.get('/sw.js', { Authorization: '' });
  assert.equal(worker.status, 200);
  assert.match(worker.headers.get('content-type'), /javascript/);
  assert.equal(await worker.text(), await readFile(new URL('../sw-hosted.js', import.meta.url), 'utf8'));
  assert.equal((await f.get('/sw-hosted.js')).status, 403);
  assert.equal((await f.get('/public/demo-access.html')).status, 403);
  for (const path of ['/demo', '/sw.js']) {
    assert.equal((await f.get(path, { Authorization: '', Host: 'evil.example' })).status, 421);
    assert.equal((await f.get(path, { Authorization: '', 'X-Forwarded-Proto': 'http' })).status, 403);
  }
});

test('hosted worker leaves authentication on the network and replaces only app asset caches', async t => {
  const f = await fixture(t, { PROMPTWISE_AI_ENABLED: 'false' });
  const events = new Map(), calls = [], stored = new Set(['promptwise-v22', 'promptwise-v3', 'another-app-cache']);
  runInNewContext(await (await f.get('/sw.js')).text(), {
    self: {
      addEventListener: (name, callback) => events.set(name, callback),
      skipWaiting: async () => calls.push('skip'),
      clients: { claim: async () => calls.push('claim') }
    },
    caches: { keys: async () => [...stored], delete: async name => stored.delete(name) }
  });
  assert.equal(events.has('fetch'), false, 'Browser must handle Basic auth without a worker fetch proxy');
  let pending;
  const event = { waitUntil: promise => { pending = promise; } };
  events.get('install')(event); await pending;
  events.get('activate')(event); await pending;
  assert.deepEqual(calls, ['skip', 'claim']);
  assert.deepEqual([...stored], ['another-app-cache']);
});
