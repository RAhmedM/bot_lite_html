document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker
    flatpickr("#dateRange", {
      mode: "range",
      dateFormat: "Y-m-d",
      defaultDate: [new Date().setDate(new Date().getDate() - 7), new Date()],
      maxDate: "today"
    });
    
    // Add chart toggle functionality
    const barChartBtn = document.getElementById('barChartBtn');
    const pieChartBtn = document.getElementById('pieChartBtn');
    
    // Initialize response distribution chart
    const responseCtx = document.getElementById('responseDistributionChart').getContext('2d');
    // Set a fixed canvas height to prevent auto-expanding
    responseCtx.canvas.style.height = '400px';
    let responseChart = null;
    
    // Define chart data and colors for reuse
    const responseData = [
      { category: 'ANSWER_MACHINE', count: 9521, color: '#6c757d' },
      { category: 'INTERESTED', count: 327, color: '#28a745' },
      { category: 'NOT_INTERESTED', count: 4256, color: '#dc3545' },
      { category: 'DO_NOT_CALL', count: 284, color: '#9d0208' },
      { category: 'DNQ', count: 176, color: '#ffc107' },
      { category: 'UNKNOWN', count: 574, color: '#343a40' }
    ];
    
    const totalCalls = responseData.reduce((sum, item) => sum + item.count, 0);
    
    // Function to create bar chart
    function createBarChart() {
      // Destroy existing chart if it exists
      if (responseChart) {
        responseChart.destroy();
      }
      
      // Create labels with percentages
      const labels = responseData.map(item => {
        const percentage = ((item.count / totalCalls) * 100).toFixed(1);
        return `${item.category} (${percentage}%)`;
      });
      
      // Create bar chart
      responseChart = new Chart(responseCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Number of Calls',
            data: responseData.map(item => item.count),
            backgroundColor: responseData.map(item => `${item.color}CC`),
            borderColor: responseData.map(item => item.color),
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 50
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                display: true,
                drawBorder: true,
                color: 'rgba(200, 200, 200, 0.2)'
              },
              ticks: {
                callback: function(value) {
                  if (value >= 1000) {
                    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  }
                  return value;
                }
              }
            },
            y: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const percentage = ((value / totalCalls) * 100).toFixed(1);
                  return `Calls: ${value.toLocaleString()} (${percentage}%)`;
                },
                title: function(context) {
                  return context[0].label.split(' (')[0];
                }
              }
            }
          }
        }
      });
    }
    
    // Function to create pie chart
    function createPieChart() {
      // Destroy existing chart if it exists
      if (responseChart) {
        responseChart.destroy();
      }
      
      // Create pie chart
      responseChart = new Chart(responseCtx, {
        type: 'doughnut',
        data: {
          labels: responseData.map(item => item.category),
          datasets: [{
            data: responseData.map(item => item.count),
            backgroundColor: responseData.map(item => `${item.color}CC`),
            borderColor: responseData.map(item => item.color),
            borderWidth: 1,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '50%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15,
                padding: 15,
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i];
                      const percentage = ((value / totalCalls) * 100).toFixed(1);
                      return {
                        text: `${label} (${percentage}%)`,
                        fillStyle: data.datasets[0].backgroundColor[i],
                        hidden: false,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const percentage = ((value / totalCalls) * 100).toFixed(1);
                  return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
    
    // Set default chart
    createBarChart();
    
    // Add event listeners for chart type buttons
    barChartBtn.addEventListener('click', function() {
      barChartBtn.classList.add('active');
      pieChartBtn.classList.remove('active');
      createBarChart();
    });
    
    pieChartBtn.addEventListener('click', function() {
      pieChartBtn.classList.add('active');
      barChartBtn.classList.remove('active');
      createPieChart();
    });
    
    // Add responsive handling for the chart
    window.addEventListener('resize', function() {
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        // Adjust chart height based on available width
        if (window.innerWidth < 768) {
          if (pieChartBtn.classList.contains('active')) {
            responseChart.options.plugins.legend.position = 'bottom';
          }
        } else {
          if (pieChartBtn.classList.contains('active')) {
            responseChart.options.plugins.legend.position = 'right';
          }
        }
        responseChart.update();
      }
    });
  
    // Sample data for the table
    const callRecords = [
      { id: 1, unique_id: '1245678799', speech_text: 'how are you i am doing will', response_category: 'ANSWER_MACHINE', timestamp: '2025-03-04 10:11:40' },
      { id: 2, unique_id: '1245678800', speech_text: 'no i am not interested thank you', response_category: 'NOT_INTERESTED', timestamp: '2025-03-04 10:12:15' },
      { id: 3, unique_id: '1245678801', speech_text: 'yes i would like to know more about your offer', response_category: 'INTERESTED', timestamp: '2025-03-04 10:15:22' },
      { id: 4, unique_id: '1245678802', speech_text: 'please remove me from your list', response_category: 'DO_NOT_CALL', timestamp: '2025-03-04 10:17:45' },
      { id: 5, unique_id: '1245678803', speech_text: 'this is not a good time for me', response_category: 'UNKNOWN', timestamp: '2025-03-04 10:20:33' },
      { id: 6, unique_id: '1245678804', speech_text: 'i do not qualify for this offer', response_category: 'DNQ', timestamp: '2025-03-04 10:25:11' },
      { id: 7, unique_id: '1245678805', speech_text: 'can you call me later this afternoon', response_category: 'INTERESTED', timestamp: '2025-03-04 10:30:40' },
      { id: 8, unique_id: '1245678806', speech_text: 'hello this is johns voicemail leave a message', response_category: 'ANSWER_MACHINE', timestamp: '2025-03-04 10:35:12' },
      { id: 9, unique_id: '1245678807', speech_text: 'no calls please email me instead', response_category: 'NOT_INTERESTED', timestamp: '2025-03-04 10:40:55' },
      { id: 10, unique_id: '1245678808', speech_text: 'i already have that service', response_category: 'NOT_INTERESTED', timestamp: '2025-03-04 10:45:23' }
    ];
  
    // Populate the table with the sample data
    function populateTable(records) {
      const tableBody = document.querySelector('#reportTable tbody');
      tableBody.innerHTML = '';
  
      records.forEach(record => {
        const row = document.createElement('tr');
        
        // Apply badge class based on response category
        let badgeClass = 'bg-secondary'; // Default
        switch(record.response_category) {
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
          <td>${record.id}</td>
          <td>${record.unique_id}</td>
          <td>${record.speech_text}</td>
          <td><span class="badge ${badgeClass}">${record.response_category}</span></td>
          <td>${record.timestamp}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-secondary" title="Edit" data-bs-toggle="modal" data-bs-target="#editRecordModal" data-id="${record.id}">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary" title="Listen" data-bs-toggle="modal" data-bs-target="#audioPlayerModal" data-id="${record.id}">
                <i class="bi bi-headphones"></i>
              </button>
              <button type="button" class="btn btn-outline-danger" title="Delete" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal" data-id="${record.id}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
    }
  
    // Initial population of the table
    populateTable(callRecords);
  
    // Filter functionality
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    applyFiltersBtn.addEventListener('click', function() {
      // In a real application, this would make an API call with the filter values
      // For demo purposes, we'll just simulate filtering
      
      const campaignFilter = document.getElementById('campaignFilter').value;
      const responseFilter = document.getElementById('responseFilter').value;
      const agentFilter = document.getElementById('agentFilter').value;
      
      let filteredRecords = [...callRecords];
      
      if (responseFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.response_category === responseFilter);
      }
      
      populateTable(filteredRecords);
      
      // Update summary counts
      document.getElementById('totalRecords').textContent = filteredRecords.length;
      document.getElementById('startRecord').textContent = filteredRecords.length > 0 ? '1' : '0';
      document.getElementById('endRecord').textContent = Math.min(25, filteredRecords.length);
      
      // Show filter feedback
      const toast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
          <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
              <strong class="me-auto">Filters Applied</strong>
              <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
              Showing ${filteredRecords.length} records matching your criteria.
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
      document.getElementById('reportFilters').reset();
      populateTable(callRecords);
      
      // Reset date range picker
      flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [new Date().setDate(new Date().getDate() - 7), new Date()],
        maxDate: "today"
      });
      
      // Reset summary counts
      document.getElementById('totalRecords').textContent = callRecords.length;
      document.getElementById('startRecord').textContent = '1';
      document.getElementById('endRecord').textContent = Math.min(25, callRecords.length);
    });
  
    // Search functionality
    const searchInput = document.getElementById('searchRecords');
    const searchButton = document.getElementById('searchButton');
    
    function performSearch() {
      const searchTerm = searchInput.value.toLowerCase();
      
      if (searchTerm.trim() === '') {
        populateTable(callRecords);
        return;
      }
      
      const searchResults = callRecords.filter(record => {
        return (
          record.unique_id.toLowerCase().includes(searchTerm) ||
          record.speech_text.toLowerCase().includes(searchTerm) ||
          record.response_category.toLowerCase().includes(searchTerm)
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
        
        // Sort the records
        const sortedRecords = [...callRecords].sort((a, b) => {
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
        
        populateTable(sortedRecords);
      });
    });
  
    // Edit record functionality
    const editRecordModal = document.getElementById('editRecordModal');
    
    editRecordModal.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      const recordId = button.getAttribute('data-id');
      
      // Find the record by ID
      const record = callRecords.find(r => r.id === parseInt(recordId));
      
      if (record) {
        document.getElementById('editRecordId').value = record.id;
        document.getElementById('editUniqueId').value = record.unique_id;
        document.getElementById('editSpeechText').value = record.speech_text;
        document.getElementById('editResponseCategory').value = record.response_category;
        document.getElementById('editTimestamp').value = record.timestamp;
      }
    });
    
    document.getElementById('saveRecordChanges').addEventListener('click', function() {
      const recordId = parseInt(document.getElementById('editRecordId').value);
      const speechText = document.getElementById('editSpeechText').value;
      const responseCategory = document.getElementById('editResponseCategory').value;
      
      // Update the record in our "database"
      const recordIndex = callRecords.findIndex(r => r.id === recordId);
      
      if (recordIndex !== -1) {
        callRecords[recordIndex].speech_text = speechText;
        callRecords[recordIndex].response_category = responseCategory;
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(editRecordModal);
        modal.hide();
        
        // Refresh the table
        populateTable(callRecords);
        
        // Show success message
        const toast = `
          <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="toast-header bg-success text-white">
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
              <div class="toast-body">
                Record #${recordId} has been updated successfully.
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
  
    // Audio player modal functionality
    const audioPlayerModal = document.getElementById('audioPlayerModal');
    
    audioPlayerModal.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      const recordId = button.getAttribute('data-id');
      
      // Find the record by ID
      const record = callRecords.find(r => r.id === parseInt(recordId));
      
      if (record) {
        document.getElementById('recordingId').textContent = record.unique_id;
        document.getElementById('recordingTimestamp').textContent = record.timestamp;
        document.getElementById('recordingTranscript').textContent = record.speech_text;
        
        // In a real application, you would set the audio source here
        // For demo purposes, we'll just show a message that there's no audio
        const audioElement = audioPlayerModal.querySelector('audio');
        audioElement.innerHTML = `<p class="text-center text-muted">No audio available for this demo.</p>`;
      }
    });
  
    // Delete record functionality
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    
    deleteConfirmModal.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      const recordId = button.getAttribute('data-id');
      
      document.getElementById('deleteRecordId').textContent = recordId;
    });
    
    document.getElementById('confirmDelete').addEventListener('click', function() {
      const recordId = parseInt(document.getElementById('deleteRecordId').textContent);
      
      // Remove the record from our "database"
      const recordIndex = callRecords.findIndex(r => r.id === recordId);
      
      if (recordIndex !== -1) {
        callRecords.splice(recordIndex, 1);
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(deleteConfirmModal);
        modal.hide();
        
        // Refresh the table
        populateTable(callRecords);
        
        // Update pagination info
        document.getElementById('totalRecords').textContent = callRecords.length;
        document.getElementById('endRecord').textContent = Math.min(25, callRecords.length);
        
        // Show success message
        const toast = `
          <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="toast-header bg-danger text-white">
                <strong class="me-auto">Deleted</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
              <div class="toast-body">
                Record #${recordId} has been deleted successfully.
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
  
    // Add CSS for sort indicators - moved to reports.css
    /* This was redundant as it's already in reports.css
    document.head.insertAdjacentHTML('beforeend', `
      <style>
        .sortable {
          cursor: pointer;
          position: relative;
        }
        
        .sortable:hover {
          background-color: var(--accent);
        }
        
        .sortable::after {
          content: "⇵";
          opacity: 0.3;
          margin-left: 5px;
        }
        
        .sorted-asc::after {
          content: "↑";
          opacity: 1;
        }
        
        .sorted-desc::after {
          content: "↓";
          opacity: 1;
        }
      </style>
    `);
    */
  
    // Refresh button functionality
    document.getElementById('refreshBtn').addEventListener('click', function() {
      // In a real application, this would fetch fresh data from the server
      populateTable(callRecords);
      
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