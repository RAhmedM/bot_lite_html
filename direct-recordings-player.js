// Skip forward or backward
function skipAudio(seconds) {
  if (audioPlayer.readyState > 0) {
    audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.duration, audioPlayer.currentTime + seconds));
  }
}

// Toggle mute
function toggleMute() {
  audioPlayer.muted = !audioPlayer.muted;
  if (audioPlayer.muted) {
    muteBtn.innerHTML = '<i class="bi bi-volume-mute"></i>';
  } else {
    muteBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
  }
}

// Adjust volume
function adjustVolume() {
  audioPlayer.volume = volumeSlider.value / 100;
  if (audioPlayer.volume === 0) {
    muteBtn.innerHTML = '<i class="bi bi-volume-mute"></i>';
  } else if (audioPlayer.volume < 0.5) {
    muteBtn.innerHTML = '<i class="bi bi-volume-down"></i>';
  } else {
    muteBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
  }
}

// Seek in the audio timeline
function seekAudio(e) {
  if (audioPlayer.readyState > 0) {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / progressContainer.offsetWidth;
    audioPlayer.currentTime = pos * audioPlayer.duration;
  }
}

// Update the progress bar
function updateProgress() {
  if (audioPlayer.duration) {
    const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    audioProgress.style.width = `${percentage}%`;
    currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
  }
}

// Update duration display when metadata is loaded
function updateDuration() {
  durationDisplay.textContent = formatTime(audioPlayer.duration);
}

// Handle audio ended event
function handleAudioEnded() {
  playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
}

// Handle audio error with better reporting
function handleAudioError() {
  console.error('Audio error:', audioPlayer.error);
  
  // Display detailed error information
  let errorMsg = 'Could not play this recording.';
  if (audioPlayer.error) {
    switch(audioPlayer.error.code) {
      case 1: errorMsg = 'Audio fetching aborted.'; break;
      case 2: errorMsg = 'Network error while loading audio.'; break;
      case 3: errorMsg = 'Error decoding audio file.'; break;
      case 4: errorMsg = 'Audio format not supported or file not found.'; break;
    }
  }
  
  // If we're on HTTPS and URL is HTTP, mention mixed content
  if (window.location.protocol === 'https:' && currentRecording && 
      currentRecording.audio_url && currentRecording.audio_url.startsWith('http:')) {
    errorMsg += ' This may be due to security restrictions (mixed content).';
  }
  
  showToast('Audio Error', `${errorMsg}`, 'warning');
  
  // Don't immediately try the fallback - this would create a loop
  // Instead, set UI back to play state
  playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
}

// Switch audio channel (in/out/all) with improved error handling
function switchChannel(channel) {
  if (!currentRecording) return;

  // Update active button
  if (allChannelBtn) allChannelBtn.classList.toggle('active', channel === 'all');
  if (inChannelBtn) inChannelBtn.classList.toggle('active', channel === 'in');
  if (outChannelBtn) outChannelBtn.classList.toggle('active', channel === 'out');
  
  // Save current playback state
  const wasPlaying = !audioPlayer.paused;
  const currentTime = audioPlayer.currentTime;
  
  // Update channel and source
  currentChannel = channel;
  
  // Restart playback with the new channel
  playRecording(currentRecording);
  
  // After the new audio loads, restore position
  audioPlayer.addEventListener('loadedmetadata', function onceLoaded() {
    audioPlayer.removeEventListener('loadedmetadata', onceLoaded);
    
    if (currentTime > 0 && currentTime < audioPlayer.duration) {
      audioPlayer.currentTime = currentTime;
    }
    
    // Only auto-play if it was already playing
    if (!wasPlaying) {
      audioPlayer.pause();
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }
  }, { once: true });
}

/**
 * Enhanced populateTable with better event handling
 */
function populateTable(recordings) {
  const tableBody = document.querySelector('#recordingsTable tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  recordings.forEach(recording => {
    const row = document.createElement('tr');
    row.setAttribute('data-id', recording.id);
    
    // Create channel indicators
    let channelIcons = '';
    if (recording.channelUrls) {
      if (recording.channelUrls.all) {
        channelIcons += '<span class="badge bg-info me-1" title="Combined audio available">ALL</span>';
      }
      if (recording.channelUrls.in) {
        channelIcons += '<span class="badge bg-primary me-1" title="Incoming audio available">IN</span>';
      }
      if (recording.channelUrls.out) {
        channelIcons += '<span class="badge bg-secondary me-1" title="Outgoing audio available">OUT</span>';
      }
    }
    
    // Format the duration properly using formatTime function
    const formattedDuration = formatTime(recording.duration);
    
    row.innerHTML = `
      <td>${recording.id}</td>
      <td>${recording.unique_id}</td>
      <td>${recording.timestamp}</td>
      <td>${formattedDuration}</td>
      <td></td>
      <td></td>
      <td>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-outline-primary action-btn play-recording" title="Play" data-id="${recording.id}">
            <i class="bi bi-play-fill"></i>
          </button>
          <button type="button" class="btn btn-outline-secondary action-btn download-recording" title="Download" data-id="${recording.id}" data-url="${recording.audio_url || ''}">
            <i class="bi bi-download"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add event listeners to play buttons
  document.querySelectorAll('.play-recording').forEach(button => {
    button.addEventListener('click', function() {
      const recordingId = parseInt(this.getAttribute('data-id'));
      const recording = recordings.find(rec => rec.id === recordingId);
      if (recording) {
        playRecording(recording);
      }
    });
  });
  
  // Setup download buttons with enhanced functionality
  setupDownloadButtons(recordings);
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return '0:00';
  }
  
  // Convert to integer just to be safe
  seconds = Math.floor(Number(seconds));
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Determine response category based on call duration
 * @param {number} durationSeconds - Call duration in seconds
 * @returns {string} Response category label
 */
function getResponseCategory(durationSeconds) {
  if (durationSeconds < 5) return 'UNKNOWN';
  if (durationSeconds < 15) return 'NOT_INTERESTED';
  if (durationSeconds > 30) return 'INTERESTED';
  return 'NEUTRAL';
}

/**
 * Get color for status dot based on call duration/category
 * @param {number} durationSeconds - Call duration in seconds
 * @returns {string} CSS color value
 */
function getDotColor(durationSeconds) {
  if (durationSeconds < 5) return '#6c757d'; // gray for unknown
  if (durationSeconds < 15) return '#dc3545'; // red for not interested
  if (durationSeconds > 30) return '#28a745'; // green for interested
  return '#ffc107'; // yellow for neutral
}

// Update summary information
function updateSummaryInfo(recordings) {
  // Update counts
  const totalRecordsEl = document.getElementById('totalRecords');
  const startRecordEl = document.getElementById('startRecord');
  const endRecordEl = document.getElementById('endRecord');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  
  if (totalRecordsEl) totalRecordsEl.textContent = recordings.length;
  if (startRecordEl) startRecordEl.textContent = recordings.length > 0 ? '1' : '0';
  if (endRecordEl) endRecordEl.textContent = Math.min(25, recordings.length);
  if (lastUpdatedEl) lastUpdatedEl.textContent = formatDate(new Date());
}

// Format date for timestamp display
function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Set up search functionality
function setupSearch() {
  const searchInput = document.getElementById('searchRecordings');
  const searchButton = document.getElementById('searchButton');
  
  if (!searchInput || !searchButton) return;
  
  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      populateTable(recordingsData);
      updateSummaryInfo(recordingsData);
      return;
    }
    
    const filteredRecordings = recordingsData.filter(recording => 
      recording.unique_id.toLowerCase().includes(searchTerm) ||
      recording.number.toLowerCase().includes(searchTerm) ||
      recording.timestamp.toLowerCase().includes(searchTerm)
    );
    
    populateTable(filteredRecordings);
    
    // Update summary counts
    if (document.getElementById('totalRecords')) {
      document.getElementById('totalRecords').textContent = filteredRecordings.length;
    }
    if (document.getElementById('startRecord')) {
      document.getElementById('startRecord').textContent = filteredRecordings.length > 0 ? '1' : '0';
    }
    if (document.getElementById('endRecord')) {
      document.getElementById('endRecord').textContent = Math.min(25, filteredRecordings.length);
    }
    
    showToast('Search Results', `Found ${filteredRecordings.length} matching recordings`, 'info');
  }
  
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') performSearch();
  });
}

// Set up filter functionality
function setupFilters() {
  const applyFiltersBtn = document.getElementById('applyFilters');
  const resetFiltersBtn = document.getElementById('resetFilters');
  
  if (!applyFiltersBtn || !resetFiltersBtn) return;
  
  // Initialize date picker if it exists
  const dateRangePicker = document.getElementById('dateRange');
  if (dateRangePicker) {
    // Initialize flatpickr with single date selection
    flatpickr(dateRangePicker, {
      dateFormat: "Y-m-d",
      defaultDate: "2025-03-04",
      maxDate: "today",
      disableMobile: "true",
      mode: "single" // Set to single date selection
    });
  }
  
  applyFiltersBtn.addEventListener('click', function() {
    const dateRangeElement = document.getElementById('dateRange');
    const phoneFilter = document.getElementById('phoneFilter')?.value;
    
    // Get the selected date (already in YYYY-MM-DD format thanks to flatpickr)
    let dateFilter = '2025-03-04'; // Default date
    if (dateRangeElement && dateRangeElement.value) {
      dateFilter = dateRangeElement.value; // Use the date as is
    }
    
    // Call loadRecordings with the date
    loadRecordings(dateFilter);
    
    // Apply additional filters (like phone number) to the loaded data
    if (phoneFilter) {
      let filteredRecordings = [...recordingsData].filter(rec => 
        rec.number.includes(phoneFilter)
      );
      
      populateTable(filteredRecordings);
      
      // Update summary counts
      if (document.getElementById('totalRecords')) {
        document.getElementById('totalRecords').textContent = filteredRecordings.length;
      }
      if (document.getElementById('startRecord')) {
        document.getElementById('startRecord').textContent = filteredRecordings.length > 0 ? '1' : '0';
      }
      if (document.getElementById('endRecord')) {
        document.getElementById('endRecord').textContent = Math.min(25, filteredRecordings.length);
      }
      
      showToast('Filters Applied', `Showing ${filteredRecordings.length} filtered recordings`, 'info');
    }
  });
  
  resetFiltersBtn.addEventListener('click', function() {
    // Reset filter form
    const filterForm = document.getElementById('recordingsFilters');
    if (filterForm) filterForm.reset();
    
    // Reset date picker to default value
    if (dateRangePicker && dateRangePicker._flatpickr) {
      dateRangePicker._flatpickr.setDate('2025-03-04');
    }
    
    // Load recordings with default date
    loadRecordings('2025-03-04');
  });
}

// Show toast notification
function showToast(title, message, type = 'info') {
  const toastContainer = document.createElement('div');
  toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
  toastContainer.style.zIndex = '5';
  
  let bgClass = 'bg-info';
  switch(type) {
    case 'success': bgClass = 'bg-success'; break;
    case 'danger': bgClass = 'bg-danger'; break;
    case 'warning': bgClass = 'bg-warning'; break;
  }
  
  toastContainer.innerHTML = `
    <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header ${bgClass} text-white">
        <strong class="me-auto">${title}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;
  
  document.body.appendChild(toastContainer);
  
  setTimeout(() => {
    document.body.removeChild(toastContainer);
  }, 3000);
}/**
 * XDial Networks Direct Recording Player - Render.com Compatible Version
 * 
 * This script handles playing recordings directly from the server
 * with dynamic loading from API endpoint, with fixes for CORS and HTTPS issues.
 */

// Global variables for the audio player
let audioPlayer;
let playPauseBtn;
let rewindBtn;
let forwardBtn;
let muteBtn;
let volumeSlider;
let audioProgress;
let progressContainer;
let currentTimeDisplay;
let durationDisplay;
let currentRecordingTitle;
let currentRecordingId;
let currentRecordingTime;
let currentTranscript;
let allChannelBtn;
let inChannelBtn;
let outChannelBtn;
let currentRecording = null;
let currentChannel = 'all'; // Default to all channel
let recordingsData = []; // Will be populated from API

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize audio player elements
  initAudioPlayer();
  
  // Initialize flatpickr for date picker
  const dateRangePicker = document.getElementById('dateRange');
  if (dateRangePicker) {
    flatpickr(dateRangePicker, {
      dateFormat: "Y-m-d",
      defaultDate: "2025-03-04",
      maxDate: "today",
      disableMobile: "true",
      mode: "single" // Set to single date selection
    });
  }
  
  // Load recordings with default date
  loadRecordings('2025-03-04');
  
  // Set up refresh button
  document.getElementById('refreshBtn').addEventListener('click', function() {
    // Show loading animation
    this.innerHTML = '<i class="bi bi-arrow-repeat me-1 animate-spin"></i> Loading...';
    
    // Get current date value from the date picker
    const dateRangeElement = document.getElementById('dateRange');
    let dateFilter = '2025-03-04'; // Default date
    
    if (dateRangeElement && dateRangeElement.value) {
      dateFilter = dateRangeElement.value; // Use the date as is - YYYY-MM-DD format
    }
    
    // Refresh recordings with the current date
    loadRecordings(dateFilter);
    
    // Reset button after a short delay
    setTimeout(() => {
      this.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Refresh';
    }, 1000);
  });
  
  // Set up search functionality
  setupSearch();
  
  // Set up filter functionality
  setupFilters();
});

/**
 * Function to fetch recording data from the server with fixed date formatting
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} - Promise resolving to recording data
 */
function fetchRecordingData(date = '2025-03-04') {
  // IMPORTANT FIX: API requires date without hyphens (YYYYMMDD format)
  // Convert from YYYY-MM-DD to YYYYMMDD
  const formattedDate = date.replace(/-/g, '');
  console.log(formattedDate);
  const apiUrl = `https://dialerai.originnet.com.pk/xlite_dashboard/fetch_recording.php?date=${formattedDate}`;
  
  console.log('Fetching recordings with formatted date:', formattedDate);
  console.log('API URL:', apiUrl);
  
  // Show loading state
  document.getElementById('recordingsTable').querySelector('tbody').innerHTML = 
    '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"></div><span class="ms-2">Loading recordings for ' + date + '...</span></td></tr>';
  
  // Fetch the recording data
  return fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text(); // Get the raw text first
    })
    .then(rawText => {
      console.log('Raw API response:', rawText); // Log the raw response for debugging
      
      // If response is empty or clearly invalid, throw error
      if (!rawText || rawText.trim().length < 10) {
        throw new Error('Empty or invalid response from server');
      }
      
      // IMPROVED JSON EXTRACTION - Specifically handles the <PRE> tag and % character
      let jsonText = rawText;
      
      // Remove any HTML tags completely (like <PRE>)
      jsonText = jsonText.replace(/<\/?[^>]+(>|$)/g, '');
      
      // Remove any non-JSON characters at the end (like % or whitespace)
      jsonText = jsonText.replace(/[\s%]*$/, '');
      
      // Find JSON object - look for first { and last }
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
        console.error('Could not find valid JSON in response');
        console.error('Raw response:', rawText);
        throw new Error('Invalid JSON format in response');
      }
      
      // Extract just the JSON portion
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      
      console.log('Extracted JSON:', jsonText); // Log the extracted JSON
      
      try {
        // Attempt to parse the JSON
        return JSON.parse(jsonText);
      } catch (e) {
        console.error('JSON parse error:', e);
        console.error('Failed JSON string:', jsonText);
        
        // Last resort attempt - try a more aggressive cleanup
        try {
          // Try to fix common JSON issues
          jsonText = jsonText.replace(/,\s*}/g, '}'); // Remove trailing commas
          jsonText = jsonText.replace(/\\/g, '\\\\'); // Fix backslash escaping
          
          console.log('Last resort JSON attempt:', jsonText);
          return JSON.parse(jsonText);
        } catch (e2) {
          console.error('Second JSON parse attempt failed:', e2);
          throw new Error(`Failed to parse JSON: ${e.message}`);
        }
      }
    })
    .then(data => {
      if (!data || Object.keys(data).length === 0) {
        throw new Error('No recordings found for this date');
      }
      
      console.log('Successfully retrieved recording data:', data);
      return transformRecordingData(data);
    });
}

/**
 * If the native fetch fails, this function provides a fallback for testing
 * by using sample recording data.
 */
function getSampleRecordingData() {
  // Sample data matching the API format we expect
  return {
    "1": {
      "date": "20250304",
      "time": "105042",
      "number": "8166640811",
      "duration": "00:00:25",
      "url": "https://file-examples.com/storage/fef1706276640f943a7c8a6/2017/11/file_example_MP3_700KB.mp3",
      "name": "sample-1.mp3"
    },
    "2": {
      "date": "20250304",
      "time": "110407",
      "number": "8166640811",
      "duration": "00:00:31",
      "url": "https://file-examples.com/storage/fef1706276640f943a7c8a6/2017/11/file_example_MP3_700KB.mp3",
      "name": "sample-2.mp3"
    }
  };
}

/**
 * Transform the API response data with Render.com compatibility fixes
 * @param {Object} apiData - Raw API response data
 * @returns {Array} - Transformed recording data
 */
function transformRecordingData(apiData) {
  return Object.keys(apiData).map(key => {
    const item = apiData[key];
    
    // Parse date and time
    const year = item.date.substring(0, 4);
    const month = item.date.substring(4, 6);
    const day = item.date.substring(6, 8);
    
    const hour = item.time.substring(0, 2);
    const minute = item.time.substring(2, 4);
    const second = item.time.substring(4, 6);
    
    // Parse duration (format: "00:00:31")
    const durationParts = item.duration.split(':');
    const durationInSeconds = 
      parseInt(durationParts[0]) * 3600 + 
      parseInt(durationParts[1]) * 60 + 
      parseInt(durationParts[2]);
    
    // Generate a unique ID combining date, time and number
    const uniqueId = `${item.date}-${item.time}_${item.number}`;
    
    // Get the original audio URL
    const originalUrl = item.url;
    
    // Create a download-friendly URL
    let downloadUrl = originalUrl;
    
    // Create a suitable playback URL based on the environment
    let playbackUrl = originalUrl;
    
    // Check if we're running on Render.com or another HTTPS host
    if (window.location.protocol === 'https:') {
      // For Render.com deployment, use a CORS proxy
      
      // OPTION 1: Use AllOrigins proxy (reliable)
      // playbackUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(originalUrl);
      
      // OPTION 2: Use CORS.sh proxy (alternative)
      playbackUrl = 'https://cors.sh/' + originalUrl;
      
      
      console.log('Using CORS proxy for HTTPS compatibility:', playbackUrl);
    }
    
    // Return transformed record
    return {
      id: parseInt(key),
      unique_id: uniqueId,
      timestamp: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
      duration: durationInSeconds,
      agent: 'system',
      speech_text: "", // No transcript in API response
      audio_url: playbackUrl,
      download_url: downloadUrl, // Original URL for downloads
      number: item.number,
      channelUrls: {
        all: playbackUrl,
        in: playbackUrl,
        out: playbackUrl
      }
    };
  });
}

/**
 * Load recordings data and initialize the player with improved error handling
 * @param {string} date - Date in YYYY-MM-DD format (e.g., '2025-03-04')
 */
function loadRecordings(date = '2025-03-04') {
  fetchRecordingData(date)
    .then(recordings => {
      // Update global recordings data
      recordingsData = recordings;
      
      // Populate the table
      populateTable(recordings);
      updateSummaryInfo(recordings);
      
      // Show success message
      showToast('Recordings Loaded', `${recordings.length} recordings are ready to play`, 'success');
    })
    .catch(error => {
      console.error('Error loading recordings:', error);
      
      // Enhanced error handling
      if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
        showToast('CORS Error', 'Server does not allow cross-origin requests. Contact administrator to enable CORS.', 'danger');
      } else if (error.message.includes('Invalid JSON') || error.message.includes('Failed to parse JSON')) {
        showToast('Error', 'The server returned an invalid format. Using sample data instead.', 'warning');
        
        // Use sample data as fallback
        const sampleData = getSampleRecordingData();
        const transformedData = transformRecordingData(sampleData);
        
        // Update global recordings data with sample data
        recordingsData = transformedData;
        
        // Populate the table with sample data
        populateTable(transformedData);
        updateSummaryInfo(transformedData);
      } else {
        // Generic error handler - use sample data
        showToast('Error', 'Could not load recordings from server. Using sample data instead.', 'warning');
        
        // Use sample data as fallback
        const sampleData = getSampleRecordingData();
        const transformedData = transformRecordingData(sampleData);
        
        // Update global recordings data with sample data
        recordingsData = transformedData;
        
        // Populate the table with sample data
        populateTable(transformedData);
        updateSummaryInfo(transformedData);
      }
    });
}

/**
 * Complete rewrite of the playRecording function with Render.com compatibility
 */
function playRecording(recording) {
  if (!recording) return;
  
  // Set current recording
  currentRecording = recording;
  
  // Update UI elements
  updatePlayerUI(recording);
  
  // Show loading indicator
  playPauseBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
  showToast('Loading', 'Loading audio file...', 'info');
  
  // Set volume from slider
  audioPlayer.volume = volumeSlider ? (volumeSlider.value / 100) : 1;
  
  // Reset any previous sources and errors
  audioPlayer.pause();
  audioPlayer.removeAttribute('src');
  audioPlayer.innerHTML = '';
  audioPlayer.load();
  
  // Try multiple approaches to play the audio
  tryPlayWithAudioElement(recording)
    .catch(error => {
      console.log('Direct audio element playback failed:', error);
      return tryPlayWithSourceElements(recording);
    })
    .catch(error => {
      console.log('Source elements playback failed:', error);
      return tryPlayWithAudioContext(recording);
    })
    .catch(error => {
      console.log('AudioContext playback failed:', error);
      return playFallbackAudio();
    })
    .catch(error => {
      console.error('All playback methods failed:', error);
      showToast('Playback Error', 'Unable to play this recording. Please try downloading instead.', 'danger');
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    });
}

/**
 * Update the player UI with recording information
 */
function updatePlayerUI(recording) {
  // Update info display
  if (currentRecordingTitle) currentRecordingTitle.textContent = `Recording ${recording.unique_id}`;
  if (currentRecordingId) currentRecordingId.textContent = `ID: ${recording.unique_id}`;
  if (currentRecordingTime) currentRecordingTime.textContent = `Time: ${recording.timestamp}`;
  if (currentTranscript) currentTranscript.textContent = recording.speech_text || 'No transcript available.';
  
  // Highlight the row in the table
  const rows = document.querySelectorAll('#recordingsTable tbody tr');
  rows.forEach(row => row.classList.remove('playing-row'));
  document.querySelector(`#recordingsTable tbody tr[data-id="${recording.id}"]`)?.classList.add('playing-row');
  
  // Update channel button states
  if (allChannelBtn) allChannelBtn.disabled = !recording.channelUrls || !recording.channelUrls['all'];
  if (inChannelBtn) inChannelBtn.disabled = !recording.channelUrls || !recording.channelUrls['in'];
  if (outChannelBtn) outChannelBtn.disabled = !recording.channelUrls || !recording.channelUrls['out'];
}

/**
 * Attempt to play using direct Audio element src attribute - Render.com compatible
 */
function tryPlayWithAudioElement(recording) {
  return new Promise((resolve, reject) => {
    // Determine which audio URL to use
    let audioUrl = getAudioUrl(recording);
    
    console.log('Trying to play audio with direct src:', audioUrl);
    
    // Set up event listeners
    const loadHandler = () => {
      playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      showToast('Playing', `Now playing: ${recording.unique_id}`, 'success');
      resolve();
    };
    
    const errorHandler = (error) => {
      console.error('Direct audio playback error:', error);
      reject(error);
    };
    
    // Set one-time event handlers
    audioPlayer.addEventListener('playing', loadHandler, { once: true });
    audioPlayer.addEventListener('error', errorHandler, { once: true });
    
    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      audioPlayer.removeEventListener('playing', loadHandler);
      audioPlayer.removeEventListener('error', errorHandler);
      reject(new Error('Playback timeout'));
    }, 10000); // Increased timeout for proxy services
    
    // Set source and play
    audioPlayer.src = audioUrl;
    audioPlayer.load();
    
    // Try to play
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          clearTimeout(timeout);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    }
  });
}

/**
 * Attempt to play using multiple source elements
 */
function tryPlayWithSourceElements(recording) {
  return new Promise((resolve, reject) => {
    console.log('Trying to play with source elements');
    showToast('Compatibility', 'Trying alternate format...', 'info');
    
    // Clear any existing sources
    audioPlayer.innerHTML = '';
    audioPlayer.removeAttribute('src');
    
    // Determine which audio URL to use
    let audioUrl = getAudioUrl(recording);
    
    // Create source elements for different formats
    const sourceMP3 = document.createElement('source');
    sourceMP3.src = audioUrl;
    sourceMP3.type = 'audio/mpeg';
    
    // Add to audio player
    audioPlayer.appendChild(sourceMP3);
    
    // Set up event listeners
    const loadHandler = () => {
      playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      showToast('Playing', `Now playing: ${recording.unique_id}`, 'success');
      resolve();
    };
    
    const errorHandler = (error) => {
      console.error('Source elements playback error:', error);
      reject(error);
    };
    
    // Set one-time event handlers
    audioPlayer.addEventListener('playing', loadHandler, { once: true });
    audioPlayer.addEventListener('error', errorHandler, { once: true });
    
    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      audioPlayer.removeEventListener('playing', loadHandler);
      audioPlayer.removeEventListener('error', errorHandler);
      reject(new Error('Source elements playback timeout'));
    }, 10000); // Increased timeout for proxy services
    
    // Try to load and play
    audioPlayer.load();
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          clearTimeout(timeout);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    }
  });
}

/**
 * Play audio with AudioContext for better compatibility
 * This is an alternative approach when regular audio element doesn't work
 */
function tryPlayWithAudioContext(recording) {
  return new Promise((resolve, reject) => {
    // Feature detection
    if (!window.AudioContext && !window.webkitAudioContext) {
      reject(new Error('AudioContext not supported in this browser'));
      return;
    }
    
    showToast('Compatibility', 'Trying AudioContext playback method...', 'info');
    console.log('Attempting to play with AudioContext API');
    
    // Get the audio URL
    const audioUrl = getAudioUrl(recording);
    
    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    let source = null;
    
    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      if (source) {
        source.disconnect();
      }
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
      reject(new Error('AudioContext playback timeout'));
    }, 15000);
    
    // Fetch the audio file
    fetch(audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        // Decode the audio data
        return audioContext.decodeAudioData(arrayBuffer);
      })
      .then(audioBuffer => {
        // Create a buffer source node
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect to destination (speakers)
        source.connect(audioContext.destination);
        
        // Play the audio
        source.start(0);
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        clearTimeout(timeout);
        
        // Update the UI
        showToast('Playing', `Now playing: ${recording.unique_id}`, 'success');
        
        // Handle completion
        source.onended = () => {
          playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
          if (audioContext.state !== 'closed') {
            audioContext.close();
          }
        };
        
        resolve();
      })
      .catch(error => {
        console.error('AudioContext playback error:', error);
        clearTimeout(timeout);
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        reject(error);
      });
  });
}

/**
 * Play a local fallback audio as last resort
 */
function playFallbackAudio() {
  return new Promise((resolve, reject) => {
    console.log('Playing fallback audio');
    showToast('Fallback', 'Using local audio sample due to compatibility issues', 'warning');
    
    // Create a local, very short base64 encoded audio sample
    // This is a 1-second MP3 beep tone
    const fallbackBase64 = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    
    // Reset audio player
    audioPlayer.innerHTML = '';
    audioPlayer.src = fallbackBase64;
    audioPlayer.load();
    
    // Set up event listeners
    const loadHandler = () => {
      playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      resolve();
    };
    
    const errorHandler = (error) => {
      console.error('Fallback audio playback error:', error);
      reject(error);
    };
    
    // Set one-time event handlers
    audioPlayer.addEventListener('playing', loadHandler, { once: true });
    audioPlayer.addEventListener('error', errorHandler, { once: true });
    
    // Try to play
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        reject(error);
      });
    }
  });
}

/**
 * Get the appropriate audio URL from the recording
 */
function getAudioUrl(recording) {
  // Determine which channel to play
  let audioUrl;
  if (recording.channelUrls && recording.channelUrls[currentChannel]) {
    audioUrl = recording.channelUrls[currentChannel];
  } else if (recording.channelUrls && recording.channelUrls['all']) {
    audioUrl = recording.channelUrls['all'];
    currentChannel = 'all';
    if (allChannelBtn) allChannelBtn.classList.add('active');
    if (inChannelBtn) inChannelBtn.classList.remove('active');
    if (outChannelBtn) outChannelBtn.classList.remove('active');
  } else {
    audioUrl = recording.audio_url;
  }
  
  return audioUrl;
}

/**
 * Setup download buttons with special handling for HTTPS environments
 */
function setupDownloadButtons(recordings) {
  document.querySelectorAll('.download-recording').forEach(button => {
    button.addEventListener('click', function() {
      const recordingId = parseInt(this.getAttribute('data-id'));
      const recording = recordings.find(rec => rec.id === recordingId);
      
      if (recording) {
        // For downloads, use the original URL rather than the proxied one
        // This opens in a new tab for the user to handle the download
        let downloadUrl = recording.download_url || recording.audio_url;
        
        if (!downloadUrl) {
          showToast('Download Error', 'No valid download URL found for this recording.', 'danger');
          return;
        }
        
        // For HTTPS sites, warn about mixed content
        if (window.location.protocol === 'https:' && downloadUrl.startsWith('http:')) {
          showToast('Download Notice', 'Audio will open in a new tab for download due to security restrictions', 'info');
          window.open(downloadUrl, '_blank');
          return;
        }
        
        // Regular download attempt
        try {
          // Show download in progress toast
          showToast('Download Started', 'Preparing download, please wait...', 'info');
          
          // Create a hidden anchor element for the download
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = `recording-${recording.unique_id}.mp3`;
          downloadLink.target = '_blank'; // Open in new tab as fallback
          
          // Attach to body, click, and remove
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Show success toast after a short delay
          setTimeout(() => {
            showToast('Download Complete', `Recording ${recording.unique_id} download initiated.`, 'success');
          }, 1000);
        } catch (e) {
          console.error('Download error:', e);
          // Fallback to opening in new tab
          window.open(downloadUrl, '_blank');
        }
      }
    });
  });
}

// Initialize audio player controls
function initAudioPlayer() {
  // Get audio player elements
  audioPlayer = document.getElementById('audioPlayer');
  playPauseBtn = document.getElementById('playPauseBtn');
  rewindBtn = document.getElementById('rewindBtn');
  forwardBtn = document.getElementById('forwardBtn');
  muteBtn = document.getElementById('muteBtn');
  volumeSlider = document.getElementById('volumeSlider');
  audioProgress = document.getElementById('audioProgress');
  progressContainer = document.querySelector('.progress');
  currentTimeDisplay = document.getElementById('currentTime');
  durationDisplay = document.getElementById('duration');
  currentRecordingTitle = document.getElementById('currentRecordingTitle');
  currentRecordingId = document.getElementById('currentRecordingId');
  currentRecordingTime = document.getElementById('currentRecordingTime');
  currentTranscript = document.getElementById('currentTranscript');
  
  // Get channel control buttons if they exist
  allChannelBtn = document.getElementById('allChannelBtn');
  inChannelBtn = document.getElementById('inChannelBtn');
  outChannelBtn = document.getElementById('outChannelBtn');
  
  // Check if audio player exists before adding event listeners
  if (!audioPlayer) {
    console.error('Audio player element not found in the DOM');
    return;
  }
  
  // Add audio player event listeners (with null checks)
  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
  if (rewindBtn) rewindBtn.addEventListener('click', () => skipAudio(-5));
  if (forwardBtn) forwardBtn.addEventListener('click', () => skipAudio(5));
  if (muteBtn) muteBtn.addEventListener('click', toggleMute);
  if (volumeSlider) volumeSlider.addEventListener('input', adjustVolume);
  if (progressContainer) progressContainer.addEventListener('click', seekAudio);
  
  // Add channel button listeners if they exist
  if (allChannelBtn) allChannelBtn.addEventListener('click', () => switchChannel('all'));
  if (inChannelBtn) inChannelBtn.addEventListener('click', () => switchChannel('in'));
  if (outChannelBtn) outChannelBtn.addEventListener('click', () => switchChannel('out'));
  
  // Add audio event listeners
  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('loadedmetadata', updateDuration);
  audioPlayer.addEventListener('ended', handleAudioEnded);
  audioPlayer.addEventListener('error', handleAudioError);
}

// Toggle play/pause with improved error handling
function togglePlayPause() {
  if (!audioPlayer.src && currentRecording) {
    // If we have a recording but no src, try to play it
    playRecording(currentRecording);
    return;
  }
  
  if (!audioPlayer.src) {
    // If no src and no recording, use the fallback
    playFallbackAudio()
      .then(() => {
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      })
      .catch(error => {
        console.error('Error playing fallback:', error);
        showToast('Playback Error', 'Could not play audio', 'danger');
      });
    return;
  }
  
  if (audioPlayer.paused) {
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Playback started successfully
          playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        })
        .catch(error => {
          // Auto-play was prevented or there was an error
          console.error('Play error:', error);
          
          // Show fallback message
          playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
          showToast('Playback Error', 'Some browsers restrict audio without user interaction.', 'warning');
          
          // Try playing with user interaction next time
        });
    }
  } else {
    audioPlayer.pause();
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
  }
}