// Download every uploaded recording zip from Vercel Blob to ./collected/
// Usage:  BLOB_READ_WRITE_TOKEN=xxxxx node pull_recordings.mjs
// (get the token: Vercel project -> Storage -> your Blob store -> ".env.local" / tokens)
import { list } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';

const { blobs } = await list({ prefix: 'recordings/' });
await mkdir('collected', { recursive: true });
let n = 0;
for (const b of blobs) {
  const r = await fetch(b.url);
  const buf = Buffer.from(await r.arrayBuffer());
  const fn = 'collected/' + b.pathname.split('/').pop();
  await writeFile(fn, buf);
  console.log('saved', fn, buf.length, 'bytes');
  n++;
}
console.log(`done: ${n} recording zip(s) in ./collected/`);
console.log('next: unzip each into ../data_tts/  then run the trainer');
