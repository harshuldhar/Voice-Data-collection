// Download NEW uploaded recording zips from Vercel Blob to ./collected/ (skips ones already pulled).
// Usage:  BLOB_READ_WRITE_TOKEN=xxxxx node pull_recordings.mjs
// Already-pulled blob pathnames are tracked in pulled_manifest.txt so re-running only fetches NEW people.
import { list } from '@vercel/blob';
import { writeFile, mkdir, readFile, appendFile } from 'node:fs/promises';

let pulled = new Set();
try {
  pulled = new Set((await readFile('pulled_manifest.txt', 'utf8')).split('\n').map(s => s.trim()).filter(Boolean));
} catch { /* no manifest yet */ }

const { blobs } = await list({ prefix: 'recordings/' });
await mkdir('collected', { recursive: true });
let n = 0, skipped = 0;
for (const b of blobs) {
  if (pulled.has(b.pathname)) { skipped++; continue; }   // already pulled + QC'd — don't recheck
  const r = await fetch(b.url);
  const buf = Buffer.from(await r.arrayBuffer());
  const fn = 'collected/' + b.pathname.split('/').pop();
  await writeFile(fn, buf);
  await appendFile('pulled_manifest.txt', b.pathname + '\n');
  console.log('saved', fn, buf.length, 'bytes');
  n++;
}
console.log(`done: ${n} NEW recording zip(s) in ./collected/; skipped ${skipped} already-pulled`);
if (n) console.log('next: python ingest_real.py (after QC) then retrain');
