// WebSocket Chat Client
let ws = null;
window.ws = null; // Make ws globally accessible
let currentRoom = '';
let currentUsername = '';
let currentInitials = '';
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let lastMessageText = '';
let lastMessageTime = 0;

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get room and user info from URL and session
    const urlParams = new URLSearchParams(window.location.search);
    currentRoom = urlParams.get('room');
    currentUsername = sessionStorage.getItem('userName');
    currentInitials = sessionStorage.getItem('userInitials');

    console.log('Initializing chat:', { currentRoom, currentUsername, currentInitials });

    if (!currentRoom || !currentUsername) {
        console.error('Missing required info. Redirecting to home...');
        window.location.href = '/';
        return;
    }

    // Initialize UI
    initializeUI();
    
    // Connect to WebSocket
    connectWebSocket();
});

function initializeUI() {
    console.log('Initializing UI for room:', currentRoom);
    const roomTitle = document.querySelectorAll('.room-title');
    roomTitle.forEach(el => el.textContent = currentRoom);
    
    // Clear any existing content and show loading state
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><p>Connecting to room...</p></div>';
    }

    // Message input handlers
    const messageText = document.getElementById('messageText');
    const sendButton = document.getElementById('sendButton');
    
    if (messageText && sendButton) {
        sendButton.addEventListener('click', sendMessage);
        
        messageText.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    } else {
        console.error('Could not find message input elements');
    }

    // File upload
    const attachFileBtn = document.getElementById('attachFile');
    if (attachFileBtn) {
        attachFileBtn.addEventListener('click', openFileUpload);
    }

    // Search functionality
    setupSearch();
    
    // Sidebar toggles
    setupSidebarToggles();
    
    // File category tabs
    setupFileTabs();
    
    console.log('UI initialized successfully');
}

function connectWebSocket() {
    const wsUrl = `ws://localhost:8000/ws/${encodeURIComponent(currentRoom)}/${encodeURIComponent(currentUsername)}/${encodeURIComponent(currentInitials)}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    // Show connection status
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><p>Connecting...</p></div>';
    }
    
    try {
        ws = new WebSocket(wsUrl);
        window.ws = ws; // Make globally accessible
        
        ws.onopen = function() {
            console.log('✅ WebSocket connected successfully');
            reconnectAttempts = 0;
            showConnectionStatus('connected');
        };
        
        ws.onmessage = function(event) {
            console.log('📨 WebSocket message received');
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        ws.onerror = function(error) {
            console.error('❌ WebSocket error:', error);
            showConnectionStatus('error');
            if (chatMessages) {
                chatMessages.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><p>❌ Connection error. Make sure the server is running.</p></div>';
            }
        };
        
        ws.onclose = function(event) {
            console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
            showConnectionStatus('disconnected');
            
            if (chatMessages && !chatMessages.querySelector('.message')) {
                chatMessages.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><p>Connection lost. Reconnecting...</p></div>';
            }
            
            // Attempt to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                setTimeout(() => {
                    console.log(`🔄 Reconnecting... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
                    connectWebSocket();
                }, 2000 * reconnectAttempts);
            } else {
                console.error('❌ Max reconnection attempts reached');
                if (chatMessages) {
                    chatMessages.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><p>Failed to connect to server. Please refresh the page.</p></div>';
                }
            }
        };
    } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        showConnectionStatus('error');
        if (chatMessages) {
            chatMessages.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><p>Failed to connect. Please check your internet connection.</p></div>';
        }
    }
}

function handleWebSocketMessage(data) {
    console.log('Received message:', data);
    
    switch (data.type) {
        case 'room_history':
            loadRoomHistory(data);
            break;
        case 'message':
            addMessage(data);
            break;
        case 'user_joined':
            handleUserJoined(data);
            break;
        case 'user_left':
            handleUserLeft(data);
            break;
        case 'file_shared':
            handleFileShared(data);
            break;
        case 'message_pinned':
            handleMessagePinned(data);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

function loadRoomHistory(data) {
    console.log('Loading room history:', data);
    
    // Load messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        
        if (data.messages && data.messages.length > 0) {
            console.log(`Loading ${data.messages.length} existing messages`);
            data.messages.forEach((msg, index) => {
                // Mark messages as own if they're from current user
                msg.isOwn = (msg.author === currentUsername);
                addMessage(msg, index === data.messages.length - 1); // Only scroll on last message
            });
        } else {
            console.log('No existing messages, showing empty state');
            chatMessages.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
        }
    }
    
    // Load files
    if (data.files) {
        window.roomFiles = data.files;
        updateFilesList();
    }
    
    // Store room members for participants modal
    if (data.members) {
        window.roomMembers = data.members;
        // Add current user if not already in the list
        if (!window.roomMembers.find(m => m.username === currentUsername)) {
            window.roomMembers.push({
                username: currentUsername,
                initials: currentInitials || currentUsername.charAt(0).toUpperCase()
            });
        }
        console.log('Stored room members:', window.roomMembers);
    } else {
        window.roomMembers = [{
            username: currentUsername,
            initials: currentInitials || currentUsername.charAt(0).toUpperCase()
        }];
    }
    
    // Update member count
    updateMemberCount(data.members_count);
    
    console.log('Room history loaded:', data.messages?.length || 0, 'messages,', data.members_count, 'members');
}

function addMessage(message, scroll = true) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) {
        console.error('chatMessages element not found');
        return;
    }
    
    // Check if this is a duplicate of our optimistic message
    if (!message._optimistic && message.author === currentUsername && 
        message.content === lastMessageText && 
        Date.now() - lastMessageTime < 3000) {
        console.log('Ignoring duplicate message from server');
        return;
    }
    
    console.log('Adding message:', message);
    
    // Remove empty state if exists
    const emptyState = chatMessages.querySelector('div[style*="text-align: center"]');
    if (emptyState) {
        emptyState.remove();
    }
    
    const messageDiv = document.createElement('div');
    const isOwn = message.isOwn !== undefined ? message.isOwn : (message.author === currentUsername);
    messageDiv.className = `message ${isOwn ? 'you' : ''}`;
    
    // Check if message has a file attached
    let contentHtml = escapeHtml(message.content);
    
    if (message.file_url || message.file_type) {
        // This is a file message, render accordingly
        if (message.file_type === 'audio' || (message.file_url && message.file_url.endsWith('.webm'))) {
            // Render audio player
            contentHtml = `
                <div>🎤 Voice Message</div>
                <audio controls style="margin-top: 10px; max-width: 100%; border-radius: 20px;">
                    <source src="http://localhost:8000${message.file_url}" type="audio/webm">
                    Your browser does not support the audio element.
                </audio>
            `;
        } else if (message.file_url) {
            // Other file types
            contentHtml += `<br><a href="http://localhost:8000${message.file_url}" target="_blank" style="color: inherit; text-decoration: underline;">📎 View File</a>`;
        }
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-sender">${escapeHtml(message.author)}</div>
            <div class="message-time">${message.timestamp}</div>
        </div>
        <div class="message-content">${contentHtml}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    if (scroll) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function sendMessage() {
    const messageText = document.getElementById('messageText');
    if (!messageText) return;
    
    const text = messageText.value.trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) {
        console.error('Cannot send message:', { text: !!text, ws: !!ws, readyState: ws ? ws.readyState : 'N/A' });
        return;
    }
    
    console.log('Sending message:', text);
    
    // Track this message to avoid duplicates
    lastMessageText = text;
    lastMessageTime = Date.now();
    
    // Add message optimistically
    const tempMessage = {
        author: currentUsername,
        authorInitials: currentInitials,
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        _optimistic: true  // Mark as optimistic
    };
    
    addMessage(tempMessage);
    
    // Send to server
    ws.send(JSON.stringify({
        type: 'message',
        content: text
    }));
    
    messageText.value = '';
}

function handleUserJoined(data) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        const systemMsg = document.createElement('div');
        systemMsg.style.cssText = 'text-align: center; padding: 10px; color: #7f8c8d; font-size: 14px;';
        systemMsg.textContent = `${data.username} joined the room`;
        chatMessages.appendChild(systemMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Add to room members if not already present
    if (window.roomMembers && !window.roomMembers.find(m => m.username === data.username)) {
        window.roomMembers.push({
            username: data.username,
            initials: data.initials || data.username.charAt(0).toUpperCase()
        });
    }
    
    updateMemberCount(data.members_count);
}

function handleUserLeft(data) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        const systemMsg = document.createElement('div');
        systemMsg.style.cssText = 'text-align: center; padding: 10px; color: #7f8c8d; font-size: 14px;';
        systemMsg.textContent = `${data.username} left the room`;
        chatMessages.appendChild(systemMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove from room members
    if (window.roomMembers) {
        window.roomMembers = window.roomMembers.filter(m => m.username !== data.username);
    }
    
    updateMemberCount(data.members_count);
}

function handleFileShared(data) {
    // Create message object with file info
    const fileMessage = {
        author: data.uploader,
        timestamp: data.file.timestamp,
        content: data.file.name.endsWith('.webm') ? '[Voice Message]' : `📎 Shared file: ${data.file.name}`,
        file_url: data.file.url,
        file_type: data.file.name.endsWith('.webm') ? 'audio' : data.file.type,
        isOwn: data.uploader === currentUsername
    };
    
    // Use addMessage to handle rendering with audio player support
    addMessage(fileMessage);
    
    // Add file to list
    if (!window.roomFiles) {
        window.roomFiles = [];
    }
    window.roomFiles.push(data.file);
    updateFilesList();
}

function handleMessagePinned(data) {
    console.log('Message pinned:', data);
    // Implement pinned messages UI if needed
}

function updateMemberCount(count) {
    const memberElements = document.querySelectorAll('.room-members');
    console.log('Updating member count to:', count);
    memberElements.forEach(el => {
        el.textContent = `${count} ${count === 1 ? 'member' : 'members'}`;
    });
}

function showConnectionStatus(status) {
    // You can implement a connection status indicator here
    console.log('Connection status:', status);
}

// File upload functionality
function openFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = handleFileSelect;
    input.click();
}

async function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (let file of files) {
        await uploadFile(file);
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`http://localhost:8000/upload/${encodeURIComponent(currentRoom)}/${encodeURIComponent(currentUsername)}`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('File uploaded successfully:', result.file);
        } else {
            console.error('File upload failed:', result.error);
            alert('Failed to upload file: ' + result.error);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload file. Please try again.');
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    
    if (!searchInput || !searchDropdown) return;
    
    // Load rooms from server
    loadAvailableRooms();
    
    searchInput.addEventListener('focus', function() {
        searchDropdown.classList.add('active');
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            searchDropdown.classList.remove('active');
        }, 200);
    });
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const items = searchDropdown.querySelectorAll('.dropdown-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'block' : 'none';
        });
    });
}

async function loadAvailableRooms() {
    try {
        const response = await fetch('http://localhost:8000/api/rooms');
        const data = await response.json();
        
        const searchDropdown = document.getElementById('searchDropdown');
        const navItems = document.querySelector('.section');
        
        if (data.rooms && data.rooms.length > 0) {
            // Update dropdown
            if (searchDropdown) {
                searchDropdown.innerHTML = '';
                data.rooms.forEach(room => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.textContent = room.name;
                    item.addEventListener('click', function() {
                        window.location.href = `/teamchat-plus.html?room=${encodeURIComponent(room.name)}`;
                    });
                    searchDropdown.appendChild(item);
                });
            }
            
            // Update sidebar groups
            updateSidebarGroups(data.rooms);
        }
    } catch (error) {
        console.error('Failed to load rooms:', error);
    }
}

function updateSidebarGroups(rooms) {
    const section = document.querySelector('.section');
    if (!section) return;
    
    const navItemsContainer = section.querySelectorAll('.nav-item');
    
    // Clear existing non-active items
    navItemsContainer.forEach(item => {
        if (!item.classList.contains('active')) {
            item.remove();
        }
    });
    
    // Add new rooms
    rooms.forEach(room => {
        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        if (room.name === currentRoom) {
            navItem.classList.add('active');
        }
        navItem.textContent = room.name;
        navItem.addEventListener('click', function() {
            window.location.href = `/teamchat-plus.html?room=${encodeURIComponent(room.name)}`;
        });
        section.appendChild(navItem);
    });
}

// Sidebar toggles
function setupSidebarToggles() {
    const toggleFilesBtn = document.getElementById('toggleFilesBtn');
    const closeFilesBtn = document.getElementById('closeFilesBtn');
    const filesSidebar = document.getElementById('filesSidebar');
    
    if (toggleFilesBtn && filesSidebar) {
        toggleFilesBtn.addEventListener('click', function() {
            filesSidebar.classList.toggle('collapsed');
            this.textContent = filesSidebar.classList.contains('collapsed') ? '📁 Shared Files' : '📁 Hide Files';
        });
    }
    
    if (closeFilesBtn && filesSidebar) {
        closeFilesBtn.addEventListener('click', function() {
            filesSidebar.classList.add('collapsed');
            if (toggleFilesBtn) {
                toggleFilesBtn.textContent = '📁 Shared Files';
            }
        });
    }
    
    // Menu items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const text = item.textContent.trim();
        
        if (text === 'Home') {
            item.addEventListener('click', function() {
                window.location.href = '/';
            });
        } else if (text === 'Participants') {
            item.addEventListener('click', showParticipants);
        } else if (text === 'Leave') {
            item.addEventListener('click', showLeaveModal);
        }
    });
}

// Leave Room Modal
function showLeaveModal() {
    const modal = document.createElement('div');
    modal.id = 'leaveModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.95));
            backdrop-filter: blur(20px);
            padding: 40px;
            border-radius: 20px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.5);
            animation: slideIn 0.3s ease;
        ">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    box-shadow: 0 10px 30px rgba(231, 76, 60, 0.3);
                ">⚠️</div>
                <h2 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 24px;">Leave Room?</h2>
                <p style="margin: 0; color: #7f8c8d; font-size: 15px;">Are you sure you want to leave <strong>${currentRoom}</strong>? You can rejoin anytime.</p>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button id="cancelLeaveBtn" style="
                    flex: 1;
                    background: rgba(149, 165, 166, 0.2);
                    color: #7f8c8d;
                    border: 1px solid rgba(149, 165, 166, 0.3);
                    padding: 14px 20px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 15px;
                    transition: all 0.3s ease;
                ">Stay</button>
                <button id="confirmLeaveBtn" style="
                    flex: 1;
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: white;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 15px;
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                    transition: all 0.3s ease;
                ">Leave Room</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        #cancelLeaveBtn:hover {
            background: rgba(149, 165, 166, 0.3);
            border-color: #95a5a6;
            transform: translateY(-2px);
        }
        #confirmLeaveBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(231, 76, 60, 0.5);
        }
    `;
    document.head.appendChild(style);
    
    // Cancel button
    document.getElementById('cancelLeaveBtn').addEventListener('click', function() {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }, 200);
    });
    
    // Confirm Leave button
    document.getElementById('confirmLeaveBtn').addEventListener('click', function() {
        if (ws) {
            ws.close();
        }
        sessionStorage.clear();
        window.location.href = '/';
    });
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                document.body.removeChild(modal);
                document.head.removeChild(style);
            }, 200);
        }
    });
}

// Participants Modal
function showParticipants() {
    const modal = document.createElement('div');
    modal.id = 'participantsModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    // Get participants from the room
    const participantsHtml = window.roomMembers ? window.roomMembers.map(member => `
        <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${getAvatarColor(member.initials)};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                margin-right: 15px;
            ">${member.initials}</div>
            <div style="flex: 1;">
                <div style="font-weight: bold; margin-bottom: 3px;">${escapeHtml(member.username)}</div>
                <div style="font-size: 12px; color: #7f8c8d;">
                    <span style="display: inline-block; width: 8px; height: 8px; background: #2ecc71; border-radius: 50%; margin-right: 5px;"></span>
                    Online
                </div>
            </div>
        </div>
    `).join('') : `
        <div style="text-align: center; padding: 40px; color: #7f8c8d;">
            Loading participants...
        </div>
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h2 style="margin: 0 0 20px 0;">Participants</h2>
            <div style="margin-bottom: 20px; color: #7f8c8d; font-size: 14px;">
                ${window.roomMembers ? window.roomMembers.length : 0} member(s) in this room
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${participantsHtml}
            </div>
            
            <div style="margin-top: 20px;">
                <button id="closeParticipantsBtn" style="
                    width: 100%;
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    document.getElementById('closeParticipantsBtn').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function getAvatarColor(initials) {
    const colors = [
        'hsl(170, 60%, 45%)',
        'hsl(250, 50%, 65%)',
        'hsl(10, 80%, 55%)',
        'hsl(40, 90%, 50%)',
        'hsl(280, 60%, 60%)',
        'hsl(140, 70%, 50%)'
    ];
    return colors[initials.charCodeAt(0) % colors.length];
}

// File tabs
function setupFileTabs() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            updateFilesList(category);
        });
    });
}

function updateFilesList(category = 'all') {
    const filesList = document.getElementById('filesList');
    if (!filesList || !window.roomFiles) return;
    
    const filteredFiles = category === 'all' 
        ? window.roomFiles 
        : window.roomFiles.filter(f => f.type === category);
    
    if (filteredFiles.length === 0) {
        filesList.innerHTML = '<div style="padding: 20px; text-align: center; color: #7f8c8d;">No files yet</div>';
        return;
    }
    
    filesList.innerHTML = '';
    
    filteredFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const iconClass = getFileIconClass(file.type);
        const iconText = getFileIconText(file.type);
        
        fileItem.innerHTML = `
            <div class="file-item-content">
                <div class="file-icon ${iconClass}">${iconText}</div>
                <div class="file-details">
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-meta">
                        <span>${escapeHtml(file.uploader)}</span>
                        <span>${file.timestamp}</span>
                    </div>
                </div>
            </div>
        `;
        
        fileItem.addEventListener('click', function() {
            window.open(`http://localhost:8000${file.url}`, '_blank');
        });
        
        filesList.appendChild(fileItem);
    });
}

function getFileIconClass(type) {
    const classes = {
        'documents': 'pdf',
        'photos': 'image',
        'audio': 'audio',
        'videos': 'image',
        'archives': 'pdf'
    };
    return classes[type] || 'pdf';
}

function getFileIconText(type) {
    const texts = {
        'documents': 'DOC',
        'photos': 'IMG',
        'audio': 'AUD',
        'videos': 'VID',
        'archives': 'ZIP'
    };
    return texts[type] || 'FILE';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize empty files array and members array
window.roomFiles = [];
window.roomMembers = [];

