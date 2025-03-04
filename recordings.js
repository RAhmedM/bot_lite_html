document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker
    flatpickr("#dateRange", {
      mode: "range",
      dateFormat: "Y-m-d",
      defaultDate: [new Date().setDate(new Date().getDate() - 7), new Date()],
      maxDate: "today"
    });
  
    // Sample data for call recordings
    const callRecordings = [
      { id: 1, unique_id: '1245678799', timestamp: '2025-03-04 10:11:40', duration: 12, response_category: 'ANSWER_MACHINE', agent: 'stone', speech_text: 'hello this is john please leave a message after the beep', audio_url: 'recordings/1245678799.mp3' },
      { id: 2, unique_id: '1245678800', timestamp: '2025-03-04 10:12:15', duration: 24, response_category: 'NOT_INTERESTED', agent: 'stone', speech_text: 'no i am not interested thank you please remove me from your list', audio_url: 'recordings/1245678800.mp3' },
      { id: 3, unique_id: '1245678801', timestamp: '2025-03-04 10:15:22', duration: 37, response_category: 'INTERESTED', agent: 'sarah', speech_text: 'yes i would like to know more about your offer please tell me more about the pricing', audio_url: 'recordings/1245678801.mp3' },
      { id: 4, unique_id: '1245678802', timestamp: '2025-03-04 10:17:45', duration: 18, response_category: 'DO_NOT_CALL', agent: 'sarah', speech_text: 'please remove me from your list do not call me again', audio_url: 'recordings/1245678802.mp3' },
      { id: 5, unique_id: '1245678803', timestamp: '2025-03-04 10:20:33', duration: 9, response_category: 'UNKNOWN', agent: 'james', speech_text: 'this is not a good time for me', audio_url: 'recordings/1245678803.mp3' },
      { id: 6, unique_id: '1245678804', timestamp: '2025-03-04 10:25:11', duration: 22, response_category: 'DNQ', agent: 'james', speech_text: 'i do not qualify for this offer because i am not a homeowner', audio_url: 'recordings/1245678804.mp3' },
      { id: 7, unique_id: '1245678805', timestamp: '2025-03-04 10:30:40', duration: 42, response_category: 'INTERESTED', agent: 'stone', speech_text: 'can you call me later this afternoon i am interested but cant talk right now', audio_url: 'recordings/1245678805.mp3' },
      { id: 8, unique_id: '1245678806', timestamp: '2025-03-04 10:35:12', duration: 7, response_category: 'ANSWER_MACHINE', agent: 'sarah', speech_text: 'hello this is johns voicemail leave a message', audio_url: 'recordings/1245678806.mp3' },
      { id: 9, unique_id: '1245678807', timestamp: '2025-03-04 10:40:55', duration: 15, response_category: 'NOT_INTERESTED', agent: 'james', speech_text: 'no calls please email me instead', audio_url: 'recordings/1245678807.mp3' },
      { id: 10, unique_id: '1245678808', timestamp: '2025-03-04 10:45:23', duration: 8, response_category: 'NOT_INTERESTED', agent: 'stone', speech_text: 'i already have that service', audio_url: 'recordings/1245678808.mp3' },
      { id: 11, unique_id: '1245678809', timestamp: '2025-03-04 10:50:17', duration: 28, response_category: 'INTERESTED', agent: 'sarah', speech_text: 'id like to hear more can you explain the terms in detail', audio_url: 'recordings/1245678809.mp3' },
      { id: 12, unique_id: '1245678810', timestamp: '2025-03-04 11:05:32', duration: 6, response_category: 'ANSWER_MACHINE', agent: 'james', speech_text: 'you have reached the office of dr smith', audio_url: 'recordings/1245678810.mp3' }
    ];
  
    // Audio player elements
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const audioProgress = document.getElementById('audioProgress');
    const progressContainer = document.querySelector('.progress');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');
    
    // Recording info elements
    const currentRecordingTitle = document.getElementById('currentRecordingTitle');
    const currentRecordingId = document.getElementById('currentRecordingId');
    const currentRecordingTime = document.getElementById('currentRecordingTime');
    const currentTranscript = document.getElementById('currentTranscript');
    
    // Initialize global variables
    let currentRecording = null;
    let selectedRecordings = [];
    
    // Audio player functionality
    playPauseBtn.addEventListener('click', togglePlayPause);
    rewindBtn.addEventListener('click', rewindAudio);
    forwardBtn.addEventListener('click', forwardAudio);
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', adjustVolume);
    progressContainer.addEventListener('click', seekAudio);
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
      durationDisplay.textContent = formatTime(audioPlayer.duration);
    });
    audioPlayer.addEventListener('ended', () => {
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
      audioProgress.style.width = '0%';
      currentTimeDisplay.textContent = '0:00';
    });
    
    // Function to toggle play/pause
    function togglePlayPause() {
      if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      } else {
        audioPlayer.pause();
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
      }
    }
    
    // Function to rewind audio
    function rewindAudio() {
      audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
    }
    
    // Function to forward audio
    function forwardAudio() {
      audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 5);
    }
    
    // Function to toggle mute
    function toggleMute() {
      audioPlayer.muted = !audioPlayer.muted;
      if (audioPlayer.muted) {
        muteBtn.innerHTML = '<i class="bi bi-volume-mute"></i>';
        volumeSlider.disabled = true;
      } else {
        muteBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
        volumeSlider.disabled = false;
      }
    }
    
    // Function to adjust volume
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
    
    // Function to seek audio
    function seekAudio(e) {
      const progressWidth = progressContainer.clientWidth;
      const clickPosition = e.offsetX;
      const seekTime = (clickPosition / progressWidth) * audioPlayer.duration;
      audioPlayer.currentTime = seekTime;
    }
    
    // Function to update progress bar
    function updateProgress() {
      const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      audioProgress.style.width = percentage + '%';
      currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    }
    
    // Function to format time (seconds to mm:ss)
    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  
    // Function to format duration for display in table
    function formatDuration(seconds) {
      return `${seconds}s`;
    }
    
    // Function to play a recording
    function playRecording(recording) {
      // In a real application, this would set the audio source to the actual recording
      // For this demo, we'll simulate it
      audioPlayer.src = recording.audio_url || 'dummy.mp3';
      
      // Update current recording info
      currentRecordingTitle.textContent = `${recording.response_category} - ${recording.agent}`;
      currentRecordingId.textContent = `ID: ${recording.unique_id}`;
      currentRecordingTime.textContent = `Time: ${recording.timestamp}`;
      currentTranscript.textContent = recording.speech_text || 'No transcript available.';
      
      // Highlight the currently playing recording in the table
      const rows = document.querySelectorAll('#recordingsTable tbody tr');
      rows.forEach(row => row.classList.remove('playing-row'));
      document.querySelector(`#recordingsTable tbody tr[data-id="${recording.id}"]`)?.classList.add('playing-row');
      
      // Reset player UI
      audioProgress.style.width = '0%';
      currentTimeDisplay.textContent = '0:00';
      durationDisplay.textContent = formatTime(recording.duration);
      
      // Set volume
      audioPlayer.volume = volumeSlider.value / 100;
      
      // Set current recording
      currentRecording = recording;
      
      // Start playing
      audioPlayer.load();
      
      // For demo purposes, we'll simulate loading time
      setTimeout(() => {
        // When real audio is available, this would happen naturally after loading
        audioPlayer.play();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      }, 500);
    }
  
    // Populate the table with recordings
    function populateTable(recordings) {
      const tableBody = document.querySelector('#recordingsTable tbody');
      tableBody.innerHTML = '';
  
      recordings.forEach(recording => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', recording.id);
        
        // Apply badge class based on response category
        let badgeClass = 'bg-secondary'; // Default
        switch(recording.response_category) {
          case 'INTERESTED':
            badgeClass = 'bg-success';
            break;
          case 'NOT_INTERESTED':
            badgeClass = 'bg-danger';
            break;
          case 'DO_NOT_CALL':
            badgeClass = 'bg-danger';
            break;
          case 'DNQ':
            badgeClass = 'bg-warning';
            break;
          case 'UNKNOWN':
            badgeClass = 'bg-dark';
            break;
          case 'ANSWER_MACHINE':
            badgeClass = 'bg-secondary';
            break;
        }
        
        row.innerHTML = `
          <td>${recording.id}</td>
          <td>${recording.unique_id}</td>
          <td>${recording.timestamp}</td>
          <td>${formatDuration(recording.duration)}</td>
          <td><span class="badge ${badgeClass}">${recording.response_category}</span></td>
          <td>${recording.agent}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-primary action-btn play-recording" title="Play" data-id="${recording.id}">
                <i class="bi bi-play-fill"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary action-btn" title="Download" data-id="${recording.id}">
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
  
      // Add event listeners for play buttons
      document.querySelectorAll('.play-recording').forEach(button => {
        button.addEventListener('click', function() {
          const recordingId = parseInt(this.getAttribute('data-id'));
          const recording = callRecordings.find(rec => rec.id === recordingId);
          if (recording) {
            playRecording(recording);
          }
        });
      });
    }
  
    // Initial population of the table
    populateTable(callRecordings);
    
    // Update summary counts
    document.getElementById('totalRecords').textContent = callRecordings.length;
    document.getElementById('startRecord').textContent = '1';
    document.getElementById('endRecord').textContent = Math.min(25, callRecordings.length);
  
    // Filter functionality
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    applyFiltersBtn.addEventListener('click', function() {
      // In a real application, this would make an API call with the filter values
      // For demo purposes, we'll just simulate filtering
      
      const campaignFilter = document.getElementById('campaignFilter').value;
      const responseFilter = document.getElementById('responseFilter').value;
      const durationFilter = document.getElementById('durationFilter').value;
      
      let filteredRecordings = [...callRecordings];
      
      if (responseFilter !== 'all') {
        filteredRecordings = filteredRecordings.filter(recording => recording.response_category === responseFilter);
      }
      
      if (durationFilter !== 'all') {
        switch(durationFilter) {
          case 'short':
            filteredRecordings = filteredRecordings.filter(recording => recording.duration < 10);
            break;
          case 'medium':
            filteredRecordings = filteredRecordings.filter(recording => recording.duration >= 10 && recording.duration <= 30);
            break;
          case 'long':
            filteredRecordings = filteredRecordings.filter(recording => recording.duration > 30);
            break;
        }
      }
      
      populateTable(filteredRecordings);
      
      // Update summary counts
      document.getElementById('totalRecords').textContent = filteredRecordings.length;
      document.getElementById('startRecord').textContent = filteredRecordings.length > 0 ? '1' : '0';
      document.getElementById('endRecord').textContent = Math.min(25, filteredRecordings.length);
      
      // Show filter feedback
      const toast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
          <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
              <strong class="me-auto">Filters Applied</strong>
              <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
              Showing ${filteredRecordings.length} recordings matching your criteria.
            </div>
          </div>
        </div>
      `;
      
      const toastContainer = document.createElement('div');
      toastContainer.innerHTML = toast;
      document.body.appendChild(toastContainer);
      
      setTimeout(() => {
        document.body.removeChild(toastContainer);
      }, 3000);
    });
    
    resetFiltersBtn.addEventListener('click', function() {
      document.getElementById('recordingsFilters').reset();
      populateTable(callRecordings);
      
      // Reset date range picker
      flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [new Date().setDate(new Date().getDate() - 7), new Date()],
        maxDate: "today"
      });
      
      // Reset summary counts
      document.getElementById('totalRecords').textContent = callRecordings.length;
      document.getElementById('startRecord').textContent = '1';
      document.getElementById('endRecord').textContent = Math.min(25, callRecordings.length);
    });
  
    // Search functionality
    const searchInput = document.getElementById('searchRecordings');
    const searchButton = document.getElementById('searchButton');
    
    function performSearch() {
      const searchTerm = searchInput.value.toLowerCase();
      
      if (searchTerm.trim() === '') {
        populateTable(callRecordings);
        return;
      }
      
      const searchResults = callRecordings.filter(recording => {
        return (
          recording.unique_id.toLowerCase().includes(searchTerm) ||
          recording.response_category.toLowerCase().includes(searchTerm) ||
          recording.agent.toLowerCase().includes(searchTerm) ||
          recording.speech_text.toLowerCase().includes(searchTerm)
        );
      });
      
      populateTable(searchResults);
      
      // Update summary counts
      document.getElementById('totalRecords').textContent = searchResults.length;
      document.getElementById('startRecord').textContent = searchResults.length > 0 ? '1' : '0';
      document.getElementById('endRecord').textContent = Math.min(25, searchResults.length);
    }
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  
    // Sorting functionality
    const sortableHeaders = document.querySelectorAll('.sortable');
    let currentSort = { column: 'id', direction: 'asc' };
    
    sortableHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const column = this.getAttribute('data-sort');
        
        // Toggle direction if clicking the same column
        if (currentSort.column === column) {
          currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.column = column;
          currentSort.direction = 'asc';
        }
        
        // Remove sort indicators from all headers
        sortableHeaders.forEach(h => {
          h.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        // Add sort indicator to current header
        this.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
        
        // Sort the recordings
        const sortedRecordings = [...callRecordings].sort((a, b) => {
          let valueA = a[column];
          let valueB = b[column];
          
          // Handle numeric values
          if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
            valueA = Number(valueA);
            valueB = Number(valueB);
          } 
          // Handle string values
          else if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
          }
          
          if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
          if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
          return 0;
        });
        
        populateTable(sortedRecordings);
      });
    });
  
    // Delete recording functionality
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    
    deleteConfirmModal.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      const recordingId = button.getAttribute('data-id');
      
      document.getElementById('deleteRecordingId').textContent = recordingId;
    });
    
    document.getElementById('confirmDelete').addEventListener('click', function() {
      const recordingId = parseInt(document.getElementById('deleteRecordingId').textContent);
      
      // Remove the recording from our "database"
      const recordingIndex = callRecordings.findIndex(r => r.id === recordingId);
      
      if (recordingIndex !== -1) {
        // If the deleted recording is currently playing, stop it
        if (currentRecording && currentRecording.id === recordingId) {
          audioPlayer.pause();
          audioPlayer.src = '';
          currentRecordingTitle.textContent = 'No recording selected';
          currentRecordingId.textContent = 'ID: --';
          currentRecordingTime.textContent = 'Time: --';
          currentTranscript.textContent = 'No transcript available.';
          playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
          currentRecording = null;
        }
        
        callRecordings.splice(recordingIndex, 1);
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(deleteConfirmModal);
        modal.hide();
        
        // Refresh the table
        populateTable(callRecordings);
        
        // Update pagination info
        document.getElementById('totalRecords').textContent = callRecordings.length;
        document.getElementById('endRecord').textContent = Math.min(25, callRecordings.length);
        
        // Show success message
        const toast = `
          <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="toast-header bg-danger text-white">
                <strong class="me-auto">Deleted</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
              <div class="toast-body">
                Recording #${recordingId} has been deleted successfully.
              </div>
            </div>
          </div>
        `;
        
        const toastContainer = document.createElement('div');
        toastContainer.innerHTML = toast;
        document.body.appendChild(toastContainer);
        
        setTimeout(() => {
          document.body.removeChild(toastContainer);
        }, 3000);
      }
    });
  
    // Refresh button functionality
    document.getElementById('refreshBtn').addEventListener('click', function() {
      // In a real application, this would fetch fresh data from the server
      populateTable(callRecordings);
      
      const now = new Date();
      const formattedDate = formatDate(now);
      document.getElementById('lastUpdated').textContent = formattedDate;
      
      // Add animation to show refresh action
      this.querySelector('i').classList.add('animate-spin');
      setTimeout(() => {
        this.querySelector('i').classList.remove('animate-spin');
      }, 500);
    });
    
    // Format date for last updated
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    // Pagination functionality
    const paginationLinks = document.querySelectorAll('.pagination .page-link');
    
    paginationLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // In a real application, this would fetch a specific page of data
        // For demo purposes, we'll just show the same data
        
        // Update active page
        document.querySelector('.page-item.active').classList.remove('active');
        this.closest('.page-item').classList.add('active');
      });
    });
  });