# XDial Call Recordings Setup Guide

This guide will help you set up the call recordings feature for your XDial Networks admin interface. The solution includes a Node.js proxy server to bypass CORS restrictions and an enhanced JavaScript file to integrate with your existing recordings.html page.

## Prerequisites

- Node.js installed on your system
- NPM (Node Package Manager)
- Your existing XDial Networks admin interface files

## Setup Instructions

### 1. Set Up the Proxy Server

1. Create a new directory for the proxy server:
   ```bash
   mkdir xdial-recordings-proxy
   cd xdial-recordings-proxy
   ```

2. Create the package.json file (or copy the provided one) and install dependencies:
   ```bash
   # Copy the package.json file provided
   npm install
   ```

3. Create the recordings-proxy.js file (or copy the provided one)

4. Start the proxy server:
   ```bash
   npm start
   ```

   You should see the message: `Recordings proxy server running on http://localhost:3000`

### 2. Update Your Web Interface

1. Replace your existing recordings.js file with the updated version provided

2. Ensure the proxy server URL in recordings.js matches your setup:
   ```javascript
   // Make sure this URL matches your proxy server location
   const PROXY_URL = "http://localhost:3000/api/";
   ```

3. No changes to your HTML or CSS files are required as the script is designed to work with your existing interface

## How It Works

### Proxy Server (recordings-proxy.js)

The proxy server acts as a bridge between your web browser and the recordings server. It:

1. Fetches the list of date folders from the recordings server
2. Retrieves audio files from each folder and the main directory
3. Streams audio content to your web browser, bypassing CORS restrictions
4. Handles errors and provides appropriate responses

### Web Client (recordings.js)

The client-side script:

1. Connects to the proxy server to get recordings data
2. Organizes recordings by date and groups related files (in/out/all channels)
3. Implements the audio player with all controls
4. Provides filtering, pagination, and search functionality

## Troubleshooting

- **Proxy Connection Error**: Make sure the proxy server is running on the correct port
- **Audio Playback Issues**: Check browser console for specific errors
- **Missing Recordings**: Ensure the proxy server can reach the recordings server at `http://5.78.123.166/RECORDINGS/ORIG/`

## Production Deployment Notes

For a production environment:

1. Set up the proxy server on your web server with proper process management (PM2, systemd, etc.)
2. Consider adding security measures (authentication, rate limiting)
3. Update the PROXY_URL in recordings.js to point to your production proxy server
4. Consider implementing caching to reduce load on the recordings server