import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4173);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const segments = pathname.split('/').filter(Boolean);
    if (segments.some(segment => segment.startsWith('.')) || segments[0] === 'private' || segments[0] === 'tests' || segments[0] === 'scripts') {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const requested = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (requested !== root && !requested.startsWith(root + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const file = await stat(requested);
    if (!file.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Content-Type': types[extname(requested)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(await readFile(requested));
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`PromptWise is running at http://127.0.0.1:${port}`);
});
