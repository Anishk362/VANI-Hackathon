# backend/main.py
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from core.audio_streamer import frame_generator, vad, SAMPLE_RATE, FRAME_DURATION_MS, process_audio
from core.whisper_engine import process_audio as whisper_process
from core.gemini_llm import handle_generate_summary

app = FastAPI(title="VANI Backend WebSocket")

# Allow frontend localhost connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        self.active_connections.remove(websocket)

manager = ConnectionManager()

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    buffer = bytearray()
    try:
        while True:
            data = await websocket.receive()
            
            # Handle binary audio
            if "bytes" in data:
                buffer.extend(data["bytes"])
                frames = list(frame_generator(FRAME_DURATION_MS, buffer, SAMPLE_RATE))
                speech_frames = [f for f in frames if vad.is_speech(f, SAMPLE_RATE)]

                # If >3 sec speech, process via Whisper
                if len(speech_frames) * FRAME_DURATION_MS / 1000.0 >= 3:
                    audio_bytes = bytes(buffer)
                    await whisper_process(audio_bytes, websocket)
                    buffer = bytearray()

            # Handle JSON messages (e.g., generate_summary)
            elif "text" in data:
                msg = data["text"]
                try:
                    msg_json = await asyncio.to_thread(lambda: json.loads(msg))
                    if msg_json.get("type") == "generate_summary":
                        await handle_generate_summary(msg_json, websocket)
                except Exception as e:
                    print("Invalid JSON message:", e)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")