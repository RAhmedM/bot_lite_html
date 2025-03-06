document.addEventListener('DOMContentLoaded', function() {
  // Base URL for the proxy server
  const PROXY_URL = "http://localhost:3000/api/";
  
  // DOM Elements
  const recordingsTable = document.getElementById('recordingsTable');
  const audioPlayer = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const rewindBtn = document.getElementById('rewindBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const muteBtn = document.getElementById('muteBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const currentTime = document.getElementById('currentTime');
  const duration = document.getElementById('duration');
  const audioProgress = document.getElementById('audioProgress');
  const connectionStatus = document.getElementById('connectionStatus');
  const recordingsError = document.getElementById('recordingsError');
  const currentRecordingTitle = document.getElementById('currentRecordingTitle');
  const currentRecordingId = document.getElementById('currentRecordingId');
  const currentRecordingTime = document.getElementById('currentRecordingTime');
  const currentTranscript = document.getElementById('currentTranscript');
  
  // Channel control elements
  const allChannelBtn = document.getElementById('allChannelBtn');
  const inChannelBtn = document.getElementById('inChannelBtn');
  const outChannelBtn = document.getElementById('outChannelBtn');
  
  // Filter elements
  const dateRangePicker = document.getElementById('dateRange');
  const campaignFilter = document.getElementById('campaignFilter');
  const responseFilter = document.getElementById('responseFilter');
  const durationFilter = document.getElementById('durationFilter');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const resetFiltersBtn = document.getElementById('resetFilters');
  const searchInput = document.getElementById('searchRecordings');
  const searchButton = document.getElementById('searchButton');
  
  // Pagination elements
  const startRecord = document.getElementById('startRecord');
  const endRecord = document.getElementById('endRecord');
  const totalRecords = document.getElementById('totalRecords');
  
  // Initialize date picker
  flatpickr(dateRangePicker, {
    mode: "range",
    dateFormat: "Y-m-d",
    defaultDate: [new Date().setDate(new Date().getDate() - 7), new Date()],
    maxDate: "today"
  });
  
  // Global variables for state
  let allRecordings = [];
  let filteredRecordings = [];
  let currentPage = 1;
  let recordsPerPage = 25;
  let currentRecording = null;
  let currentChannel = 'all'; // 'all', 'in', or 'out'
  
  // Fetch and store all recordings
  async function fetchRecordings() {
    connectionStatus.className = 'badge bg-warning';
    connectionStatus.textContent = 'Connecting...';
    
    try {
      // Fetch available folders from the proxy server
      const foldersResponse = await fetch(`${PROXY_URL}folders`);
      if (!foldersResponse.ok) {
        throw new Error('Failed to fetch recordings directories');
      }
      
      const foldersData = await foldersResponse.json();
      const folders = foldersData.folders || [];
      
      // Sort folders by date (newest first)
      folders.sort().reverse();
      
      // Limit to just the latest few folders to avoid too many requests
      const recentFolders = folders.slice(0, 7); // Last week's worth
      
      // Modified: Skip main directory files and only process folder files
      let allFiles = [];
      
      for (const folder of recentFolders) {
        try {
          const folderName = folder.replace('/', ''); // Remove trailing slash
          const folderResponse = await fetch(`${PROXY_URL}folder-files/${folderName}`);
          
          if (!folderResponse.ok) {
            console.warn(`Skipping folder ${folder} - not accessible`);
            continue;
          }
          
          const folderData = await folderResponse.json();
          const folderFiles = (folderData.files || []).map(file => ({
            filename: file.filename,
            path: `${PROXY_URL}audio/${folderName}/${file.filename}`,
            date: extractDateFromFilename(file.filename),
            phoneNumber: extractPhoneFromFilename(file.filename),
            type: extractTypeFromFilename(file.filename),
            fileId: extractIdFromFilename(file.filename)
          }));
          
          // Group folder files by their fileId
          const groupedFolderFiles = groupFilesByCallId(folderFiles);
          allFiles = [...allFiles, ...groupedFolderFiles];
          
        } catch (error) {
          console.error(`Error fetching files from folder ${folder}:`, error);
        }
      }
      
      // Sort all files by date (newest first)
      allFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Generate display data for each recording
      allRecordings = allFiles.map((file, index) => ({
        id: index + 1,
        unique_id: file.fileId,
        timestamp: formatDate(file.date),
        duration: '00:20', // Placeholder, would need audio metadata
        response_category: randomResponseCategory(), // Placeholder, would need backend data
        agent: 'Agent', // Placeholder, would need backend data
        paths: {
          all: file.paths.all || (file.paths.in ? file.paths.in : file.paths.out),
          in: file.paths.in,
          out: file.paths.out
        },
        phoneNumber: file.phoneNumber
      }));
      
      // Update connection status
      connectionStatus.className = 'badge bg-success';
      connectionStatus.textContent = 'Connected';
      
      // Update total records count
      totalRecords.textContent = allRecordings.length;
      
      // Filter and display recordings
      filterAndDisplayRecordings();
      
    } catch (error) {
      console.error('Error fetching recordings:', error);
      connectionStatus.className = 'badge bg-danger';
      connectionStatus.textContent = 'Disconnected';
      recordingsError.classList.remove('d-none');
      
      // Create some sample data for demo purposes
      createSampleData();
    }
  }
  
  // Extract date from filename
  function extractDateFromFilename(filename) {
    const dateMatch = filename.match(/(\d{8})-\d{6}/);
    if (dateMatch && dateMatch[1]) {
      const dateStr = dateMatch[1];
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return `${year}-${month}-${day}`;
    }
    return 'Unknown Date';
  }
  
  // Extract phone number from filename
  function extractPhoneFromFilename(filename) {
    const phoneMatch = filename.match(/\d{8}-\d{6}_(\d+)-/);
    return phoneMatch && phoneMatch[1] ? phoneMatch[1] : 'Unknown';
  }
  
  // Extract file type (in, out, all) from filename
  function extractTypeFromFilename(filename) {
    const typeMatch = filename.match(/-([a-z]+)\.wav$/);
    return typeMatch && typeMatch[1] ? typeMatch[1] : 'unknown';
  }
  
  // Extract unique call ID from filename
  function extractIdFromFilename(filename) {
    const idMatch = filename.match(/(\d{8}-\d{6}_\d+)-/);
    return idMatch && idMatch[1] ? idMatch[1] : filename;
  }
  
  // Group files by their call ID
  function groupFilesByCallId(files) {
    const grouped = {};
    
    files.forEach(file => {
      if (!grouped[file.fileId]) {
        grouped[file.fileId] = {
          fileId: file.fileId,
          date: file.date,
          phoneNumber: file.phoneNumber,
          paths: {}
        };
      }
      
      // Add file path based on type
      grouped[file.fileId].paths[file.type] = file.path;
    });
    
    return Object.values(grouped);
  }
  
  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  // Random response category for demo
  function randomResponseCategory() {
    const categories = [
      'ANSWER_MACHINE', 'INTERESTED', 'NOT_INTERESTED', 
      'DO_NOT_CALL', 'DNQ', 'UNKNOWN'
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }
  
  // Filter and display recordings based on current filters
  function filterAndDisplayRecordings() {
    const campaignValue = campaignFilter.value;
    const responseValue = responseFilter.value;
    const durationValue = durationFilter.value;
    const dateRangeValue = dateRangePicker.value;
    const searchValue = searchInput.value.toLowerCase();
    
    // Start with all recordings
    filteredRecordings = [...allRecordings];
    
    // Apply date range filter if specified
    if (dateRangeValue) {
      const [startDate, endDate] = dateRangeValue.split(' to ').map(d => d ? new Date(d) : null);
      
      if (startDate && endDate) {
        // Set to beginning and end of days for inclusive comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        filteredRecordings = filteredRecordings.filter(rec => {
          const recDate = new Date(rec.timestamp);
          return recDate >= startDate && recDate <= endDate;
        });
      }
    }
    
    // Apply response category filter if specified
    if (responseValue !== 'all') {
      filteredRecordings = filteredRecordings.filter(rec => 
        rec.response_category === responseValue
      );
    }
    
    // Apply duration filter if specified
    if (durationValue !== 'all') {
      // Convert duration string to seconds for comparison
      const getDurationSeconds = (durationStr) => {
        const parts = durationStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      };
      
      filteredRecordings = filteredRecordings.filter(rec => {
        const durationSeconds = getDurationSeconds(rec.duration);
        
        switch (durationValue) {
          case 'short':
            return durationSeconds < 10;
          case 'medium':
            return durationSeconds >= 10 && durationSeconds <= 30;
          case 'long':
            return durationSeconds > 30;
          default:
            return true;
        }
      });
    }
    
    // Apply search filter if there's a search term
    if (searchValue) {
      filteredRecordings = filteredRecordings.filter(rec => 
        rec.unique_id.toLowerCase().includes(searchValue) ||
        rec.phoneNumber.toLowerCase().includes(searchValue) ||
        rec.timestamp.toLowerCase().includes(searchValue) ||
        rec.response_category.toLowerCase().includes(searchValue)
      );
    }
    
    // Update pagination info
    totalRecords.textContent = filteredRecordings.length;
    
    // Display records for current page
    displayRecordings();
  }
  
  // Display recordings for the current page
  function displayRecordings() {
    const tbody = recordingsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, filteredRecordings.length);
    
    // Update pagination display
    startRecord.textContent = filteredRecordings.length > 0 ? startIndex + 1 : 0;
    endRecord.textContent = endIndex;
    totalRecords.textContent = filteredRecordings.length;
    
    // Create table rows for each recording in current page
    for (let i = startIndex; i < endIndex; i++) {
      const recording = filteredRecordings[i];
      
      // Create response category badge
      let badgeClass = 'bg-secondary';
      switch (recording.response_category) {
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
      }
      
      // Create table row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${recording.id}</td>
        <td>${recording.unique_id}</td>
        <td>${recording.timestamp}</td>
        <td>${recording.duration}</td>
        <td><span class="badge ${badgeClass}">${recording.response_category}</span></td>
        <td>${recording.agent}</td>
        <td>
          <button class="btn btn-sm btn-primary play-recording" data-index="${i}">
            <i class="bi bi-play-fill"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary" title="Download">
            <i class="bi bi-download"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(row);
    }
    
    // Add event listeners to play buttons
    document.querySelectorAll('.play-recording').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        playRecording(filteredRecordings[index]);
      });
    });
    
    // Update pagination controls
    updatePagination();
  }
  
  // Update pagination controls
  function updatePagination() {
    const pagination = document.querySelector('.pagination');
    const totalPages = Math.ceil(filteredRecordings.length / recordsPerPage);
    
    let paginationHTML = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="prev">Previous</a>
      </li>
    `;
    
    // Calculate which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ensure we show at least 5 pages if available
    if (endPage - startPage < 4 && totalPages > 5) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // Generate page number links
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }
    
    paginationHTML += `
      <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="next">Next</a>
      </li>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Add event listeners to pagination links
    document.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const page = this.getAttribute('data-page');
        
        if (page === 'prev') {
          if (currentPage > 1) {
            currentPage--;
            displayRecordings();
          }
        } else if (page === 'next') {
          if (currentPage < totalPages) {
            currentPage++;
            displayRecordings();
          }
        } else {
          currentPage = parseInt(page);
          displayRecordings();
        }
      });
    });
  }
  
  // Play a recording
  function playRecording(recording) {
    // Stop any current playback
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    
    // Update current recording reference
    currentRecording = recording;
    
    // Update player display information
    currentRecordingTitle.textContent = `Call with ${recording.phoneNumber}`;
    currentRecordingId.textContent = `ID: ${recording.unique_id}`;
    currentRecordingTime.textContent = `Time: ${recording.timestamp}`;
    currentTranscript.textContent = "No transcript available.";
    
    // Set proper audio source based on selected channel
    updateAudioSource();
    
    // Update play button icon
    playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    
    // Start playback
    audioPlayer.play().catch(error => {
      console.error('Error playing audio:', error);
      playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    });
    
    // Highlight the current playing recording in the table
    document.querySelectorAll('tbody tr').forEach(row => {
      row.classList.remove('playing-row');
    });
    
    const playingButtons = document.querySelectorAll(`.play-recording[data-index]`);
    for (let button of playingButtons) {
      const index = button.getAttribute('data-index');
      if (filteredRecordings[index].id === recording.id) {
        button.closest('tr').classList.add('playing-row');
        break;
      }
    }
  }
  
  // Update audio source based on selected channel
  function updateAudioSource() {
    if (!currentRecording) return;
    
    let sourcePath;
    
    // Select the appropriate audio file based on channel selection
    switch (currentChannel) {
      case 'in':
        sourcePath = currentRecording.paths.in || currentRecording.paths.all;
        break;
      case 'out':
        sourcePath = currentRecording.paths.out || currentRecording.paths.all;
        break;
      default: // 'all'
        sourcePath = currentRecording.paths.all || 
                    (currentRecording.paths.in ? currentRecording.paths.in : currentRecording.paths.out);
    }
    
    // Set the source and load the audio
    if (sourcePath) {
      audioPlayer.src = sourcePath;
      audioPlayer.load();
    } else {
      console.warn('No audio source available for the selected channel');
    }
  }
  
  // Format time display (e.g., 0:00)
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Create sample data for demo if fetching fails
  function createSampleData() {
    allRecordings = [];
    
    // Generate sample data with unique timestamps
    const now = new Date();
    
    for (let i = 0; i < 246; i++) {
      const recordTime = new Date(now);
      recordTime.setMinutes(now.getMinutes() - i * 5); // Each record 5 minutes apart
      
      allRecordings.push({
        id: i + 1,
        unique_id: `20250304-1050${i % 60}_${8166640800 + i}`,
        timestamp: formatDate(recordTime),
        duration: `00:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
        response_category: randomResponseCategory(),
        agent: `Agent ${Math.floor(i / 10) + 1}`,
        paths: {
          all: null,
          in: null,
          out: null
        },
        phoneNumber: `${8166640800 + i}`
      });
    }
    
    // Filter and display the sample data
    filterAndDisplayRecordings();
  }
  
  // Audio player event listeners
  playPauseBtn.addEventListener('click', function() {
    if (audioPlayer.paused) {
      audioPlayer.play();
      this.innerHTML = '<i class="bi bi-pause-fill"></i>';
    } else {
      audioPlayer.pause();
      this.innerHTML = '<i class="bi bi-play-fill"></i>';
    }
  });
  
  rewindBtn.addEventListener('click', function() {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
  });
  
  forwardBtn.addEventListener('click', function() {
    audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
  });
  
  muteBtn.addEventListener('click', function() {
    if (audioPlayer.muted) {
      audioPlayer.muted = false;
      this.innerHTML = '<i class="bi bi-volume-up"></i>';
    } else {
      audioPlayer.muted = true;
      this.innerHTML = '<i class="bi bi-volume-mute"></i>';
    }
  });
  
  volumeSlider.addEventListener('input', function() {
    audioPlayer.volume = this.value / 100;
    
    // Update mute button icon based on volume
    if (this.value == 0) {
      audioPlayer.muted = true;
      muteBtn.innerHTML = '<i class="bi bi-volume-mute"></i>';
    } else {
      audioPlayer.muted = false;
      muteBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
    }
  });
  
  // Audio progress bar updates
  audioPlayer.addEventListener('timeupdate', function() {
    if (isNaN(audioPlayer.duration)) return;
    
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    audioProgress.style.width = `${progressPercent}%`;
    currentTime.textContent = formatTime(audioPlayer.currentTime);
  });
  
  audioPlayer.addEventListener('loadedmetadata', function() {
    duration.textContent = formatTime(audioPlayer.duration);
  });
  
  audioPlayer.addEventListener('ended', function() {
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    audioProgress.style.width = '0%';
  });
  
  // Progress bar click for seeking
  document.querySelector('.progress').addEventListener('click', function(e) {
    if (audioPlayer.readyState > 0) {
      const percent = e.offsetX / this.offsetWidth;
      audioPlayer.currentTime = percent * audioPlayer.duration;
    }
  });
  
  // Channel control buttons
  allChannelBtn.addEventListener('click', function() {
    setActiveChannel('all');
  });
  
  inChannelBtn.addEventListener('click', function() {
    setActiveChannel('in');
  });
  
  outChannelBtn.addEventListener('click', function() {
    setActiveChannel('out');
  });
  
  // Set active channel and update UI
  function setActiveChannel(channel) {
    // Update active button
    document.querySelectorAll('.channel-controls .btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Set selected channel
    currentChannel = channel;
    
    // Update active class on appropriate button
    switch (channel) {
      case 'in':
        inChannelBtn.classList.add('active');
        break;
      case 'out':
        outChannelBtn.classList.add('active');
        break;
      default:
        allChannelBtn.classList.add('active');
    }
    
    // If there's a current recording, update the source
    if (currentRecording) {
      const isPlaying = !audioPlayer.paused;
      const currentPosition = audioPlayer.currentTime;
      
      // Update the audio source
      updateAudioSource();
      
      // Restore playback position after source change
      audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
        audioPlayer.currentTime = currentPosition;
        if (isPlaying) {
          audioPlayer.play();
        }
        audioPlayer.removeEventListener('loadedmetadata', onLoaded);
      });
    }
  }
  
  // Filter button event listeners
  applyFiltersBtn.addEventListener('click', function() {
    filterAndDisplayRecordings();
  });
  
  resetFiltersBtn.addEventListener('click', function() {
    // Reset all filter inputs
    dateRangePicker._flatpickr.clear();
    campaignFilter.value = '001'; // Default value from HTML
    responseFilter.value = 'all';
    durationFilter.value = 'all';
    searchInput.value = '';
    
    // Reset to first page
    currentPage = 1;
    
    // Apply reset filters
    filterAndDisplayRecordings();
  });
  
  // Search functionality
  searchButton.addEventListener('click', function() {
    // Reset to first page when searching
    currentPage = 1;
    filterAndDisplayRecordings();
  });
  
  searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      currentPage = 1;
      filterAndDisplayRecordings();
    }
  });
  
  // Records per page change event
  document.getElementById('recordsPerPage').addEventListener('change', function() {
    recordsPerPage = parseInt(this.value);
    currentPage = 1; // Reset to first page
    displayRecordings();
  });
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', function() {
    fetchRecordings();
    
    // Update last updated timestamp
    const now = new Date();
    document.getElementById('lastUpdated').textContent = formatDate(now);
    
    // Add animation to show refresh action
    this.querySelector('i').classList.add('animate-spin');
    setTimeout(() => {
      this.querySelector('i').classList.remove('animate-spin');
    }, 500);
  });
  
  // Initialize by fetching recordings
  fetchRecordings();
});