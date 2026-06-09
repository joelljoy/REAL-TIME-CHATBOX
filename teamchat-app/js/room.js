if (document.getElementById('sidebar')) {
  const urlParams = new URLSearchParams(window.location.search);
  const roomName = decodeURIComponent(urlParams.get('room') || 'General');
  const userName = sessionStorage.getItem('userName');
  const userInitials = sessionStorage.getItem('userInitials');

  document.getElementById('roomTitle').textContent = roomName;
  document.getElementById('sidebarName').textContent = userName;
  document.getElementById('sidebarAvatar').textContent = userInitials;
  document.getElementById('sidebarAvatar').style.backgroundColor = 'var(--primary)';

  const groups = ["General", "Design Team", "Engineering", "Marketing", "Random"];
  const myGroups = document.getElementById('myGroups');
  
  // Create search results dropdown
  const searchContainer = document.querySelector('.search-box');
  const searchResults = document.createElement('div');
  searchResults.className = 'search-results';
  searchContainer.appendChild(searchResults);

  // Initialize search functionality
  const searchInput = document.querySelector('.search-box input');
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length === 0) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      renderGroups(groups);
      return;
    }
    
    const filteredGroups = groups.filter(group => 
      group.toLowerCase().includes(query)
    );
    
    // Show dropdown results
    searchResults.innerHTML = '';
    
    if (filteredGroups.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">No rooms found</div>';
    } else {
      filteredGroups.forEach(group => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.textContent = group;
        resultItem.addEventListener('click', function() {
          // Navigate to selected room
          window.location.href = `/teamchat-plus.html?room=${encodeURIComponent(group)}`;
        });
        searchResults.appendChild(resultItem);
      });
    }
    
    searchResults.classList.add('active');
    
    // Also filter the main groups list
    renderGroups(filteredGroups, query);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target)) {
      searchResults.classList.remove('active');
    }
  });

  function renderGroups(groupsList, query = '') {
    myGroups.innerHTML = '';
    groupsList.forEach(group => {
      const btn = document.createElement('button');
      btn.className = `room-item ${group === roomName ? 'active' : ''}`;
      
      // Highlight search matches
      if (query && group.toLowerCase().includes(query)) {
        const regex = new RegExp(`(${query})`, 'gi');
        btn.innerHTML = group.replace(regex, '<mark>$1</mark>');
      } else {
        btn.textContent = group;
      }
      
      btn.onclick = () => window.location.href = `/teamchat-plus.html?room=${encodeURIComponent(group)}`;
      myGroups.appendChild(btn);
    });

    // Show "no results" if empty
    if (groupsList.length === 0 && query) {
      const noResults = document.createElement('div');
      noResults.className = 'text-center py-2 text-sm text-muted';
      noResults.textContent = 'No rooms found';
      myGroups.appendChild(noResults);
    }
  }

  // Initial render
  renderGroups(groups);

  document.getElementById('closeSidebar').onclick = () => {
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('sidebarToggleBtn').classList.remove('hidden');
  };
  
  document.getElementById('sidebarToggleBtn').onclick = () => {
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('sidebarToggleBtn').classList.add('hidden');
  };

  document.getElementById('openParticipants').onclick = () => {
    document.getElementById('participantsModal').classList.add('active');
    document.getElementById('participantsList').innerHTML = `
      <div class="py-2 border-b">${userName} (You)</div>
      <div class="py-2 border-b">Sarah Chen</div>
      <div class="py-2">Mike Johnson</div>
    `;
  };
  
  document.getElementById('closeParticipants').onclick = () =>
    document.getElementById('participantsModal').classList.remove('active');

  document.getElementById('openSettings').onclick = () =>
    document.getElementById('settingsModal').classList.add('active');
  document.getElementById('closeSettings').onclick = () =>
    document.getElementById('settingsModal').classList.remove('active');

  document.getElementById('leaveRoom').onclick = () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  };

  document.getElementById('closeFiles').onclick = () => {
    document.getElementById('sharedFiles').classList.add('hidden');
  };
}