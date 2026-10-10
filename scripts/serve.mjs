import { createHostedAccess } from '../server/hosted.mjs';
import { createApiHandler } from '../server/api.mjs';
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Generated from pinned installed packages by predev/pretest. Never expose node_modules.
const vendorAssets = JSON.parse(readFileSync(resolve(projectRoot, 'public/vendor/manifest.json'), 'utf8'));
if (!Array.isArray(vendorAssets) || vendorAssets.some(path => !/^\/public\/vendor\/[\w./-]+$/.test(path) || path.includes('..'))) throw new Error('Invalid parser asset manifest');
// Serve only the browser bundle. A directory denylist is unsafe on a
// case-insensitive filesystem and could expose new non-source artifacts.
export const PUBLIC_PATHS = [
  '/index.html', '/sw.js', '/src/app.js', '/src/styles.css',
  '/src/practice.js', '/src/practice-view.js', '/src/tasks.js', '/src/examples.js', '/src/rules.js', '/src/guidance.js',
  '/src/validation.js', '/src/workflow.js', '/src/ai-client.js', '/src/materials.js', '/src/document-materials.js',
  '/public/team/thai.jpeg', '/public/team/amara-atif.jpeg',
  '/public/icon.svg', '/public/manifest.webmanifest', '/public/vendor/manifest.json', ...vendorAssets
];
const publicPaths = new Set(PUBLIC_PATHS);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpeg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json'
};

export function createAppServer({ root = projectRoot, apiOptions } = {}) {
  const hosted = createHostedAccess(apiOptions?.env || process.env);
  const api = createApiHandler({ ...apiOptions, hosted });
  const server = createServer({ requestTimeout: 15000, headersTimeout: 10000 }, async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    try {
      const apiPath = new URL(request.url, 'http://localhost').pathname;
      // Public, content-free liveness check: no authentication or provider call.
      if (apiPath === '/healthz') {
        const ok = ['GET', 'HEAD'].includes(request.method);
        response.writeHead(ok ? 200 : 405, { 'Content-Type': 'application/json' }).end(request.method === 'HEAD' ? undefined : JSON.stringify({ ok }));
        return;
      }
      if (hosted && !hosted.authorise(request, response)) return;
      if (await api(request, response, apiPath)) return;
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
        return;
      }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const assetPath = pathname === '/' ? '/index.html' : pathname;
      if (!publicPaths.has(assetPath)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const canonicalRoot = await realpath(root);
      const requested = resolve(canonicalRoot, `.${assetPath}`);
      // Reject symlinks into private material or outside the project, even when
      // the requested URL is one of the allowed browser assets.
      if (await realpath(requested) !== requested) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const file = await stat(requested);
      if (!file.isFile()) throw new Error('Not a file');
      const content = await readFile(requested);
      response.writeHead(200, {
        'Content-Type': types[extname(requested)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Length': content.byteLength
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  server.once('close', () => api.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || '127.0.0.1';
  if (process.env.PROMPTWISE_AI_ENABLED === 'true' && process.env.PROMPTWISE_HOSTED !== 'true' && !['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('Public AI requires PROMPTWISE_HOSTED=true with hosted access and durable usage controls.');
  createAppServer().listen(port, host, () => {
    console.log(`PromptWise is running at http://${host}:${port}`);
  });
}
