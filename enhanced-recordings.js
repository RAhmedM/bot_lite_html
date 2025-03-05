// Function to fetch the directory listings from the server
async function fetchDirectoryContents(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Create a temporary DOM element to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get all links from the directory listing
      const links = Array.from(doc.querySelectorAll('a'));
      
      // Filter out parent directory and only keep WAV files
      const recordings = links
        .filter(link => link.href.endsWith('.wav') && !link.href.includes('Parent'))
        .map(link => {
          // Extract the filename
          const fileName = link.textContent.trim();
          
          // Extract date from filename (format: YYYYMMDD-HHMMSS)
          const dateMatch = fileName.match(/(\d{8})-(\d{6})_/);
          let timestamp = '';
          
          if (dateMatch) {
            // Format: YYYYMMDD-HHMMSS
            const dateStr = dateMatch[1];
            const timeStr = dateMatch[2];
            
            // Format as YYYY-MM-DD HH:MM:SS
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            
            const hours = timeStr.substring(0, 2);
            const minutes = timeStr.substring(2, 4);
            const seconds = timeStr.substring(4, 6);
            
            timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          }
          
          // Extract phone number if present
          const phoneMatch = fileName.match(/_(\d+)-/);
          const phoneNumber = phoneMatch ? phoneMatch[1] : '';
          
          // Determine if it's an incoming or outgoing call
          const direction = fileName.includes('-in.') ? 'incoming' : 
                           fileName.includes('-out.') ? 'outgoing' : 
                           fileName.includes('-all.') ? 'both' : 'unknown';
          
          // Estimate duration based on file size (very rough approximation)
          // The file size is in the 4th column, 3rd <a> tag from the right
          const size = link.parentElement.nextSibling.nextSibling.textContent.trim();
          const sizeValue = parseInt(size);
          
          // Very rough approximation: 1K ~= 1 second for 8kHz 8-bit audio
          // This is just an estimate and would need refinement for actual use
          let duration = 0;
          if (size.includes('K')) {
            duration = sizeValue;
          } else if (size.includes('M')) {
            duration = sizeValue * 1024;
          }
          
          return {
            id: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
            fileName: fileName,
            url: new URL(link.href).pathname, // Get the pathname part of the URL
            timestamp: timestamp,
            phoneNumber: phoneNumber,
            direction: direction,
            size: size,
            duration: Math.round(duration / 40), // Rough duration estimate in seconds
            speech_text: '', // Empty for now, would need transcription service
            response_category: 'UNKNOWN' // Default category
          };
        });
      
      return recordings;
    } catch (error) {
      console.error('Error fetching directory contents:', error);
      return [];
    }
  }
  
  // Process recordings to format them for the UI
  function processRecordings(recordings) {
    // Group recordings by ID to combine in/out/all files
    const groupedRecordings = {};
    
    recordings.forEach(recording => {
      const baseId = recording.id.replace(/-in$/, '').replace(/-out$/, '').replace(/-all$/, '');
      
      if (!groupedRecordings[baseId]) {
        groupedRecordings[baseId] = {
          id: baseId,
          urls: {},
          timestamp: recording.timestamp,
          phoneNumber: recording.phoneNumber,
          duration: recording.duration,
          speech_text: recording.speech_text,
          response_category: recording.response_category,
          agent: 'system'
        };
      }
      
      // Add URL based on direction
      if (recording.direction === 'incoming') {
        groupedRecordings[baseId].urls.in = recording.url;
      } else if (recording.direction === 'outgoing') {
        groupedRecordings[baseId].urls.out = recording.url;
      } else if (recording.direction === 'both') {
        groupedRecordings[baseId].urls.all = recording.url;
      }
      
      // Use the maximum duration found
      if (recording.duration > groupedRecordings[baseId].duration) {
        groupedRecordings[baseId].duration = recording.duration;
      }
    });
    
    // Convert back to array and format for UI
    return Object.values(groupedRecordings).map((recording, index) => ({
      id: index + 1,
      unique_id: recording.phoneNumber || recording.id,
      timestamp: recording.timestamp,
      duration: recording.duration,
      response_category: recording.response_category,
      agent: recording.agent,
      speech_text: recording.speech_text,
      audio_url: recording.urls.all || recording.urls.in || recording.urls.out,
      audio_urls: recording.urls
    }));
  }
  
  // Main function to load recordings
  async function loadRecordings() {
    const baseUrl = 'http://5.78.123.166/RECORDINGS/ORIG/';
    
    // Show loading state
    document.getElementById('refreshBtn').innerHTML = '<i class="bi bi-arrow-repeat me-1 animate-spin"></i> Loading...';
    
    try {
      // First, fetch the root directory to get folder structure
      const rootRecordings = await fetchDirectoryContents(baseUrl);
      
      // Then fetch contents from the 2025-03-04 directory
      const dateRecordings = await fetchDirectoryContents(baseUrl + '2025-03-04/');
      
      // Combine and process all recordings
      const allRecordings = [...rootRecordings, ...dateRecordings];
      const processedRecordings = processRecordings(allRecordings);
      
      // Populate the table with the recordings
      populateTable(processedRecordings);
      
      // Update summary counts
      document.getElementById('totalRecords').textContent = processedRecordings.length;
      document.getElementById('startRecord').textContent = processedRecordings.length > 0 ? '1' : '0';
      document.getElementById('endRecord').textContent = Math.min(25, processedRecordings.length);
      
      // Update last updated timestamp
      const now = new Date();
      document.getElementById('lastUpdated').textContent = formatDate(now);
      
      // Show success message
      showToast('Data Loaded', `Successfully loaded ${processedRecordings.length} recordings`, 'success');
    } catch (error) {
      console.error('Error loading recordings:', error);
      showToast('Error', 'Failed to load recordings. Using sample data instead.', 'danger');
      
      // Fall back to the sample data
      populateTable(callRecordings);
    } finally {
      // Reset loading state
      document.getElementById('refreshBtn').innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Refresh';
    }
  }
  
  // Modified playRecording function to handle actual server URLs
  function playRecording(recording) {
    // Get the base URL from the recording
    const serverBaseUrl = 'http://5.78.123.166';
    const audioUrl = recording.audio_url;
    
    if (!audioUrl) {
      showToast('Error', 'No audio URL available for this recording', 'danger');
      return;
    }
    
    // Set the audio source to the actual URL
    const fullUrl = serverBaseUrl + audioUrl;
    audioPlayer.src = fullUrl;
    
    // Update current recording info
    currentRecordingTitle.textContent = `${recording.response_category || 'UNKNOWN'} - ${recording.unique_id}`;
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
    durationDisplay.textContent = formatTime(recording.duration || 0);
    
    // Set volume
    audioPlayer.volume = volumeSlider.value / 100;
    
    // Set current recording
    currentRecording = recording;
    
    // Load and play
    audioPlayer.load();
    
    // Add error handling
    audioPlayer.onerror = function() {
      showToast('Error', `Failed to load audio: ${audioPlayer.error.message}`, 'danger');
      console.error('Audio error:', audioPlayer.error);
    };
    
    // Start playing when loaded
    audioPlayer.oncanplaythrough = function() {
      audioPlayer.play()
        .then(() => {
          playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        })
        .catch(error => {
          console.error('Play error:', error);
          showToast('Error', 'Failed to play audio. This may be due to browser autoplay restrictions.', 'warning');
        });
    };
  }
  
  // Toast notification function
  function showToast(title, message, type = 'info') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '5';
    
    let bgClass = 'bg-info';
    switch(type) {
      case 'success':
        bgClass = 'bg-success';
        break;
      case 'danger':
        bgClass = 'bg-danger';
        break;
      case 'warning':
        bgClass = 'bg-warning';
        break;
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
  
  // Format date for timestamp display
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Original initialization code remains...
    
    // Modify refresh button to load recordings from server
    document.getElementById('refreshBtn').addEventListener('click', function() {
      loadRecordings();
    });
    
    // Load recordings on initial page load
    loadRecordings();
  });
  