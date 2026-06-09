// Add all the chat functionality JavaScript here
document.addEventListener('DOMContentLoaded', function() {
    // All the chat JavaScript code from my previous response
});

// Utility Functions
function getFromStorage(key) {
    return localStorage.getItem(key);
}

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getRoomNameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room') || getFromStorage('roomName') || 'General';
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFileDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    
    if (imageExts.includes(ext)) return 'photo';
    if (audioExts.includes(ext)) return 'audio';
    if (docExts.includes(ext)) return 'document';
    return 'other';
}

function getFileIconColor(type) {
    const colors = {
        document: '#3b82f6',
        photo: '#10b981',
        audio: '#8b5cf6',
        other: '#6b7280'
    };
    return colors[type] || colors.other;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function navigateToRoom(url, roomName) {
    if (roomName !== getRoomNameFromURL()) {
        localStorage.setItem('roomName', roomName);
        window.location.href = `${url}?room=${encodeURIComponent(roomName)}`;
    }
}

// Chat Room Page Logic

// Dummy data
const DUMMY_ROOMS = ['General', 'Design Team', 'Engineering', 'Marketing', 'Random'];

const DUMMY_MESSAGES = [
    {
        id: 1,
        author: 'Sarah Chen',
        authorInitials: 'SC',
        content: "Hey everyone, we're excited to share our new project! 🎉",
        timestamp: '10:30 AM',
        isOwn: false
    },
    {
        id: 2,
        author: 'You',
        authorInitials: 'YO',
        content: 'That sounds great! When can we see the details?',
        timestamp: '10:35 AM',
        isOwn: true
    }
];

const DUMMY_FILES = [
    {
        id: 1,
        name: 'Project Proposal.pdf',
        uploader: 'Sarah Chen',
        timestamp: 'Nov 15, 10:30 AM',
        type: 'document'
    },
    {
        id: 2,
        name: 'Design System.figma',
        uploader: 'Mike Johnson',
        timestamp: 'Nov 14, 2:45 PM',
        type: 'document'
    },
    {
        id: 3,
        name: 'Team Photo.jpg',
        uploader: 'You',
        timestamp: 'Nov 13, 9:15 AM',
        type: 'photo'
    },
    {
        id: 4,
        name: 'Meeting Recording.mp3',
        uploader: 'Robert Davis',
        timestamp: 'Nov 12, 3:20 PM',
        type: 'audio'
    }
];

const DUMMY_PARTICIPANTS = [
    { name: 'Sarah Chen', initials: 'SC', status: 'online', joinTime: 'Joined 3 hours ago' },
    { name: 'Mike Johnson', initials: 'MJ', status: 'online', joinTime: 'Joined 1 hour ago' },
    { name: 'Robert Davis', initials: 'RD', status: 'offline', joinTime: 'Joined 5 hours ago' }
];

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userName = getFromStorage('userName');
    const userInitials = getFromStorage('userInitials');
    
    if (!userName) {
        window.location.href = 'index.html';
        return;
    }

    // Get room name from URL
    const roomName = getRoomNameFromURL();
    if (!roomName) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize app
    initializeApp(userName, userInitials, roomName);
});

function initializeApp(userName, userInitials, roomName) {
    // State
    let messages = [...DUMMY_MESSAGES];
    let pinnedMessages = [];
    let files = [...DUMMY_FILES];
    let currentFileTab = 'document';
    let recognition = null;
    let isRecording = false;

    // DOM Elements
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
    const toggleFilesBtn = document.getElementById('toggleFilesBtn');
    const closeFilesBtn = document.getElementById('closeFilesBtn');
    
    const roomTitle = document.getElementById('roomTitle');
    const roomMembers = document.getElementById('roomMembers');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    
    const messagesArea = document.getElementById('messagesArea');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachFileBtn = document.getElementById('attachFileBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiPicker = document.getElementById('emojiPicker');
    
    const roomsList = document.getElementById('roomsList');
    const sidebarSearchInput = document.getElementById('sidebarSearchInput');
    
    const homeBtn = document.getElementById('homeBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const participantsBtn = document.getElementById('participantsBtn');
    const leaveBtn = document.getElementById('leaveBtn');

    // Pinned messages
    const pinnedSection = document.getElementById('pinnedSection');
    const togglePinnedBtn = document.getElementById('togglePinnedBtn');
    const pinnedMessagesContainer = document.getElementById('pinnedMessages');

    // Modals
    const fileUploadModal = document.getElementById('fileUploadModal');
    const settingsModal = document.getElementById('settingsModal');
    const participantsModal = document.getElementById('participantsModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');

    // Initialize
    setupPage();
    renderMessages();
    renderSidebarRooms(DUMMY_ROOMS);
    renderFiles(currentFileTab);
    setupEmojis();
    setupVoiceRecognition();

    // Setup page
    function setupPage() {
        roomTitle.textContent = roomName;
        roomMembers.textContent = '12 members';
        sidebarUserName.textContent = userName;
        sidebarAvatar.textContent = userInitials;
        sidebarAvatar.style.backgroundColor = getAvatarColor(userInitials);
        
        messageInput.focus();
        
        // Update own messages initials
        messages.forEach(msg => {
            if (msg.isOwn) {
                msg.author = userName;
                msg.authorInitials = userInitials;
            }
        });
    }

    // Sidebar toggle
    collapseSidebarBtn.addEventListener('click', function() {
        leftSidebar.classList.add('collapsed');
        toggleSidebarBtn.style.display = 'block';
    });

    toggleSidebarBtn.addEventListener('click', function() {
        leftSidebar.classList.remove('collapsed');
        toggleSidebarBtn.style.display = 'none';
    });

    // Files sidebar toggle
    toggleFilesBtn.addEventListener('click', function() {
        rightSidebar.classList.toggle('hidden');
    });

    closeFilesBtn.addEventListener('click', function() {
        rightSidebar.classList.add('hidden');
    });

    // Render sidebar rooms
    function renderSidebarRooms(rooms) {
        roomsList.innerHTML = '';
        rooms.forEach(room => {
            const btn = document.createElement('button');
            btn.className = 'room-item';
            if (room === roomName) {
                btn.classList.add('active');
            }
            btn.textContent = room;
            btn.addEventListener('click', function() {
                navigateToRoom('room.html', room);
            });
            roomsList.appendChild(btn);
        });
    }

    // Search rooms in sidebar
    sidebarSearchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const filtered = DUMMY_ROOMS.filter(room => 
            room.toLowerCase().includes(query)
        );
        renderSidebarRooms(filtered);
    });

    // Message input
    messageInput.addEventListener('input', function() {
        sendBtn.disabled = !this.value.trim();
    });

    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Send message
    function sendMessage() {
        const content = messageInput.value.trim();
        if (!content) return;

        const newMessage = {
            id: generateId(),
            author: userName,
            authorInitials: userInitials,
            content: content,
            timestamp: formatTime(new Date()),
            isOwn: true
        };

        messages.push(newMessage);
        
        // Save to storage
        const storageKey = `messages_${roomName}`;
        saveToStorage(storageKey, messages);
        
        renderMessages();
        messageInput.value = '';
        sendBtn.disabled = true;
        messageInput.focus();
    }

    // Render messages
    function renderMessages() {
        if (messages.length === 0) {
            messagesArea.innerHTML = `
                <div class="empty-chat">
                    <div class="empty-icon">👋</div>
                    <p>Say hi to start the conversation!</p>
                </div>
            `;
            return;
        }

        messagesArea.innerHTML = '';
        messages.forEach(msg => {
            const msgElement = createMessageElement(msg);
            messagesArea.appendChild(msgElement);
        });

        scrollToBottom();
    }

    // Create message element
    function createMessageElement(message) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${message.isOwn ? 'own' : ''}`;

        const avatar = document.createElement('div');
        avatar.className = 'avatar-initials';
        avatar.textContent = message.authorInitials;
        avatar.style.backgroundColor = getAvatarColor(message.authorInitials);

        const content = document.createElement('div');
        content.className = 'message-content';

        const header = document.createElement('div');
        header.className = 'message-header';
        header.innerHTML = `
            <span class="message-author">${escapeHtml(message.author)}</span>
            <span class="message-timestamp">${message.timestamp}</span>
        `;

        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${message.isOwn ? 'own' : 'other'}`;
        bubble.innerHTML = `<p class="message-text">${escapeHtml(message.content)}</p>`;

        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.innerHTML = `
            <button class="btn-icon-small" title="Copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
            <button class="btn-icon-small pin-btn" title="Pin message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="17" x2="12" y2="22"></line>
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                </svg>
            </button>
        `;

        // Pin message handler
        const pinBtn = actions.querySelector('.pin-btn');
        pinBtn.addEventListener('click', () => pinMessage(message));

        content.appendChild(header);
        content.appendChild(bubble);
        content.appendChild(actions);

        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        return wrapper;
    }

    // Pin message
    function pinMessage(message) {
        if (!pinnedMessages.find(m => m.id === message.id)) {
            pinnedMessages.push(message);
            renderPinnedMessages();
        }
    }

    // Render pinned messages
    function renderPinnedMessages() {
        if (pinnedMessages.length === 0) {
            pinnedSection.style.display = 'none';
            return;
        }

        pinnedSection.style.display = 'block';
        pinnedMessagesContainer.innerHTML = '';

        pinnedMessages.forEach(msg => {
            const pinnedMsg = document.createElement('div');
            pinnedMsg.className = 'pinned-message';
            pinnedMsg.innerHTML = `
                <div class="pinned-message-header">
                    <span class="pinned-message-author">${escapeHtml(msg.author)}</span>
                    <button class="btn-icon-small unpin-btn" title="Unpin">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <p class="pinned-message-content">${escapeHtml(msg.content)}</p>
            `;

            const unpinBtn = pinnedMsg.querySelector('.unpin-btn');
            unpinBtn.addEventListener('click', () => {
                pinnedMessages = pinnedMessages.filter(m => m.id !== msg.id);
                renderPinnedMessages();
            });

            pinnedMessagesContainer.appendChild(pinnedMsg);
        });
    }

    // Toggle pinned section
    togglePinnedBtn.addEventListener('click', function() {
        pinnedMessagesContainer.style.display = 
            pinnedMessagesContainer.style.display === 'none' ? 'block' : 'none';
    });

    // Scroll to bottom
    function scrollToBottom() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Setup emojis
    function setupEmojis() {
        const emojis = [
            '😀','😂','😍','😎','🤔','😊','😢','😡',
            '👍','👎','👏','🙌','🤝','✌️','👋','💪',
            '🎉','❤️','💯','🔥','⭐','✅','❌','💡'
        ];

        emojiPicker.innerHTML = '';
        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.textContent = emoji;
            btn.addEventListener('click', () => {
                messageInput.value += emoji;
                emojiPicker.style.display = 'none';
                messageInput.focus();
                sendBtn.disabled = !messageInput.value.trim();
            });
            emojiPicker.appendChild(btn);
        });
    }

    // Toggle emoji picker
    emojiBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        emojiPicker.style.display = 
            emojiPicker.style.display === 'none' ? 'grid' : 'none';
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', function() {
        emojiPicker.style.display = 'none';
    });

    emojiPicker.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Voice recognition
    function setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                messageInput.value += transcript;
                sendBtn.disabled = !messageInput.value.trim();
                isRecording = false;
                voiceBtn.style.color = '';
            };

            recognition.onerror = function() {
                isRecording = false;
                voiceBtn.style.color = '';
                alert('Voice recognition error. Please try again.');
            };

            recognition.onend = function() {
                isRecording = false;
                voiceBtn.style.color = '';
            };
        }
    }

    // Voice button
    voiceBtn.addEventListener('click', function() {
        if (!recognition) {
            alert('Voice recognition is not supported in your browser.');
            return;
        }

        if (isRecording) {
            recognition.stop();
            isRecording = false;
            this.style.color = '';
        } else {
            recognition.start();
            isRecording = true;
            this.style.color = 'red';
        }
    });

    // File upload - FIXED VERSION
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const selectedFilesContainer = document.getElementById('selectedFiles');
    const uploadBtn = document.getElementById('uploadBtn');
    const closeUploadModal = document.getElementById('closeUploadModal');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');

    let selectedFiles = [];

    attachFileBtn.addEventListener('click', function() {
        fileUploadModal.style.display = 'flex';
    });

    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        selectedFiles = Array.from(this.files);
        renderSelectedFiles();
        uploadBtn.disabled = selectedFiles.length === 0;
    });

    function renderSelectedFiles() {
        selectedFilesContainer.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'selected-file-item';
            fileItem.innerHTML = `
                <span>${escapeHtml(file.name)}</span>
                <button class="btn-icon-small remove-file" data-index="${index}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;

            const removeBtn = fileItem.querySelector('.remove-file');
            removeBtn.addEventListener('click', function() {
                selectedFiles.splice(index, 1);
                renderSelectedFiles();
                uploadBtn.disabled = selectedFiles.length === 0;
            });

            selectedFilesContainer.appendChild(fileItem);
        });
    }

    uploadBtn.addEventListener('click', function() {
        if (selectedFiles.length === 0) {
            alert('Please select a file to upload');
            return;
        }

        selectedFiles.forEach(file => {
            // Create file message
            const fileMessage = {
                id: generateId(),
                author: userName,
                authorInitials: userInitials,
                content: `shared ${file.name}`,
                fileName: file.name,
                fileType: getFileType(file.name),
                fileSize: file.size,
                timestamp: formatTime(new Date()),
                isOwn: true,
                type: 'file'
            };

            // Add to messages
            messages.push(fileMessage);
            
            // Add to files list
            const newFile = {
                id: fileMessage.id,
                name: file.name,
                uploader: userName,
                timestamp: formatFileDate(new Date()),
                type: getFileType(file.name)
            };
            files.push(newFile);

            // Save to storage
            const storageKey = `messages_${roomName}`;
            saveToStorage(storageKey, messages);
        });

        // Update UI
        renderMessages();
        renderFiles(currentFileTab);
        
        // Reset and close
        selectedFiles = [];
        fileInput.value = '';
        renderSelectedFiles();
        fileUploadModal.style.display = 'none';
        
        // Show success message
        const message = selectedFiles.length === 1 ? 
            `Shared "${selectedFiles[0].name}"` : 
            `Shared ${selectedFiles.length} files`;
        
        // Add a system message
        const systemMessage = {
            id: generateId(),
            author: 'System',
            authorInitials: 'S',
            content: message,
            timestamp: formatTime(new Date()),
            isOwn: false,
            type: 'system'
        };
        messages.push(systemMessage);
        renderMessages();
    });

    closeUploadModal.addEventListener('click', function() {
        fileUploadModal.style.display = 'none';
        selectedFiles = [];
        fileInput.value = '';
        renderSelectedFiles();
    });

    cancelUploadBtn.addEventListener('click', function() {
        fileUploadModal.style.display = 'none';
        selectedFiles = [];
        fileInput.value = '';
        renderSelectedFiles();
    });

    // File tabs
    const fileTabs = document.querySelectorAll('.file-tab');
    const filesList = document.getElementById('filesList');

    fileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            fileTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFileTab = this.dataset.type;
            renderFiles(currentFileTab);
        });
    });

    function renderFiles(type) {
        const filtered = files.filter(f => f.type === type);
        
        if (filtered.length === 0) {
            filesList.innerHTML = `
                <div class="files-empty">
                    <p>No files yet</p>
                </div>
            `;
            return;
        }

        filesList.innerHTML = '';
        filtered.forEach(file => {
            const fileItem = createFileElement(file);
            filesList.appendChild(fileItem);
        });
    }

    function createFileElement(file) {
        const item = document.createElement('div');
        item.className = 'file-item';

        const iconColor = getFileIconColor(file.type);
        const iconSvg = getFileIconSvg(file.type, iconColor);

        item.innerHTML = `
            <div class="file-item-content">
                <div class="file-icon">${iconSvg}</div>
                <div class="file-info">
                    <p class="file-name">${escapeHtml(file.name)}</p>
                    <p class="file-meta">${escapeHtml(file.uploader)}</p>
                    <p class="file-meta">${file.timestamp}</p>
                </div>
            </div>
        `;

        return item;
    }

    function getFileIconSvg(type, color) {
        const icons = {
            document: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>`,
            photo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>`,
            audio: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
            </svg>`,
            other: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
            </svg>`
        };
        return icons[type] || icons.other;
    }

    // Navigation buttons
    homeBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    leaveBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to leave this room?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });

    // Settings modal
    const settingsRoomName = document.getElementById('settingsRoomName');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const deleteRoomBtn = document.getElementById('deleteRoomBtn');
    const autoDeleteCheckbox = document.getElementById('autoDelete');
    const autoDeleteOptions = document.getElementById('autoDeleteOptions');

    settingsBtn.addEventListener('click', function() {
        settingsModal.style.display = 'flex';
        settingsRoomName.value = roomName;
    });

    closeSettingsModal.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    cancelSettingsBtn.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', function() {
        alert('Settings saved successfully!');
        settingsModal.style.display = 'none';
    });

    autoDeleteCheckbox.addEventListener('change', function() {
        autoDeleteOptions.style.display = this.checked ? 'block' : 'none';
    });

    deleteRoomBtn.addEventListener('click', function() {
        settingsModal.style.display = 'none';
        deleteConfirmModal.style.display = 'flex';
    });

    // Delete confirmation
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    cancelDeleteBtn.addEventListener('click', function() {
        deleteConfirmModal.style.display = 'none';
    });

    confirmDeleteBtn.addEventListener('click', function() {
        alert('Room deleted');
        window.location.href = 'index.html';
    });

    // Participants modal
    const closeParticipantsModal = document.getElementById('closeParticipantsModal');
    const closeParticipantsBtn = document.getElementById('closeParticipantsBtn');
    const participantsList = document.getElementById('participantsList');

    participantsBtn.addEventListener('click', function() {
        participantsModal.style.display = 'flex';
        renderParticipants();
    });

    closeParticipantsModal.addEventListener('click', function() {
        participantsModal.style.display = 'none';
    });

    closeParticipantsBtn.addEventListener('click', function() {
        participantsModal.style.display = 'none';
    });

    function renderParticipants() {
        participantsList.innerHTML = '';
        
        // Add current user
        const currentUser = {
            name: userName,
            initials: userInitials,
            status: 'online',
            joinTime: 'Joined just now'
        };
        const allParticipants = [currentUser, ...DUMMY_PARTICIPANTS];

        allParticipants.forEach(participant => {
            const item = document.createElement('div');
            item.className = 'participant-item';

            const statusColor = participant.status === 'online' ? 
                'var(--status-online)' : 'var(--status-offline)';

            item.innerHTML = `
                <div class="avatar-initials" style="background-color: ${getAvatarColor(participant.initials)}">
                    ${participant.initials}
                </div>
                <div class="participant-info">
                    <p class="participant-name">${escapeHtml(participant.name)}</p>
                    <p class="participant-status">
                        <span class="status-dot" style="background-color: ${statusColor}"></span>
                        ${participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                    </p>
                    <p class="participant-time">${participant.joinTime}</p>
                </div>
            `;

            participantsList.appendChild(item);
        });
    }

    // Close modals on outside click
    [fileUploadModal, settingsModal, participantsModal, deleteConfirmModal].forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}