import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Dict, Set, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for uploaded files
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Store active connections per room
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_info: Dict[WebSocket, Dict] = {}
        self.rooms: Dict[str, Dict] = {}
        self.messages: Dict[str, List[Dict]] = {}
        self.files: Dict[str, List[Dict]] = {}
        
    async def connect(self, websocket: WebSocket, room: str, username: str, user_initials: str):
        await websocket.accept()
        
        if room not in self.active_connections:
            self.active_connections[room] = set()
            self.rooms[room] = {
                'name': room,
                'created_at': datetime.now().isoformat(),
                'members': []
            }
            self.messages[room] = []
            self.files[room] = []
        
        self.active_connections[room].add(websocket)
        self.user_info[websocket] = {
            'username': username,
            'initials': user_initials,
            'room': room,
            'joined_at': datetime.now().isoformat()
        }
        
        # Add member to room
        member = {
            'username': username,
            'initials': user_initials,
            'status': 'online',
            'joined_at': datetime.now().isoformat()
        }
        self.rooms[room]['members'].append(member)
        
        # Send join notification
        await self.broadcast_to_room(room, {
            'type': 'user_joined',
            'username': username,
            'initials': user_initials,
            'timestamp': datetime.now().strftime('%I:%M %p'),
            'members_count': len(self.active_connections[room])
        })
        
        # Send room history to new user
        await websocket.send_json({
            'type': 'room_history',
            'messages': self.messages[room],
            'files': self.files[room],
            'members': self.rooms[room]['members'],
            'members_count': len(self.active_connections[room])
        })
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.user_info:
            user = self.user_info[websocket]
            room = user['room']
            
            if room in self.active_connections:
                self.active_connections[room].discard(websocket)
                
                # Remove member from room
                self.rooms[room]['members'] = [
                    m for m in self.rooms[room]['members'] 
                    if m['username'] != user['username']
                ]
                
                # Clean up empty rooms
                if not self.active_connections[room]:
                    del self.active_connections[room]
                    # Optionally keep room data or delete it
                    # del self.rooms[room]
                    # del self.messages[room]
                    # del self.files[room]
            
            del self.user_info[websocket]
            return user
        return None
    
    async def broadcast_to_room(self, room: str, message: dict):
        if room in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[room]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Clean up disconnected clients
            for conn in disconnected:
                self.active_connections[room].discard(conn)
    
    def add_message(self, room: str, message: dict):
        if room not in self.messages:
            self.messages[room] = []
        self.messages[room].append(message)
    
    def add_file(self, room: str, file_info: dict):
        if room not in self.files:
            self.files[room] = []
        self.files[room].append(file_info)
    
    def get_rooms_list(self) -> List[Dict]:
        return [
            {
                'name': room_name,
                'members_count': len(self.active_connections.get(room_name, [])),
                'created_at': room_data['created_at']
            }
            for room_name, room_data in self.rooms.items()
        ]

manager = ConnectionManager()

# WebSocket endpoint
@app.websocket("/ws/{room}/{username}/{user_initials}")
async def websocket_endpoint(websocket: WebSocket, room: str, username: str, user_initials: str):
    print(f"🔌 WebSocket connection attempt: room={room}, user={username}")
    await manager.connect(websocket, room, username, user_initials)
    print(f"✅ WebSocket connected: room={room}, user={username}")
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get('type')
            
            if message_type == 'message':
                message = {
                    'id': str(uuid.uuid4()),
                    'type': 'message',
                    'author': username,
                    'authorInitials': user_initials,
                    'content': data['content'],
                    'timestamp': datetime.now().strftime('%I:%M %p'),
                    'isOwn': False
                }
                
                manager.add_message(room, message)
                await manager.broadcast_to_room(room, message)
            
            elif message_type == 'pin_message':
                await manager.broadcast_to_room(room, {
                    'type': 'message_pinned',
                    'message_id': data['message_id'],
                    'pinned_by': username
                })
            
            elif message_type == 'typing':
                await manager.broadcast_to_room(room, {
                    'type': 'user_typing',
                    'username': username
                })
    
    except WebSocketDisconnect:
        user = manager.disconnect(websocket)
        if user:
            await manager.broadcast_to_room(user['room'], {
                'type': 'user_left',
                'username': user['username'],
                'timestamp': datetime.now().strftime('%I:%M %p'),
                'members_count': len(manager.active_connections.get(user['room'], []))
            })

# File upload endpoint
@app.post("/upload/{room}/{username}")
async def upload_file(room: str, username: str, file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Determine file type
        file_type = get_file_type(file.filename)
        
        # Create file info
        file_info = {
            'id': str(uuid.uuid4()),
            'name': file.filename,
            'filename': unique_filename,
            'uploader': username,
            'timestamp': datetime.now().strftime('%b %d, %I:%M %p'),
            'type': file_type,
            'size': len(content),
            'url': f"/files/{unique_filename}"
        }
        
        manager.add_file(room, file_info)
        
        # Broadcast file to room
        await manager.broadcast_to_room(room, {
            'type': 'file_shared',
            'file': file_info,
            'uploader': username
        })
        
        return {"success": True, "file": file_info}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Get file
@app.get("/files/{filename}")
async def get_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "File not found"}

# Get rooms list
@app.get("/api/rooms")
async def get_rooms():
    return {"rooms": manager.get_rooms_list()}

# Get room info
@app.get("/api/room/{room}")
async def get_room_info(room: str):
    if room in manager.rooms:
        return {
            "room": manager.rooms[room],
            "members_count": len(manager.active_connections.get(room, [])),
            "messages_count": len(manager.messages.get(room, [])),
            "files_count": len(manager.files.get(room, []))
        }
    return {"error": "Room not found"}

def get_file_type(filename: str) -> str:
    ext = filename.split('.')[-1].lower()
    
    image_exts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    audio_exts = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
    video_exts = ['mp4', 'avi', 'mov', 'mkv', 'webm']
    doc_exts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx']
    archive_exts = ['zip', 'rar', '7z', 'tar', 'gz']
    
    if ext in image_exts:
        return 'photos'
    elif ext in audio_exts:
        return 'audio'
    elif ext in video_exts:
        return 'videos'
    elif ext in doc_exts:
        return 'documents'
    elif ext in archive_exts:
        return 'archives'
    else:
        return 'documents'

# Serve static files
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Serve HTML pages
@app.get("/")
async def serve_index():
    return FileResponse("index.html")

@app.get("/teamchat-plus.html")
async def serve_chatroom():
    return FileResponse("teamchat-plus.html")

@app.get("/test-websocket.html")
async def serve_test():
    return FileResponse("test_websocket.html")

if __name__ == "__main__":
    print("🚀 TeamChat+ Server starting...")
    print("📍 Server running on http://localhost:8000")
    print("🔌 WebSocket endpoint: ws://localhost:8000/ws/{room}/{username}/{initials}")
    uvicorn.run(app, host="0.0.0.0", port=8000)

