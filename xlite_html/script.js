document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileToggle = document.querySelector('.sidebar-toggle');
    const themeToggle = document.getElementById('themeToggle');
    const refreshBtn = document.getElementById('refreshBtn');
    const lastUpdated = document.getElementById('lastUpdated');
    const selectToggle = document.getElementById('selectToggle');
    const selectMenu = document.getElementById('selectMenu');
    const selectOptions = document.querySelectorAll('.select-option');
    const selectValue = document.querySelector('.select-value');
    
    // Sidebar toggle functionality
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('expanded');
      
      // Update icon
      if (sidebar.classList.contains('collapsed')) {
        sidebarToggle.innerHTML = '<i class="bi bi-list"></i>';
      } else {
        sidebarToggle.innerHTML = '<i class="bi bi-x"></i>';
      }
    });
    
    // Mobile sidebar toggle
    if (mobileToggle) {
      mobileToggle.addEventListener('click', function() {
        sidebar.classList.toggle('expanded');
      });
    }
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark');
      
      // Update icon
      if (document.body.classList.contains('dark')) {
        themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
      } else {
        themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
      }
      
      // Save preference to localStorage
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
    
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
    }
    
    // Refresh button functionality
    refreshBtn.addEventListener('click', function() {
      const now = new Date();
      const formattedDate = formatDate(now);
      lastUpdated.textContent = formattedDate;
      
      // Add animation to show refresh action
      refreshBtn.classList.add('animate-spin');
      setTimeout(() => {
        refreshBtn.classList.remove('animate-spin');
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
    
    // Custom select dropdown functionality
    selectToggle.addEventListener('click', function() {
      selectMenu.classList.toggle('show');
    });
    
    // Close the dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (!selectToggle.contains(event.target) && !selectMenu.contains(event.target)) {
        selectMenu.classList.remove('show');
      }
    });
    
    // Select options
    selectOptions.forEach(option => {
      option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        const text = this.textContent;
        
        selectValue.textContent = text;
        selectMenu.classList.remove('show');
        
        // You can trigger an action based on the selected value
        console.log(`Selected: ${value}`);
      });
    });
    
    // Add animation class for spin effect
    document.head.insertAdjacentHTML('beforeend', `
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 0.5s linear;
        }
      </style>
    `);
    
    // Responsive handling
    function handleResize() {
      if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        mobileToggle.style.display = 'block';
      } else {
        mobileToggle.style.display = 'none';
      }
    }
    
    // Initial check and event listener for window resize
    handleResize();
    window.addEventListener('resize', handleResize);
  });