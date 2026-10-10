import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createAppServer, PUBLIC_PATHS } from '../scripts/serve.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'promptwise-server-'));
  const server = createAppServer({ root });
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { root, url: `http://127.0.0.1:${server.address().port}` };
}

test('the server serves the complete browser bundle, including queries and HEAD', async t => {
  const { root, url } = await fixture(t);
  for (const path of PUBLIC_PATHS) {
    const file = join(root, path.slice(1));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `public asset: ${path}`);
    const response = await fetch(url + path + '?v=test');
    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), `public asset: ${path}`);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    if (path.endsWith('.mjs')) assert.match(response.headers.get('content-type'), /javascript/);
    if (path.endsWith('.jpeg')) assert.equal(response.headers.get('content-type'), 'image/jpeg');
  }
  assert.equal((await fetch(url + '/')).status, 200);
  const head = await fetch(url + '/index.html', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(url + '/index.html', { method: 'POST' })).status, 405);
});

test('private material and non-browser artifacts are denied regardless of path casing or encoding', async t => {
  const { root, url } = await fixture(t);
  await mkdir(join(root, 'private', 'references'), { recursive: true });
  await writeFile(join(root, 'private', 'references', 'report.fig'), 'PRIVATE SENTINEL');
  await writeFile(join(root, 'README.md'), 'PRIVATE SENTINEL');
  for (const path of [
    '/private/references/report.fig', '/Private/references/report.fig',
    '/PRIVATE/references/report.fig', '/%50rivate/references/report.fig',
    '/%70rivate%2Freferences%2Freport.fig', '/private//references/report.fig',
    '/%2570rivate/references/report.fig', '/src/../Private/references/report.fig',
    '/.env', '/.git/config', '/README.md', '/docs/FRONTEND_REVIEW.md',
    '/tests/server.test.mjs', '/Scripts/serve.mjs', '/api/analysis', '/server/openai.mjs', '/server/api.mjs',
    '/public/team/unknown.jpeg', '/public/team/.env', '/node_modules/pdfjs-dist/build/pdf.mjs', '/public/vendor/unknown.mjs', '/public/vendor/.env'
  ]) {
    const response = await fetch(url + path);
    assert.equal(response.status, 403, path);
    assert.doesNotMatch(await response.text(), /PRIVATE SENTINEL/);
  }
  assert.equal((await fetch(url + '/%zz')).status, 404);
});

test('allowed asset names cannot expose private content through symlinks', async t => {
  const { root, url } = await fixture(t);
  await mkdir(join(root, 'src'));
  await mkdir(join(root, 'private'));
  await writeFile(join(root, 'private', 'secret.txt'), 'PRIVATE SENTINEL');
  await symlink(join(root, 'private', 'secret.txt'), join(root, 'src', 'app.js'));
  const response = await fetch(url + '/src/app.js');
  assert.equal(response.status, 403);
  assert.doesNotMatch(await response.text(), /PRIVATE SENTINEL/);
});
