/**
 * Saves the site's photos into public/images/ so they are real files in the project.
 * Runs automatically before `npm run dev` and `npm run build` (only downloads what is missing).
 * Photo list = src/images.js (Unsplash photos, free to use). Needs internet the first time.
 *
 *   npm run photos            # download anything that is missing
 *   npm run photos -- --force # re-download everything
 *
 * Never blocks your work: if a download fails the site still starts and falls back to loading
 * the photo online, or to a neutral placeholder.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, categoryPhoto, productSources } from '../src/images.js';

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const force = process.argv.includes('--force');

// Build the job list: [local path under /public, remote URL]
const jobs = new Map();
const add = ([local, remote]) => remote && local && jobs.set(local, remote);
Object.values(SITE).forEach(add);
for (let i = 1; i <= 10; i++) add(categoryPhoto({ id: `c${i}` }));
for (let i = 1; i <= 15; i++) add(productSources({ id: `p${i}`, images: [] }, 0));

const exists = async (f) => { try { await access(f); return true; } catch { return false; } };

async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'ThriftMarketSchoolProject/1.0' } });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const type = r.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error(`not an image (${type})`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((res) => setTimeout(res, 800 * attempt));
    }
  }
}

let saved = 0, skipped = 0, failed = 0;
for (const [local, remote] of jobs) {
  const dest = path.join(PUBLIC, local);
  if (!force && (await exists(dest))) { skipped++; continue; }
  try {
    const buf = await download(remote);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    saved++;
    console.log('saved ', local);
  } catch (e) {
    failed++;
    console.log('failed', local, '-', e.message);
  }
}
console.log(`\nPhotos: ${saved} downloaded, ${skipped} already there, ${failed} failed.`);
if (failed) console.log('Some photos could not be downloaded (no internet?). The site still works. Run `npm run photos` again later.');
process.exit(0);
