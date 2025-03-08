/**
 * XDial Networks Direct Recording Player - Updated Version
 * 
 * This script handles playing recordings directly from the server
 * with dynamic loading from API endpoint.
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
  const formattedDate = date
  console.log(formattedDate)
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
    };
}

/**
 * Transform the API response data to the format expected by the application
 * with URL protocol fix for HTTPS deployments
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
    
    // FIX: Convert HTTP URLs to HTTPS or use a proxy if needed
    let audioUrl = item.url;
    
    // Option 1: Try to convert HTTP to HTTPS if possible
    if (audioUrl && audioUrl.startsWith('http://')) {
      // Try to use HTTPS instead - this might work if the server supports it
      audioUrl = audioUrl.replace('http://', 'https://');
    }
    
    // Option 2: Use a CORS proxy (for development/testing only)
    // audioUrl = 'https://cors-anywhere.herokuapp.com/' + item.url;
    
    // Return transformed record without response_category
    return {
      id: parseInt(key),
      unique_id: uniqueId,
      timestamp: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
      duration: durationInSeconds,
      agent: 'system',
      speech_text: "", // No transcript in API response
      audio_url: audioUrl,
      number: item.number,
      channelUrls: {
        all: audioUrl,
        in: audioUrl,
        out: audioUrl
      }
    };
  });
}

/**
 * Simple logic to determine response category based on call duration
 * You may want to replace this with actual categorization logic
 */
function determineResponseCategory(durationSeconds) {
  if (durationSeconds < 5) return 'UNKNOWN';
  if (durationSeconds < 15) return 'NOT_INTERESTED';
  if (durationSeconds > 30) return 'INTERESTED';
  return 'UNKNOWN';
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
 * Play a recording with direct audio URL
 */
function playRecording(recording) {
  if (!recording) return;
  
  // Set current recording
  currentRecording = recording;
  
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
  
  // Update player UI before loading
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
  
  // Show loading indicator
  playPauseBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
  showToast('Loading', 'Loading audio file...', 'info');
  
  // Set volume from slider
  audioPlayer.volume = volumeSlider ? (volumeSlider.value / 100) : 1;
  
  // Reset any previous sources and errors
  audioPlayer.pause();
  audioPlayer.src = '';
  
  // Set audio loading timeout (10 seconds)
  const loadingTimeout = setTimeout(() => {
    // If we're still in loading state after timeout, switch to fallback
    if (playPauseBtn.innerHTML === '<i class="bi bi-hourglass-split"></i>') {
      showToast('Loading Timeout', 'Audio file took too long to load. Using fallback.', 'warning');
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
      audioPlayer.src = 'assets/audio/sample-call.mp3';
    }
  }, 10000);
  
  // Set up audio events for this specific loading operation
  const loadHandler = () => {
    clearTimeout(loadingTimeout);
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
  };
  
  const errorHandler = (error) => {
    clearTimeout(loadingTimeout);
    console.error('Error loading audio:', error);
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    showToast('Audio Error', 'Could not load audio file. Using fallback.', 'warning');
    audioPlayer.src = 'assets/audio/sample-call.mp3';
  };
  
  // Add temporary event listeners for this loading operation
  audioPlayer.addEventListener('loadeddata', loadHandler, { once: true });
  audioPlayer.addEventListener('error', errorHandler, { once: true });
  
  // Set the source and begin loading
  audioPlayer.src = audioUrl;
  audioPlayer.load();
  
  // Try to play only after a short delay to allow the browser to start loading
  setTimeout(() => {
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          clearTimeout(loadingTimeout);
          playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
          showToast('Playing', `Now playing: ${recording.unique_id}`, 'success');
        })
        .catch(error => {
          // This catch will handle play() errors, not loading errors
          console.error('Error playing audio:', error);
          playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
          
          // Handle autoplay policy issues
          if (error.name === 'NotAllowedError') {
            showToast('Autoplay Blocked', 'Browser blocked autoplay. Click play to listen.', 'warning');
          } else {
            showToast('Playback Error', error.message || 'Unknown error playing audio', 'danger');
          }
        });
    }
  }, 100);
}

// Add this variable to control local vs. remote data
let useLocalData = true; // Set to false in production

// Transform API data to our format
function transformApiData(apiData) {
  return Object.entries(apiData).map(([id, item]) => {
    // Format the timestamp from date and time fields
    const year = item.date.substring(0, 4);
    const month = item.date.substring(4, 6);
    const day = item.date.substring(6, 8);
    
    const hour = item.time.substring(0, 2);
    const minute = item.time.substring(2, 4);
    const second = item.time.substring(4, 6);
    
    const formattedTimestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    
    return {
      id: parseInt(id),
      unique_id: `${item.number}-${id}`,
      timestamp: formattedTimestamp,
      number: item.number,
      audio_url: item.url,
      channelUrls: {
        all: item.url
      }
    };
  });
}

// Initialize audio player controls
// Also add null checks in the initAudioPlayer function
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
  
  // Fallback audio source for testing when no real recordings are available
  audioPlayer.innerHTML = `
    <source src="assets/audio/sample-call.mp3" type="audio/mpeg">
    <source src="assets/audio/sample-call.wav" type="audio/wav">
    Your browser does not support the audio element.
  `;
}

// Toggle play/pause
function togglePlayPause() {
  if (!audioPlayer.src) {
    // If no src is set, use the fallback
    audioPlayer.src = 'assets/audio/sample-call.mp3';
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
          showToast('Playback Error', 'Using fallback audio. Some browsers restrict audio without user interaction.', 'warning');
          
          // Try playing a local fallback audio
          audioPlayer.src = 'assets/audio/sample-call.mp3';
        });
    }
  } else {
    audioPlayer.pause();
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
  }
}

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

// Handle audio error with fallback mechanism
function handleAudioError() {
  console.error('Audio error:', audioPlayer.error);
  
  // Display better error information for debugging
  let errorMsg = 'Could not play this recording.';
  if (audioPlayer.error) {
    switch(audioPlayer.error.code) {
      case 1: errorMsg = 'Audio fetching aborted.'; break;
      case 2: errorMsg = 'Network error while loading audio.'; break;
      case 3: errorMsg = 'Error decoding audio file.'; break;
      case 4: errorMsg = 'Audio format not supported or file not found.'; break;
    }
  }
  
  showToast('Audio Error', `${errorMsg} Using fallback audio.`, 'warning');
  
  // Try using a fallback audio file that's likely to work
  if (currentRecording) {
    audioPlayer.src = 'assets/audio/sample-call.mp3';
    audioPlayer.load();
    
    // Try playing after a short delay to give it time to load
    setTimeout(() => {
      audioPlayer.play()
        .then(() => {
          playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        })
        .catch(e => {
          console.error('Fallback play error:', e);
          playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        });
    }, 100);
  }
}

// Switch audio channel (in/out/all)
// Note: In this version, we only have 'all' channel from the API
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
  
  // Set new audio source with fallback
  let newSrc = '';
  if (currentRecording.channelUrls && currentRecording.channelUrls[channel]) {
    newSrc = currentRecording.channelUrls[channel];
  } else {
    // Fallback to available channel or default
    newSrc = currentRecording.audio_url || 'assets/audio/sample-call.mp3';
    showToast('Channel Unavailable', `${channel} channel not available, using default`, 'info');
  }
  
  audioPlayer.src = newSrc;
  audioPlayer.load();
  
  // Restore playback state after loading
  audioPlayer.addEventListener('loadedmetadata', function onceLoaded() {
    audioPlayer.removeEventListener('loadedmetadata', onceLoaded);
    audioPlayer.currentTime = currentTime;
    if (wasPlaying) {
      audioPlayer.play().catch(e => {
        console.error('Error resuming after channel switch:', e);
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
      });
    }
  });
}


/**
 * Fix for the duration display issue in populateTable function
 * 
 * Replace the existing populateTable function with this corrected version
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
  
  // Add event listeners to download buttons with improved functionality
  document.querySelectorAll('.download-recording').forEach(button => {
    button.addEventListener('click', function() {
      const recordingId = parseInt(this.getAttribute('data-id'));
      const recording = recordings.find(rec => rec.id === recordingId);
      
      if (recording) {
        let downloadUrl;
        
        // Get the appropriate URL based on the current channel or fallback to main audio URL
        if (recording.channelUrls && recording.channelUrls[currentChannel]) {
          downloadUrl = recording.channelUrls[currentChannel];
        } else if (recording.channelUrls && recording.channelUrls['all']) {
          downloadUrl = recording.channelUrls['all'];
        } else {
          downloadUrl = recording.audio_url;
        }
        
        if (!downloadUrl) {
          showToast('Download Error', 'No valid download URL found for this recording.', 'danger');
          return;
        }
        
        // Show download in progress toast
        showToast('Download Started', 'Preparing download, please wait...', 'info');
        
        // Create a hidden anchor element for the download
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `recording-${recording.unique_id}.mp3`;
        
        // Attach to body, click, and remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Show success toast after a short delay
        setTimeout(() => {
          showToast('Download Complete', `Recording ${recording.unique_id} download initiated.`, 'success');
        }, 1000);
      }
    });
  });
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

/**
 * Format a raw duration value to a human-readable time format
 * @param {number} rawDuration - Duration in milliseconds or seconds
 * @param {boolean} isMilliseconds - Whether the input is in milliseconds (true) or seconds (false)
 * @returns {string} Formatted duration as HH:MM:SS
 */
function formatDuration(rawDuration, isMilliseconds = true) {
  // Convert to seconds if needed
  let totalSeconds = isMilliseconds ? Math.floor(rawDuration / 1000) : Math.floor(rawDuration);
  
  // Handle very large numbers by checking if it's likely milliseconds when expecting seconds
  if (!isMilliseconds && totalSeconds > 100000000) {
    totalSeconds = Math.floor(totalSeconds / 1000);
  }
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Format as HH:MM:SS
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
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



// Format date for timestamp display
function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
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
}