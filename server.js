const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;

const cache = new Map();

function generateFileKey() {
  return crypto.randomBytes(16).toString('hex');
}

setInterval(() => {
  const now = Date.now();
  for (const [key, { timestamp }] of cache.entries()) {
    if (now - timestamp > 10 * 60 * 1000) {
      cache.delete(key);
    }
  }
}, 60 * 1000);

async function cacheFileFromUrl(downloadUrl) {
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Failed to download file from external URL: ${res.statusText}`);
  }
  const contentDisposition = res.headers.get('content-disposition') || '';
  let filename = 'file';
  const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (match && match[1]) {
    filename = match[1].replace(/['"]/g, '');
  }
  const mimeType = res.headers.get('content-type') || 'application/octet-stream';
  const buffer = await res.buffer();

  const fileKey = generateFileKey();
  cache.set(fileKey, {
    buffer,
    filename,
    mimeType,
    timestamp: Date.now(),
  });

  return fileKey;
}

app.get('/download/video', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ success: false, message: "Missing 'url' query parameter" });
  }
  try {
    const apiUrl = 'http://130.162.253.238:25915/download/ytmp4?url=' + encodeURIComponent(videoUrl);
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ success: false, message: 'External API request failed' });
    }
    const data = await apiRes.json();
    if (!data.success || !data.result || !data.result.download_url) {
      return res.status(400).json({ success: false, message: 'Invalid data from external API' });
    }
    const fileKey = await cacheFileFromUrl(data.result.download_url);
    res.json({ success: true, fileKey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/download/audio', async (req, res) => {
  const audioUrl = req.query.url;
  if (!audioUrl) {
    return res.status(400).json({ success: false, message: "Missing 'url' query parameter" });
  }
  try {
    const apiUrl = 'http://130.162.253.238:25915/download/ytmp3?url=' + encodeURIComponent(audioUrl);
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ success: false, message: 'External API request failed' });
    }
    const data = await apiRes.json();
    if (!data.success || !data.result || !data.result.download_url) {
      return res.status(400).json({ success: false, message: 'Invalid data from external API' });
    }
    const fileKey = await cacheFileFromUrl(data.result.download_url);
    res.json({ success: true, fileKey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/download/cache', (req, res) => {
  const fileKey = req.query.fileKey;
  if (!fileKey || !cache.has(fileKey)) {
    return res.status(404).send('File not found or cache expired');
  }
  const { buffer, filename, mimeType } = cache.get(fileKey);

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);

  res.send(buffer);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
