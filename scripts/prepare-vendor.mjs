import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/vendor');
const assets = [];
async function copy(source, target) {
  const destination = resolve(output, target);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(root, 'node_modules', source), destination);
  assets.push(`/public/vendor/${target}`);
}
try {
  await copy('pdfjs-dist/build/pdf.min.mjs', 'pdf.mjs');
  await copy('pdfjs-dist/build/pdf.worker.min.mjs', 'pdf.worker.mjs');
  await copy('fflate/esm/browser.js', 'fflate.mjs');
  await copy('pdfjs-dist/LICENSE', 'PDFJS-LICENSE');
  await copy('fflate/LICENSE', 'FFLATE-LICENSE');
  for (const directory of ['cmaps', 'standard_fonts']) {
    for (const name of (await readdir(resolve(root, 'node_modules/pdfjs-dist', directory))).sort()) {
      if (!/^[\w.-]+$/.test(name) || name.endsWith('.map')) continue;
      await copy(`pdfjs-dist/${directory}/${name}`, `${directory}/${name}`);
    }
  }
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(assets, null, 2) + '\n');
  console.log(`Prepared ${assets.length} local parser assets.`);
} catch (error) {
  console.error('Document parsers are unavailable. Run npm ci before npm run dev.');
  throw error;
}
