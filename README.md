# Voice Data Collection

In-browser voice-command sample collector for the Apollo330P keyword-spotting model. A colleague opens
the link, allows the mic, and records the 7 commands (4 delivery styles each) + hard/long negatives.
Each clip is recorded as **16 kHz mono WAV**, auto-labeled, and either **auto-uploaded to Vercel Blob**
or downloaded as a zip to email back.

## Deploy on Vercel (one time)

1. Push this folder to GitHub (already done): `github.com/harshuldhar/Voice-Data-collection`.
2. In **vercel.com** → **Add New… → Project** → import that repo → **Deploy**. (No settings needed — it's
   a static `index.html` + one serverless function in `api/`.) You get a public URL like
   `https://voice-data-collection.vercel.app`.
3. **Turn on auto-collect (recommended):** in the Vercel project → **Storage → Create Database → Blob** →
   create it. Vercel adds a `BLOB_READ_WRITE_TOKEN` to the project automatically. **Redeploy** once
   (Deployments → ⋯ → Redeploy) so the function picks it up. Now every submission lands in that Blob store.
   - *If you skip this,* the site still works — colleagues just tap **Download** and email the zip to
     `harshul.dhar@nexxbase.com`.

## Share it

Send the Vercel URL to colleagues. Phone or laptop, ~5 minutes each. Recording happens in their browser;
nothing is stored except the final upload/zip.

## Collect the recordings

- **From the dashboard:** Vercel project → **Storage → your Blob store →** browse `recordings/` → download.
- **Or in one command** (grabs everything to `./collected/`):
  ```bash
  npm install                      # installs @vercel/blob
  BLOB_READ_WRITE_TOKEN=<token> node pull_recordings.mjs
  ```
  (token: Vercel → Storage → the Blob store → `.env.local` / tokens.)

## Feed them into training

Each zip contains `<label>/real_<name>_<variant>.wav`. Unzip them into `kws_training/data_tts/`:
```bash
unzip -o collected/kws-samples-*.zip -d ../data_tts/
```
Then retrain: `../venv/bin/python ../colab_train.py` (the real voices fold in additively).

## Files
`index.html` — the recorder (self-contained). `api/upload.js` — Blob upload endpoint.
`pull_recordings.mjs` — bulk download. `package.json` — deps for the function.
