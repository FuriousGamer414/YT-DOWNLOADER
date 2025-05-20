const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/download/video', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ success: false, message: "Missing 'url' query parameter" });
  }
  try {
    const apiUrl = 'http://130.162.253.238:25915/download/ytmp4?url=' + encodeURIComponent(videoUrl);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Failed to fetch video data from external API' });
    }
    const data = await response.json();
    res.json(data);
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
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Failed to fetch audio data from external API' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
