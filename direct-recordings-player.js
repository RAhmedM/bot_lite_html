/**
 * XDial Networks Direct Recording Player
 * 
 * This script handles playing recordings directly from the server
 * using absolute URLs to bypass CORS restrictions.
 */

// Known recording URLs based on the directory listing
const recordingsData = [
    {
      id: 1,
      unique_id: '8166640811-1',
      timestamp: '2025-03-04 10:50:42',
      duration: 40,
      response_category: 'UNKNOWN',
      agent: 'system',
      speech_text: "I'm good how are you",
      // Direct URLs to the audio files
      audio_url: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105042_8166640811-in.wav',
      channelUrls: {
        in: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105042_8166640811-in.wav',
        out: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105042_8166640811-out.wav',
        all: 'http://5.78.123.166/RECORDINGS/ORIG/2025-03-04/20250304-105042_8166640811-all.wav'
      }
    },
    {
      id: 2,
      unique_id: '8166640811-2',
      timestamp: '2025-03-04 10:56:17',
      duration: 49,
      response_category: 'INTERESTED',
      agent: 'system',
      speech_text: 'yes I have active',
      audio_url: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105617_8166640811-in.wav',
      channelUrls: {
        in: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105617_8166640811-in.wav',
        out: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105617_8166640811-out.wav',
        all: 'http://5.78.123.166/RECORDINGS/ORIG/2025-03-04/20250304-105617_8166640811-all.wav'
      }
    },
    {
      id: 3,
      unique_id: '8166640811-3',
      timestamp: '2025-03-04 10:59:37',
      duration: 4,
      response_category: 'UNKNOWN',
      agent: 'system',
      speech_text: 'Short call',
      audio_url: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105937_8166640811-in.wav',
      channelUrls: {
        in: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105937_8166640811-in.wav',
        out: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-105937_8166640811-out.wav',
        all: 'http://5.78.123.166/RECORDINGS/ORIG/2025-03-04/20250304-105937_8166640811-all.wav'
      }
    },
    {
      id: 4,
      unique_id: '8166640811-4',
      timestamp: '2025-03-04 11:02:53',
      duration: 3,
      response_category: 'UNKNOWN',
      agent: 'system',
      speech_text: 'Very brief call',
      audio_url: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110253_8166640811-in.wav',
      channelUrls: {
        in: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110253_8166640811-in.wav',
        out: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110253_8166640811-out.wav',
        all: 'http://5.78.123.166/RECORDINGS/ORIG/2025-03-04/20250304-110253_8166640811-all.wav'
      }
    },
    {
      id: 5,
      unique_id: '8166640811-5',
      timestamp: '2025-03-04 11:04:07',
      duration: 49,
      response_category: 'INTERESTED',
      agent: 'system',
      speech_text: 'yes I have not',
      audio_url: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110407_8166640811-in.wav',
      channelUrls: {
        in: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110407_8166640811-in.wav',
        out: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110407_8166640811-out.wav',
        all: 'http://5.78.123.166/RECORDINGS/ORIG/2025-03-04/20250304-110407_8166640811-all.wav'
      }
    },
    {
      id: 6,
      unique_id: '8166640811-6',
      timestamp: '2025-03-04 11:07:19',
      duration: 39,
      response_category: 'UNKNOWN',
      agent: 'system',
      speech_text: 'no',
      audio_url: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110719_8166640811-in.wav',
      channelUrls: {
        in: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110719_8166640811-in.wav',
        out: 'http://5.78.123.166/RECORDINGS/ORIG/20250304-110719_8166640811-out.wav',
        all: 'http://5.78.123.166/RECORDINGS/ORIG/2025-03-04/20250304-110719_8166640811-all.wav'
      }
    }
  ];
  
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
  let currentChannel = 'in'; // Default to incoming channel
  
  // Initialize the page
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize audio player elements
    initAudioPlayer();
    
    // Populate the recordings table
    populateTable(recordingsData);
    
    // Update summary counts
    updateSummaryInfo(recordingsData);
    
    // Show success toast
    showToast('Recordings Loaded', `${recordingsData.length} recordings are ready to play`, 'success');
    
    // Set up refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
      // Show loading animation
      this.innerHTML = '<i class="bi bi-arrow-repeat me-1 animate-spin"></i> Loading...';
      
      // Simulate refresh (in a real app, you'd fetch new data here)
      setTimeout(() => {
        populateTable(recordingsData);
        updateSummaryInfo(recordingsData);
        
        // Show success message
        showToast('Refreshed', 'Recordings data refreshed', 'success');
        
        // Reset button
        this.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Refresh';
      }, 1000);
    });
    
    // Add search functionality
    setupSearch();
    
    // Add filter functionality
    setupFilters();
  });
  
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
    
    // Add audio player event listeners
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
    if (audioPlayer) {
      audioPlayer.addEventListener('timeupdate', updateProgress);
      audioPlayer.addEventListener('loadedmetadata', updateDuration);
      audioPlayer.addEventListener('ended', handleAudioEnded);
      audioPlayer.addEventListener('error', handleAudioError);
    }
  }
  
  // Toggle play/pause
  function togglePlayPause() {
    if (audioPlayer.paused) {
      audioPlayer.play()
        .then(() => {
          playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        })
        .catch(error => {
          console.error('Play error:', error);
          showToast('Playback Error', 'Could not play audio. Try clicking again.', 'warning');
        });
    } else {
      audioPlayer.pause();
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }
  }
  
  // Skip forward or backward
  function skipAudio(seconds) {
    audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.duration, audioPlayer.currentTime + seconds));
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
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / progressContainer.offsetWidth;
    audioPlayer.currentTime = pos * audioPlayer.duration;
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
  
  // Handle audio error
  function handleAudioError() {
    console.error('Audio error:', audioPlayer.error);
    showToast('Audio Error', 'Could not play this recording. Try another one.', 'danger');
  }
  
  // Switch audio channel (in/out/all)
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
    
    // Set new audio source
    if (currentRecording.channelUrls && currentRecording.channelUrls[channel]) {
      audioPlayer.src = currentRecording.channelUrls[channel];
      audioPlayer.load();
      
      // Restore playback state after loading
      audioPlayer.addEventListener('loadedmetadata', function onceLoaded() {
        audioPlayer.removeEventListener('loadedmetadata', onceLoaded);
        audioPlayer.currentTime = currentTime;
        if (wasPlaying) {
          audioPlayer.play().catch(e => console.error('Error resuming after channel switch:', e));
        }
      });
    } else {
      // If channel doesn't exist, show message and try another one
      showToast('Channel Unavailable', `${channel} channel not available, using default`, 'warning');
      switchChannel('in'); // Try the incoming channel as fallback
    }
  }
  
  // Play a recording
  function playRecording(recording) {
    if (!recording) return;
    
    // Set current recording
    currentRecording = recording;
    
    // Determine audio URL based on available channels and current selection
    let audioUrl;
    if (recording.channelUrls && recording.channelUrls[currentChannel]) {
      audioUrl = recording.channelUrls[currentChannel];
    } else if (recording.channelUrls && recording.channelUrls['in']) {
      audioUrl = recording.channelUrls['in'];
      currentChannel = 'in';
      if (inChannelBtn) inChannelBtn.classList.add('active');
      if (allChannelBtn) allChannelBtn.classList.remove('active');
      if (outChannelBtn) outChannelBtn.classList.remove('active');
    } else {
      audioUrl = recording.audio_url;
    }
    
    // Update player UI
    audioPlayer.src = audioUrl;
    currentRecordingTitle.textContent = `${recording.response_category} - ${recording.unique_id}`;
    currentRecordingId.textContent = `ID: ${recording.unique_id}`;
    currentRecordingTime.textContent = `Time: ${recording.timestamp}`;
    currentTranscript.textContent = recording.speech_text || 'No transcript available.';
    
    // Highlight the row in the table
    const rows = document.querySelectorAll('#recordingsTable tbody tr');
    rows.forEach(row => row.classList.remove('playing-row'));
    document.querySelector(`#recordingsTable tbody tr[data-id="${recording.id}"]`)?.classList.add('playing-row');
    
    // Update channel button states
    if (allChannelBtn) allChannelBtn.disabled = !recording.channelUrls || !recording.channelUrls['all'];
    if (inChannelBtn) inChannelBtn.disabled = !recording.channelUrls || !recording.channelUrls['in'];
    if (outChannelBtn) outChannelBtn.disabled = !recording.channelUrls || !recording.channelUrls['out'];
    
    // Set volume from slider
    audioPlayer.volume = volumeSlider ? (volumeSlider.value / 100) : 1;
    
    // Load and play
    audioPlayer.load();
    audioPlayer.play()
      .then(() => {
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      })
      .catch(error => {
        console.error('Play error:', error);
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        showToast('Playback Error', 'Click play to listen to the recording', 'info');
      });
  }
  
  // Populate the table with recordings data
  function populateTable(recordings) {
    const tableBody = document.querySelector('#recordingsTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    recordings.forEach(recording => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', recording.id);
      
      // Determine badge class based on response category
      let badgeClass = 'bg-secondary';
      switch(recording.response_category) {
        case 'INTERESTED': badgeClass = 'bg-success'; break;
        case 'NOT_INTERESTED': badgeClass = 'bg-danger'; break;
        case 'DO_NOT_CALL': badgeClass = 'bg-danger'; break;
        case 'DNQ': badgeClass = 'bg-warning'; break;
        case 'UNKNOWN': badgeClass = 'bg-dark'; break;
        case 'ANSWER_MACHINE': badgeClass = 'bg-secondary'; break;
      }
      
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
      
      row.innerHTML = `
        <td>${recording.id}</td>
        <td>${recording.unique_id}</td>
        <td>${recording.timestamp}</td>
        <td>${recording.duration}s</td>
        <td><span class="badge ${badgeClass}">${recording.response_category}</span></td>
        <td>${recording.agent}</td>
        <td>
          <div class="mb-1">${channelIcons}</div>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-primary action-btn play-recording" title="Play" data-id="${recording.id}">
              <i class="bi bi-play-fill"></i>
            </button>
            <button type="button" class="btn btn-outline-secondary action-btn download-recording" title="Download" data-id="${recording.id}">
              <i class="bi bi-download"></i>
            </button>
            <button type="button" class="btn btn-outline-danger action-btn" title="Delete" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal" data-id="${recording.id}">
              <i class="bi bi-trash"></i>
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
    
    // Add event listeners to download buttons
    document.querySelectorAll('.download-recording').forEach(button => {
      button.addEventListener('click', function() {
        const recordingId = parseInt(this.getAttribute('data-id'));
        const recording = recordings.find(rec => rec.id === recordingId);
        if (recording) {
          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = recording.channelUrls && recording.channelUrls[currentChannel] 
            ? recording.channelUrls[currentChannel] 
            : recording.audio_url;
          link.download = `recording-${recording.unique_id}.wav`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    });
  }
  
  // Update summary information
  function updateSummaryInfo(recordings) {
    // Update counts
    document.getElementById('totalRecords').textContent = recordings.length;
    document.getElementById('startRecord').textContent = recordings.length > 0 ? '1' : '0';
    document.getElementById('endRecord').textContent = Math.min(25, recordings.length);
    
    // Update last updated timestamp
    document.getElementById('lastUpdated').textContent = formatDate(new Date());
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
        recording.response_category.toLowerCase().includes(searchTerm) ||
        recording.agent.toLowerCase().includes(searchTerm) ||
        (recording.speech_text && recording.speech_text.toLowerCase().includes(searchTerm))
      );
      
      populateTable(filteredRecordings);
      
      // Update summary counts
      document.getElementById('totalRecords').textContent = filteredRecordings.length;
      document.getElementById('startRecord').textContent = filteredRecordings.length > 0 ? '1' : '0';
      document.getElementById('endRecord').textContent = Math.min(25, filteredRecordings.length);
      
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
    
    applyFiltersBtn.addEventListener('click', function() {
      const responseFilter = document.getElementById('responseFilter').value;
      const durationFilter = document.getElementById('durationFilter').value;
      
      let filteredRecordings = [...recordingsData];
      
      // Apply response category filter
      if (responseFilter !== 'all') {
        filteredRecordings = filteredRecordings.filter(rec => 
          rec.response_category === responseFilter
        );
      }
      
      // Apply duration filter
      if (durationFilter !== 'all') {
        switch(durationFilter) {
          case 'short':
            filteredRecordings = filteredRecordings.filter(rec => rec.duration < 10);
            break;
          case 'medium':
            filteredRecordings = filteredRecordings.filter(rec => 
              rec.duration >= 10 && rec.duration <= 30
            );
            break;
          case 'long':
            filteredRecordings = filteredRecordings.filter(rec => rec.duration > 30);
            break;
        }
      }
      
      populateTable(filteredRecordings);
      
      // Update summary counts
      document.getElementById('totalRecords').textContent = filteredRecordings.length;
      document.getElementById('startRecord').textContent = filteredRecordings.length > 0 ? '1' : '0';
      document.getElementById('endRecord').textContent = Math.min(25, filteredRecordings.length);
      
      showToast('Filters Applied', `Showing ${filteredRecordings.length} filtered recordings`, 'info');
    });
    
    resetFiltersBtn.addEventListener('click', function() {
      // Reset filter form
      document.getElementById('recordingsFilters').reset();
      
      // Repopulate with all data
      populateTable(recordingsData);
      updateSummaryInfo(recordingsData);
    });
  }
  
  // Format time for display (seconds to MM:SS)
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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