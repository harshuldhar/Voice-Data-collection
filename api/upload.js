// Vercel serverless function: receives a colleague's recording zip and stores it in Vercel Blob.
// Requires a Blob store linked to the project (Vercel injects BLOB_READ_WRITE_TOKEN automatically).
import { put, head } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  // Clear, actionable error if the Blob store hasn't been created yet.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({
      error: 'storage-not-configured',
      hint: 'In Vercel: Storage → Create → Blob, then Redeploy once.',
    });
    return;
  }
  try {
    const raw = (req.query && req.query.name) ? String(req.query.name) : 'anon';
    const name = raw.replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'anon';

    // Read the raw request body robustly (Vercel may hand us a Buffer, a string, or a stream).
    let body;
    if (Buffer.isBuffer(req.body)) body = req.body;
    else if (req.body instanceof Uint8Array) body = Buffer.from(req.body);
    else if (typeof req.body === 'string' && req.body.length) body = Buffer.from(req.body);
    else {
      const chunks = [];
      for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
      body = Buffer.concat(chunks);
    }
    if (!body || !body.length) { res.status(400).json({ error: 'empty body' }); return; }

    const blob = await put(`recordings/${name}.zip`, body, {
      access: 'public',
      contentType: 'application/zip',
      addRandomSuffix: true,
    });
    // Verify it actually landed in the store before telling the client it's saved.
    const meta = await head(blob.url);
    const confirmed = !!(meta && meta.size > 0);
    res.status(confirmed ? 200 : 500).json({ ok: confirmed, confirmed, url: blob.url, size: meta && meta.size });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
