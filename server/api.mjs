import { createHostedAccess, createUsageAllowance, reservationMicroUSD } from './hosted.mjs';
import { requestOpenAI, buildOpenAIRequest, normaliseInput, ApiError, DEFAULT_MODEL } from './openai.mjs';
const loopback = address => address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
const reply = (response, status, body) => {
  if (response.destroyed) return;
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(JSON.stringify(body));
};

// Local AI stays loopback-only. Hosted AI requires HTTPS, a team password and a
// persistent global allowance; forwarding headers cannot create extra allowances.
export function createApiHandler({ env = process.env, fetchImpl = fetch, timeoutMs = 45000, hosted = createHostedAccess(env) } = {}) {
  const enabled = env.PROMPTWISE_AI_ENABLED === 'true' && Boolean(env.OPENAI_API_KEY);
  const maxCalls = Number(env.PROMPTWISE_AI_MAX_CALLS || 50);
  if (!Number.isSafeInteger(maxCalls) || maxCalls < 1 || maxCalls > 1000) throw new Error('PROMPTWISE_AI_MAX_CALLS must be 1–1000');
  const allowance = enabled && hosted ? createUsageAllowance(env, maxCalls) : null;
  let calls = 0, busy = false;
  const handle = async (request, response, pathname) => {
    if (!['/api/config', '/api/analyse', '/api/improve'].includes(pathname)) return false;
    if (hosted && !hosted.authorise(request, response)) return true;
    if (pathname === '/api/config') {
      if (request.method !== 'GET') reply(response, 405, { error: 'Use GET.' });
      else reply(response, 200, { aiAvailable: enabled && (Boolean(hosted) || loopback(request.socket.remoteAddress)), model: enabled ? (env.OPENAI_MODEL || DEFAULT_MODEL) : null, localOnly: !hosted });
      return true;
    }
    try {
      if (request.method !== 'POST') throw new ApiError(405, 'Use POST.');
      if (!enabled || (!hosted && !loopback(request.socket.remoteAddress))) throw new ApiError(503, 'AI mode is unavailable. Use local rules or ask the demo owner to check configuration.');
      // Validate the fixed local or hosted origin before accepting any AI request.
      const host = request.headers.host || '';
      if ((!hosted && !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) || request.headers.origin !== (hosted?.origin || `http://${host}`) || request.headers['sec-fetch-site'] === 'cross-site') throw new ApiError(403, 'Use AI from the configured PromptWise address.');
      if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, 'Use a JSON prompt request.');
      if (Number(request.headers['content-length']) > 300000) throw new ApiError(413, 'The prompt request is too large.');
      if (busy) throw new ApiError(429, 'An AI request is already running. Wait for it to finish.');
      if (!hosted && calls >= maxCalls) throw new ApiError(429, 'The local testing request allowance has been reached. Check usage before restarting the server.');
      let bytes = 0;
      const chunks = [];
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 300000) throw new ApiError(413, 'The prompt request is too large.');
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'The prompt request is not valid JSON.'); }
      const operation = pathname === '/api/analyse' ? 'analysis' : 'rewrite';
      input = normaliseInput(input, operation);
      // Recheck after reading: another connection can finish its body first.
      if (busy || (!hosted && calls >= maxCalls)) throw new ApiError(429, 'Wait for the current request or ask the app owner to check the allowance.');
      // SQLite atomically shares reservations/cooldown across restarts and workers.
      allowance?.reserve(reservationMicroUSD(buildOpenAIRequest(operation, input, env.OPENAI_MODEL || DEFAULT_MODEL)));
      busy = true;
      calls += 1; // Count attempts, including failures; never retry automatically.
      const controller = new AbortController();
      const cancel = () => { if (!response.writableEnded) controller.abort(); };
      response.once('close', cancel);
      try {
        const result = await requestOpenAI(operation, input, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || DEFAULT_MODEL, signal: controller.signal, fetchImpl, timeoutMs });
        reply(response, 200, result);
      } finally {
        response.off('close', cancel);
        busy = false;
      }
    } catch (error) {
      reply(response, error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : 'The request could not be completed.', ...(error.fields ? { fields: error.fields } : {}) });
    }
    return true;
  };
  handle.close = () => allowance?.close();
  return handle;
}
