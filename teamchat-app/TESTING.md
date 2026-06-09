# Testing the TeamChat Application

## Quick Start

1. **Start the server** (if not already running):
   ```
   python server.py
   ```
   Or use uvicorn directly:
   ```
   python -m uvicorn server:app --host 0.0.0.0 --port 8000
   ```

2. **Open the application**:
   - Navigate to: http://localhost:8000/
   - Enter your name
   - Enter/create a room name
   - Click "Join Room"

3. **Test WebSocket functionality**:
   - Open browser console (F12)
   - Check for connection status messages
   - Send a test message
   - Open another browser/incognito window to simulate multiple users
   - Verify member count updates when others join/leave

## What Was Fixed

1. **WebSocket Connection**:
   - Added proper error handling and status messages
   - Connection status is now visible in the UI
   - Automatic reconnection attempts (max 5)

2. **Message Display**:
   - Fixed message ownership detection
   - Properly clears "Loading..." state
   - Messages are displayed with correct styling

3. **Member Count**:
   - Member count updates in real-time
   - Shows in both sidebar and chat header
   - Reflects actual number of connected users

4. **Debug Logging**:
   - Added console logs for easier debugging
   - Connection status clearly indicated
   - Message flow tracked

## Expected Behavior

- On page load: Shows "Connecting..." then "No messages yet" or loads existing messages
- When message is sent: Appears immediately in the chat
- When another user joins: You see "X joined the room" notification
- Member count: Updates automatically in sidebar and header
- Files: Can be shared and appear in the files sidebar

## Troubleshooting

If you see "Connection error":
1. Verify server is running: `netstat -ano | findstr :8000`
2. Check browser console for detailed error messages
3. Make sure port 8000 is not blocked by firewall

If member count is wrong:
1. Open browser console and check for errors
2. Verify multiple users are actually connected
3. Look for "member count" console logs
