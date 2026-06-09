# 🚀 Quick Start Guide - TeamChat+

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.8 or higher installed
- ✅ pip (Python package manager)

Check your Python version:
```bash
python --version
# or
python3 --version
```

## Installation Steps

### 1. Install Dependencies

Open terminal in the project directory and run:

```bash
pip install -r requirements.txt
```

**For Windows users:**
```bash
python -m pip install -r requirements.txt
```

**For Mac/Linux users:**
```bash
pip3 install -r requirements.txt
# or with sudo if needed
sudo pip3 install -r requirements.txt
```

### 2. Start the Server

Run the following command:

```bash
python server.py
```

**For Mac/Linux:**
```bash
python3 server.py
```

You should see:
```
🚀 TeamChat+ Server starting...
📍 Server running on http://localhost:8000
🔌 WebSocket endpoint: ws://localhost:8000/ws/{room}/{username}/{initials}
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 3. Open Your Browser

Navigate to:
```
http://localhost:8000
```

## 🎉 Start Chatting!

### Create Your First Room

1. **Enter Your Name**: Type your display name (e.g., "John Doe")
2. **Create/Join Room**: Enter a room name (e.g., "General", "Team Meeting")
3. **Click "Create Room" or "Join Room"**
4. **Start Messaging!**

### Test With Multiple Users

1. Open **multiple browser windows** or use **different browsers**
2. Use **different display names** in each window
3. Join the **same room name**
4. Send messages and see them appear in real-time! ⚡

## Features to Try

### 💬 Real-Time Messaging
- Type a message and press Enter
- See messages appear instantly for all users
- Messages show sender name and timestamp

### 📁 File Sharing
1. Click the **📎 attachment icon** next to the message input
2. Select one or more files
3. Files appear in the **"Shared Files"** sidebar
4. Click any file to view/download it

Files are automatically categorized:
- 📄 Documents (PDF, DOCX, TXT, etc.)
- 🖼️ Photos (JPG, PNG, GIF, etc.)
- 🎵 Audio (MP3, WAV, OGG, etc.)
- 🎥 Videos (MP4, AVI, MOV, etc.)
- 📦 Archives (ZIP, RAR, 7Z, etc.)

### 🏠 Room Management
- **Search Rooms**: Use the search bar to find rooms
- **Switch Rooms**: Click on a room in the sidebar
- **Leave Room**: Click "Leave" in the menu
- **Return Home**: Click "Home" to go back

### 👥 See Who's Online
- Member count updates in real-time
- See join/leave notifications in chat

## Troubleshooting

### ❌ "ModuleNotFoundError"
**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### ❌ "Port 8000 already in use"
**Solution 1**: Stop other applications using port 8000

**Solution 2**: Change the port in `server.py` (line 300):
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed to 8001
```
Then access at `http://localhost:8001`

### ❌ WebSocket Connection Failed
**Solution**:
1. Ensure server is running
2. Refresh your browser
3. Check browser console for errors (F12)
4. Clear browser cache and cookies

### ❌ Files Not Uploading
**Solution**:
1. Check `uploads/` folder exists
2. Ensure you have write permissions
3. Check file size (large files may take time)

### ❌ Messages Not Appearing
**Solution**:
1. Check WebSocket connection status
2. Ensure you're in the same room
3. Refresh the page
4. Restart the server

## Advanced Usage

### Running on Network (LAN)

To access from other devices on your network:

1. Find your local IP address:

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

2. Other devices can access at:
```
http://YOUR_IP:8000
# Example: http://192.168.1.100:8000
```

3. Update WebSocket URL in `js/chatroom.js` if needed:
```javascript
const wsUrl = `ws://YOUR_IP:8000/ws/...`;
```

### Development Mode with Auto-Reload

For development with automatic restart on code changes:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
teamchat-app/
├── server.py              ← Python backend server
├── requirements.txt       ← Python dependencies
├── README.md             ← Full documentation
├── START_HERE.md         ← This guide
├── index.html            ← Homepage
├── teamchat-plus.html    ← Chat room page
├── css/                  ← Stylesheets
├── js/
│   ├── app.js           ← Homepage logic
│   ├── chatroom.js      ← WebSocket client
│   └── utils.js         ← Utility functions
├── assets/              ← Images and media
└── uploads/             ← Uploaded files storage
```

## Stopping the Server

Press `CTRL+C` in the terminal where the server is running.

## Next Steps

1. ✅ Read the full [README.md](README.md) for detailed documentation
2. ✅ Customize the UI by editing CSS files
3. ✅ Explore the API endpoints
4. ✅ Add your own features!

## Need Help?

- Check `README.md` for detailed documentation
- Look at browser console (F12) for error messages
- Ensure all dependencies are installed
- Verify Python version is 3.8 or higher

## Quick Commands Reference

```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python server.py

# Start with auto-reload (development)
uvicorn server:app --reload

# Check Python version
python --version

# Stop server
CTRL+C
```

---

**🎉 Enjoy using TeamChat+!**

Built with ❤️ using Python FastAPI and WebSockets

