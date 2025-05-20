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
    console.log(`Proxying video download request for URL: ${videoUrl}`);
    console.log(`Fetching external API: ${apiUrl}`);
    const response = await fetch(apiUrl);
    const text = await response.text();

    if (!response.ok) {
      console.error(`External API error: Status ${response.status} - Body: ${text}`);
      try {
        const errorJson = JSON.parse(text);
        return res.status(response.status).json(errorJson);
      } catch (e) {
        return res.status(response.status).json({ success: false, message: 'External API error', details: text });
      }
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error(`Fetch error in /download/video: ${error.message}`);
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
    console.log(`Proxying audio download request for URL: ${audioUrl}`);
    console.log(`Fetching external API: ${apiUrl}`);
    const response = await fetch(apiUrl);
    const text = await response.text();

    if (!response.ok) {
      console.error(`External API error: Status ${response.status} - Body: ${text}`);
      try {
        const errorJson = JSON.parse(text);
        return res.status(response.status).json(errorJson);
      } catch (e) {
        return res.status(response.status).json({ success: false, message: 'External API error', details: text });
      }
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error(`Fetch error in /download/audio: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
