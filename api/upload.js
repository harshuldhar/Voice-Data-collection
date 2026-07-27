// Vercel serverless function: receives a colleague's recording zip and stores it in Vercel Blob.
// Requires a Blob store linked to the project (Vercel injects BLOB_READ_WRITE_TOKEN automatically).
import { put } from '@vercel/blob';

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
    res.status(200).json({ ok: true, url: blob.url, bytes: body.length });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
