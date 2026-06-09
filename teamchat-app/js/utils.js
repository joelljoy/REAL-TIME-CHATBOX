// Utility Functions for TeamChat+

/**
 * Generate initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
function getInitials(name) {
    if (!name) return '';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate avatar color based on initials
 * @param {string} initials - User initials
 * @returns {string} - HSL color string
 */
function getAvatarColor(initials) {
    const colors = [
        'hsl(170, 60%, 45%)',  // Teal
        'hsl(250, 50%, 65%)',  // Purple
        'hsl(10, 80%, 55%)',   // Red
        'hsl(40, 90%, 50%)',   // Orange
        'hsl(200, 70%, 50%)',  // Blue
    ];
    
    if (!initials) return colors[0];
    
    const charCode = initials.charCodeAt(0);
    return colors[charCode % colors.length];
}

/**
 * Format timestamp to readable time
 * @param {Date|string} date - Date object or string
 * @returns {string} - Formatted time (e.g., "10:30 AM")
 */
function formatTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format date for file timestamps
 * @param {Date|string} date - Date object or string
 * @returns {string} - Formatted date (e.g., "Nov 15, 10:30 AM")
 */
function formatFileDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const time = formatTime(d);
    
    return `${month} ${day}, ${time}`;
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function saveToStorage(key, value) {
    try {
        const jsonValue = JSON.stringify(value);
        localStorage.setItem(key, jsonValue);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @returns {any} - Parsed value or null
 */
function getFromStorage(key) {
    try {
        const jsonValue = localStorage.getItem(key);
        return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

/**
 * Validate form fields
 * @param {Object} fields - Object with field names and values
 * @returns {boolean} - True if all fields are valid
 */
function validateFields(fields) {
    for (const [key, value] of Object.entries(fields)) {
        if (typeof value === 'string' && !value.trim()) {
            return false;
        }
        if (value === null || value === undefined) {
            return false;
        }
    }
    return true;
}

/**
 * Get file type from filename
 * @param {string} filename - File name
 * @returns {string} - File type (document, photo, audio, other)
 */
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const documentExts = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'figma'];
    const photoExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    
    if (documentExts.includes(ext)) return 'document';
    if (photoExts.includes(ext)) return 'photo';
    if (audioExts.includes(ext)) return 'audio';
    
    return 'other';
}

/**
 * Get file icon color based on type
 * @param {string} type - File type
 * @returns {string} - Color string
 */
function getFileIconColor(type) {
    const colors = {
        document: '#3B82F6',  // Blue
        photo: '#10B981',     // Green
        audio: '#8B5CF6',     // Purple
        other: '#6B7280'      // Gray
    };
    
    return colors[type] || colors.other;
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get room name from URL
 * @returns {string} - Room name or null
 */
function getRoomNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
}

/**
 * Navigate to page with room parameter
 * @param {string} page - Page URL
 * @param {string} roomName - Room name
 */
function navigateToRoom(page, roomName) {
    window.location.href = `${page}?room=${encodeURIComponent(roomName)}`;
}