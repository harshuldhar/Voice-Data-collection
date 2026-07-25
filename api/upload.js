// Vercel serverless function: receives a colleague's recording zip and stores it in Vercel Blob.
// Requires a Blob store linked to the project (Vercel injects BLOB_READ_WRITE_TOKEN automatically).
// If no store is linked, put() throws -> the website falls back to download + email.
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  try {
    const raw = (req.query && req.query.name) ? String(req.query.name) : 'anon';
    const name = raw.replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'anon';

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    if (!body.length) { res.status(400).json({ error: 'empty body' }); return; }

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
