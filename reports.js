document.addEventListener('DOMContentLoaded', function() {
  // Initialize date picker
  flatpickr("#dateRange", {
    mode: "range",
    dateFormat: "Y-m-d",
    defaultDate: [new Date().setDate(new Date().getDate() - 7), new Date()],
    maxDate: "today"
  });

  // API data fetching function
  async function fetchDataFromAPI() {
    try {
      const response = await fetch('https://dialerai.originnet.com.pk/xlite_dashboard/fetch_table.php');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data from API:', error);
      // Show error toast
      showToast('Error fetching data', 'Unable to fetch data from the server. Please try again later.', 'danger');
      return [];
    }
  }

  // Initialize with API data
  let callRecords = [];
  
  // Function to process API data and update the dashboard
  async function initializeDashboard() {
    // Show loading state
    document.getElementById('refreshBtn').innerHTML = '<i class="bi bi-arrow-repeat me-1 animate-spin"></i> Loading...';
    
    // Fetch data from API
    const apiData = await fetchDataFromAPI();
    
    if (apiData && apiData.length > 0) {
      callRecords = apiData;
      
      // Process data for visualization
      processResponseData();
      
      // Populate the table
      populateTable(callRecords);
      
      // Update summary counts
      document.getElementById('totalRecords').textContent = callRecords.length;
      document.getElementById('startRecord').textContent = callRecords.length > 0 ? '1' : '0';
      document.getElementById('endRecord').textContent = Math.min(25, callRecords.length);
      
      // Update timestamp
      const now = new Date();
      const formattedDate = formatDate(now);
      document.getElementById('lastUpdated').textContent = formattedDate;
      
      // Show success toast
      showToast('Data Loaded', `Successfully loaded ${callRecords.length} records`, 'success');
    }
    
    // Reset loading state
    document.getElementById('refreshBtn').innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Refresh';
  }
  
  // Process the response data for charts and statistics
  function processResponseData() {
    // Count occurrences of each response category
    const categoryCounts = {};
    callRecords.forEach(record => {
      const category = record.response_category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Define response data with colors
    const responseData = [
      { category: 'ANSWER_MACHINE', count: categoryCounts['ANSWER_MACHINE'] || 0, color: '#6c757d' },
      { category: 'INTERESTED', count: categoryCounts['INTERESTED'] || 0, color: '#28a745' },
      { category: 'NOT_INTERESTED', count: categoryCounts['NOT_INTERESTED'] || 0, color: '#dc3545' },
      { category: 'DO_NOT_CALL', count: categoryCounts['DO_NOT_CALL'] || 0, color: '#9d0208' },
      { category: 'DNQ', count: categoryCounts['DNQ'] || 0, color: '#ffc107' },
      { category: 'UNKNOWN', count: categoryCounts['UNKNOWN'] || 0, color: '#343a40' }
    ];
    
    // Calculate total for percentages
    const totalCalls = responseData.reduce((sum, item) => sum + item.count, 0);
    
    // Update summary stats
    document.querySelector('.stat-card-blue .stat-value').textContent = totalCalls;
    document.querySelector('.stat-card-green .stat-value').textContent = categoryCounts['INTERESTED'] || 0;
    document.querySelector('.stat-card-amber .stat-value').textContent = categoryCounts['ANSWER_MACHINE'] || 0;
    document.querySelector('.stat-card-purple .stat-value').textContent = categoryCounts['DO_NOT_CALL'] || 0;
    
    // Update percentages
    const interestedPercentage = totalCalls > 0 ? ((categoryCounts['INTERESTED'] || 0) / totalCalls * 100).toFixed(1) : '0.0';
    const answerMachinePercentage = totalCalls > 0 ? ((categoryCounts['ANSWER_MACHINE'] || 0) / totalCalls * 100).toFixed(1) : '0.0';
    const doNotCallPercentage = totalCalls > 0 ? ((categoryCounts['DO_NOT_CALL'] || 0) / totalCalls * 100).toFixed(1) : '0.0';
    
    document.querySelector('.stat-card-green + p').textContent = `${interestedPercentage}% of total calls`;
    document.querySelector('.stat-card-amber + p').textContent = `${answerMachinePercentage}% of total calls`;
    document.querySelector('.stat-card-purple + p').textContent = `${doNotCallPercentage}% of total calls`;
    
    // Update response categories list
    const categoryListItems = document.querySelectorAll('.list-group-item');
    responseData.forEach((item, index) => {
      if (categoryListItems[index]) {
        const badge = categoryListItems[index].querySelector('.badge');
        if (badge) {
          badge.textContent = item.count;
        }
      }
    });
    
    // Initialize or update charts
    updateCharts(responseData, totalCalls);
  }
  
  // Chart variables for global access
  let responseChart;
  const responseCtx = document.getElementById('responseDistributionChart').getContext('2d');
  
  // Function to update charts with new data
  function updateCharts(responseData, totalCalls) {
    // Add chart toggle functionality
    const barChartBtn = document.getElementById('barChartBtn');
    const pieChartBtn = document.getElementById('pieChartBtn');
    
    // Function to create bar chart
    function createBarChart() {
      // Destroy existing chart if it exists
      if (responseChart) {
        responseChart.destroy();
      }
      
      // Create labels with percentages
      const labels = responseData.map(item => {
        const percentage = totalCalls > 0 ? ((item.count / totalCalls) * 100).toFixed(1) : '0.0';
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
          maintainAspectRatio: false,
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
                  const percentage = totalCalls > 0 ? ((value / totalCalls) * 100).toFixed(1) : '0.0';
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
                      const percentage = totalCalls > 0 ? ((value / totalCalls) * 100).toFixed(1) : '0.0';
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
                  const percentage = totalCalls > 0 ? ((value / totalCalls) * 100).toFixed(1) : '0.0';
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
  }
  
  // Populate the table with data
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

  // Initialize the dashboard with API data
  initializeDashboard();

  // Filter functionality
  const applyFiltersBtn = document.getElementById('applyFilters');
  const resetFiltersBtn = document.getElementById('resetFilters');
  
  applyFiltersBtn.addEventListener('click', function() {
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
    showToast('Filters Applied', `Showing ${filteredRecords.length} records matching your criteria.`, 'info');
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
    const record = callRecords.find(r => r.id === recordId);
    
    if (record) {
      document.getElementById('editRecordId').value = record.id;
      document.getElementById('editUniqueId').value = record.unique_id;
      document.getElementById('editSpeechText').value = record.speech_text;
      document.getElementById('editResponseCategory').value = record.response_category;
      document.getElementById('editTimestamp').value = record.timestamp;
    }
  });
  
  document.getElementById('saveRecordChanges').addEventListener('click', function() {
    const recordId = document.getElementById('editRecordId').value;
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
      
      // Update charts and stats since category might have changed
      processResponseData();
      
      // Show success message
      showToast('Success', `Record #${recordId} has been updated successfully.`, 'success');
    }
  });

  // Audio player modal functionality
  const audioPlayerModal = document.getElementById('audioPlayerModal');
  
  audioPlayerModal.addEventListener('show.bs.modal', function(event) {
    const button = event.relatedTarget;
    const recordId = button.getAttribute('data-id');
    
    // Find the record by ID
    const record = callRecords.find(r => r.id === recordId);
    
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
    const recordId = document.getElementById('deleteRecordId').textContent;
    
    // Remove the record from our "database"
    const recordIndex = callRecords.findIndex(r => r.id === recordId);
    
    if (recordIndex !== -1) {
      callRecords.splice(recordIndex, 1);
      
      // Close the modal
      const modal = bootstrap.Modal.getInstance(deleteConfirmModal);
      modal.hide();
      
      // Refresh the table
      populateTable(callRecords);
      
      // Update charts and stats
      processResponseData();
      
      // Update pagination info
      document.getElementById('totalRecords').textContent = callRecords.length;
      document.getElementById('endRecord').textContent = Math.min(25, callRecords.length);
      
      // Show success message
      showToast('Deleted', `Record #${recordId} has been deleted successfully.`, 'danger');
    }
  });

  // Refresh button functionality
  document.getElementById('refreshBtn').addEventListener('click', function() {
    // Fetch fresh data from the API
    initializeDashboard();
    
    // Add animation to show refresh action
    this.querySelector('i').classList.add('animate-spin');
    setTimeout(() => {
      this.querySelector('i').classList.remove('animate-spin');
    }, 500);
  });

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