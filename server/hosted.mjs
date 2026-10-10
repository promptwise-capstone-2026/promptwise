import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdirSync, realpathSync, existsSync, lstatSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { createRequire } from 'node:module';
import { ApiError, DEFAULT_MODEL } from './openai.mjs';

const digest = text => createHash('sha256').update(text).digest();

// A shared pilot password, not student accounts. Render terminates HTTPS; the
// service must not be exposed directly around that proxy. Never trust client IP
// headers for quotas: all pilot users share a durable global allowance instead.
export function createHostedAccess(env) {
  if (env.PROMPTWISE_HOSTED !== 'true') return null;
  const raw = env.PROMPTWISE_PUBLIC_ORIGIN || (env.RENDER_EXTERNAL_HOSTNAME ? `https://${env.RENDER_EXTERNAL_HOSTNAME}` : '');
  let origin;
  try { origin = new URL(raw); } catch { throw new Error('Hosted mode needs PROMPTWISE_PUBLIC_ORIGIN or RENDER_EXTERNAL_HOSTNAME'); }
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Hosted origin must be a plain HTTPS origin');
  const password = env.PROMPTWISE_DEMO_PASSWORD || '';
  if (!/^[\x21-\x7e]{24,256}$/.test(password)) throw new Error('PROMPTWISE_DEMO_PASSWORD must contain 24–256 printable non-space characters');
  const expected = digest(`demo:${password}`);
  return {
    origin: origin.origin,
    host: origin.host,
    authorise(request, response) {
      if (request.headers.host !== origin.host) {
        response.writeHead(421).end('Use the configured demo address.');
        return false;
      }
      if (!request.socket.encrypted && request.headers['x-forwarded-proto'] !== 'https') {
        response.writeHead(403).end('Open the demo over HTTPS.');
        return false;
      }
      const header = request.headers.authorization || '';
      let credentials = '';
      if (header.length <= 1024 && /^Basic [A-Za-z0-9+/]+={0,2}$/i.test(header)) credentials = Buffer.from(header.slice(6), 'base64').toString('utf8');
      if (!timingSafeEqual(digest(credentials), expected)) {
        response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="PromptWise demo", charset="UTF-8"' }).end('This demo needs the team username and password.');
        return false;
      }
      return true;
    }
  };
}

// This is a conservative internal reservation, NOT an OpenAI billing measurement
// or a guaranteed provider spending cap. Bytes plus padding overestimate ordinary
// text tokens; charge the full maximum output allowance even on failure/cancel.
// No tools, files, reasoning model or discounted cache rates are assumed.
// Checked 2026-10-10: GPT-4.1 mini input $0.40, output $1.60 per million tokens.
export function reservationMicroUSD(body) {
  if (body.model !== DEFAULT_MODEL) throw new Error('Hosted allowance supports only the pinned demo model');
  const inputAllowance = Buffer.byteLength(JSON.stringify(body), 'utf8') + 4096;
  return Math.ceil(inputAllowance * 0.4 + body.max_output_tokens * 1.6);
}

export function createUsageAllowance(env, maxCalls) {
  if ((env.OPENAI_MODEL || DEFAULT_MODEL) !== DEFAULT_MODEL) throw new Error('Hosted AI must use the pinned GPT-4.1 mini snapshot');
  const directory = env.PROMPTWISE_DATA_DIR;
  if (!directory || !isAbsolute(directory)) throw new Error('Hosted AI needs an absolute PROMPTWISE_DATA_DIR on persistent storage');
  const rawBudget = env.PROMPTWISE_AI_BUDGET_USD || '5';
  if (!/^(?:0|[1-9]\d?)(?:\.\d{1,2})?$/.test(rawBudget) || Number(rawBudget) <= 0) throw new Error('PROMPTWISE_AI_BUDGET_USD must be greater than 0 and less than 100, with up to two decimals');
  const budgetMicroUSD = Math.round(Number(rawBudget) * 1_000_000);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (lstatSync(directory).isSymbolicLink()) throw new Error('Usage storage must not be a symlink');
  const file = join(realpathSync(directory), 'demo-usage.sqlite');
  for (const suffix of ['', '-wal', '-shm']) if (existsSync(file + suffix) && lstatSync(file + suffix).isSymbolicLink()) throw new Error('Usage files must not be symlinks');
  const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
  const db = new DatabaseSync(file);
  try {
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS allowance (
        id INTEGER PRIMARY KEY CHECK (id=1),
        calls INTEGER NOT NULL CHECK (calls>=0),
        reserved_micro_usd INTEGER NOT NULL CHECK (reserved_micro_usd>=0),
        last_started_ms INTEGER NOT NULL);
      INSERT OR IGNORE INTO allowance VALUES (1, 0, 0, 0);`);
    if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('Invalid usage database');
  } catch (error) { db.close(); throw error; }
  let closed = false;
  return {
    reserve(microUSD, now = Date.now()) {
      if (!Number.isSafeInteger(microUSD) || microUSD <= 0) throw new Error('Invalid usage reservation');
      try {
        db.exec('BEGIN IMMEDIATE');
        const row = db.prepare('SELECT * FROM allowance WHERE id=1').get();
        if (!row || ![row.calls, row.reserved_micro_usd, row.last_started_ms].every(Number.isSafeInteger)) throw new Error('Invalid usage state');
        if (row.calls >= maxCalls || row.reserved_micro_usd + microUSD > budgetMicroUSD) throw new ApiError(429, 'The hosted demo allowance has been reached. Ask Thai to review API usage. Local rules, editing and copying remain available.');
        if (row.last_started_ms && now - row.last_started_ms < 10000) throw new ApiError(429, 'This shared demo accepts one AI request every 10 seconds. Wait briefly and try again.');
        db.prepare('UPDATE allowance SET calls=calls+1, reserved_micro_usd=reserved_micro_usd+?, last_started_ms=? WHERE id=1').run(microUSD, now);
        db.exec('COMMIT'); // Persist BEFORE any provider request, including failures.
      } catch (error) {
        try { db.exec('ROLLBACK'); } catch {}
        if (error instanceof ApiError) throw error;
        throw new ApiError(503, 'The demo usage counter is unavailable. Your prompt has not been sent; use local rules or try later.');
      }
    },
    close() { if (!closed) { closed = true; db.close(); } }
  };
}
