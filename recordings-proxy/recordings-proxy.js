// recordings-proxy.js - A simple proxy server to fetch recordings

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Base URL of the recordings directory
const BASE_URL = "http://5.78.123.166/RECORDINGS/ORIG/";

// Endpoint to get available date folders
app.get('/api/folders', async (req, res) => {
  try {
    const response = await axios.get(BASE_URL);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const folders = [];
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      // Match date folder pattern (e.g., "2025-02-21/")
      if (href.match(/^\d{4}-\d{2}-\d{2}\/$/)) {
        folders.push(href);
      }
    });
    
    res.json({ success: true, folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch folders' });
  }
});

// Endpoint to get audio files from the main directory
app.get('/api/main-files', async (req, res) => {
  try {
    const response = await axios.get(BASE_URL);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const files = [];
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      // Match WAV file pattern with in/out/all suffix
      if (href.match(/^[\w\d-]+_[\d]+-(?:in|out|all)\.wav$/)) {
        files.push({
          filename: href,
          url: BASE_URL + href
        });
      }
    });
    
    res.json({ success: true, files });
  } catch (error) {
    console.error('Error fetching main directory files:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch main directory files' });
  }
});

// Endpoint to get audio files from a specific folder
app.get('/api/folder-files/:folder', async (req, res) => {
  try {
    const folder = req.params.folder;
    const folderUrl = BASE_URL + folder;
    
    const response = await axios.get(folderUrl);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const files = [];
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      // Match WAV file pattern with in/out/all suffix
      //
      if (href.match(/^[\w\d-]+_[\d]+-(?:in|out|all)\.wav$/)) {
        files.push({
          filename: href,
          url: folderUrl + href
        });
      }
    });
    
    res.json({ success: true, folder, files });
  } catch (error) {
    console.error(`Error fetching files from folder ${req.params.folder}:`, error);
    res.status(500).json({ success: false, error: `Failed to fetch files from folder ${req.params.folder}` });
  }
});

// Proxy endpoint for audio files to bypass CORS
app.get('/api/audio/:folder/:filename', async (req, res) => {
  try {
    const folder = req.params.folder;
    const filename = req.params.filename;
    let audioUrl = '';
    
    if (folder === 'root') {
      audioUrl = BASE_URL + filename;
    } else {
      audioUrl = BASE_URL + folder + '/' + filename;
    }
    
    const response = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream'
    });
    
    // Forward content type and other relevant headers
    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Length', response.headers['content-length']);
    
    // Pipe the audio stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying audio file:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audio file' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Recordings proxy server running on http://localhost:${PORT}`);
});