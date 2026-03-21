import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Imports for the core engine
from core.audio_streamer import SAMPLE_RATE, FRAME_DURATION_MS
from core.whisper_engine import process_audio as whisper_process
from core.gemini_llm import handle_generate_summary

app = FastAPI(title="VANI Backend WebSocket")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

manager = ConnectionManager()

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    buffer = bytearray()
    
    try:
        while True:
            data = await websocket.receive()
            
            # 1. Handle Binary Audio (Streaming)
            if "bytes" in data:
                buffer.extend(data["bytes"])
                
                # ISSUE 2 FIX: Process when buffer hits ~100KB (3-4 seconds)
                if len(buffer) >= 100000: 
                    audio_bytes = bytes(buffer)
                    # Calls the ffmpeg-enabled whisper engine
                    await whisper_process(audio_bytes, websocket)
                    buffer = bytearray()

            # 2. Handle JSON Messages (ISSUE 3 FIX)
            elif "text" in data:
                msg = data["text"]
                try:
                    msg_json = json.loads(msg)
                    msg_type = msg_json.get("type")

                    if msg_type == "session_start":
                        print(f"Session started with language: {msg_json.get('language')}")

                    elif msg_type == "ping":
                        pass  # Silent keepalive to prevent log noise

                    elif msg_type == "generate_summary":
                        await handle_generate_summary(msg_json, websocket)

                except Exception as e:
                    print(f"Invalid JSON message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Unexpected error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)