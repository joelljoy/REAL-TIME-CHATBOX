# TeamChat+ - Real-Time Chat Application

A modern, real-time chat application with WebSocket support, file sharing, and room-based communication.

## Features

- 🔐 User authentication with display names
- 💬 Real-time messaging via WebSockets
- 🏠 Multiple chat rooms
- 📁 File sharing with categorization
- 👥 Live member count
- 🔍 Room search functionality
- 📱 Responsive design

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **WebSockets** - Real-time bidirectional communication
- **Uvicorn** - ASGI server

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **WebSocket API** - Native browser support
- **HTML5/CSS3** - Modern responsive design

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. Clone the repository:
```bash
cd teamchat-app
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python server.py
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## Usage

### Creating/Joining a Room

1. Enter your display name on the homepage
2. Enter a room name
3. Click "Create Room" or "Join Room"
4. Start chatting!

### Sending Messages

- Type your message in the text area
- Press Enter or click the send button
- Messages appear in real-time for all users in the room

### Sharing Files

1. Click the attachment icon (📎) in the message input area
2. Select one or multiple files
3. Files are automatically uploaded and visible in the "Shared Files" sidebar
4. Click on any file to download/view it

### File Categories

Files are automatically categorized into:
- **Documents** - PDF, DOC, DOCX, TXT, etc.
- **Photos** - JPG, PNG, GIF, etc.
- **Audio** - MP3, WAV, OGG, etc.
- **Videos** - MP4, AVI, MOV, etc.
- **Archives** - ZIP, RAR, 7Z, etc.

### Navigation

- **Search** - Find and switch between rooms
- **Home** - Return to homepage
- **Leave** - Exit current room

## API Endpoints

### HTTP Endpoints

- `GET /` - Homepage
- `GET /teamchat-plus.html` - Chat room page
- `GET /api/rooms` - List all active rooms
- `GET /api/room/{room}` - Get specific room info
- `POST /upload/{room}/{username}` - Upload file to room
- `GET /files/{filename}` - Download file

### WebSocket Endpoint

```
ws://localhost:8000/ws/{room}/{username}/{initials}
```

#### Message Types

**Client to Server:**
```json
{
  "type": "message",
  "content": "Your message here"
}
```

**Server to Client:**
```json
{
  "type": "message",
  "id": "unique-id",
  "author": "Username",
  "authorInitials": "UN",
  "content": "Message content",
  "timestamp": "10:30 AM",
  "isOwn": false
}
```

```json
{
  "type": "room_history",
  "messages": [],
  "files": [],
  "members": [],
  "members_count": 5
}
```

```json
{
  "type": "user_joined",
  "username": "NewUser",
  "initials": "NU",
  "timestamp": "10:30 AM",
  "members_count": 6
}
```

```json
{
  "type": "file_shared",
  "file": {
    "id": "file-id",
    "name": "document.pdf",
    "uploader": "Username",
    "timestamp": "Nov 15, 10:30 AM",
    "type": "documents",
    "url": "/files/unique-filename.pdf"
  },
  "uploader": "Username"
}
```

## Project Structure

```
teamchat-app/
├── server.py              # FastAPI backend server
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── index.html            # Homepage
├── teamchat-plus.html    # Chat room interface
├── css/
│   ├── globals.css
│   ├── components.css
│   └── utilities.css
├── js/
│   ├── app.js            # Homepage logic
│   ├── chatroom.js       # Chat room WebSocket client
│   ├── chat.js
│   ├── room.js
│   └── utils.js
├── assets/
│   └── images/
└── uploads/              # Uploaded files storage
```

## Configuration

### Server Settings

Edit `server.py` to change:
- **Host**: Default `0.0.0.0` (all interfaces)
- **Port**: Default `8000`
- **Upload directory**: Default `uploads/`
- **CORS settings**: Currently allows all origins

### Client Settings

Edit `js/chatroom.js` to change:
- **WebSocket URL**: Default `ws://localhost:8000`
- **Reconnection attempts**: Default `5`
- **Reconnection delay**: Default `2 seconds * attempt number`

## Features in Detail

### Real-Time Communication
- WebSocket connections maintain persistent connections
- Automatic reconnection on disconnect
- Live message synchronization across all clients

### File Management
- Files stored securely on server
- Automatic file type detection
- Preview and download capabilities
- Per-room file isolation

### Room Management
- Dynamic room creation
- No pre-configured rooms required
- Rooms persist while users are connected
- Automatic cleanup of empty rooms

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Running in Development Mode

```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Building for Production

1. Set proper CORS origins in `server.py`
2. Configure proper file storage (consider cloud storage)
3. Add authentication/authorization
4. Enable HTTPS
5. Set up reverse proxy (nginx/Apache)

## Security Considerations

⚠️ **Important**: This is a development version. For production:

1. Implement proper authentication
2. Validate and sanitize all inputs
3. Use HTTPS for all connections
4. Implement rate limiting
5. Add file upload restrictions (size, type)
6. Use environment variables for configuration
7. Implement proper session management
8. Add CSRF protection

## Troubleshooting

### WebSocket Connection Failed
- Ensure server is running on port 8000
- Check firewall settings
- Verify WebSocket URL in browser console

### Files Not Uploading
- Check `uploads/` directory permissions
- Verify file size limits
- Check server logs for errors

### Messages Not Appearing
- Verify WebSocket connection status
- Check browser console for errors
- Ensure room name matches across clients

