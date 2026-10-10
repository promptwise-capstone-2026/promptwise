import { WorkflowValidationError } from './workflow.js';
export async function getAIConfiguration({ fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl('/api/config', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { aiAvailable: false };
    const config = await response.json();
    return { aiAvailable: config.aiAvailable === true, model: config.model };
  } catch { return { aiAvailable: false }; }
}
export async function runAI(operation, input, { signal, fetchImpl = fetch } = {}) {
  if (!['analyse', 'improve'].includes(operation)) throw new Error('Unknown AI operation');
  let response;
  try {
    response = await fetchImpl(`/api/${operation}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(55000)]) : AbortSignal.timeout(55000) });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('AI needs a connection to the PromptWise server. Your input is unchanged; try again.');
  }
  let data;
  try { data = await response.json(); } catch { throw new Error('The server returned an unreadable response. Your input is unchanged; try again.'); }
  if (!response.ok) {
    if (data.fields && typeof data.fields === 'object') throw new WorkflowValidationError(data.fields);
    throw new Error(typeof data.error === 'string' ? data.error : 'AI could not complete the request. Try again.');
  }
  if (data.mode !== 'openai') throw new Error('The server returned an unexpected mode. Try again.');
  return data;
}
