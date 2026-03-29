import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Imports for the core engine
from core.translator import translate_to_english
from core.gemini_llm import handle_generate_summary, detect_intent

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

    async def broadcast(self, message: str):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.active_connections.remove(d)

manager = ConnectionManager()

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    processing_tasks: set[asyncio.Task] = set()
    session_language: str = "hi"  # set from session_start message

                    
    try:
        while True:
            data = await websocket.receive()

            if "text" in data:
                msg = data["text"]
                try:
                    msg_json = json.loads(msg)
                    msg_type = msg_json.get("type")
                    if msg_type == "session_start":
                        session_language = msg_json.get('language', 'hi')
                        print(f"Session started with language: {session_language}")
                    elif msg_type == "ping":
                        pass
                    elif msg_type == "native_text":
                        # Instant Speech Recognition from the browser
                        native_text = msg_json.get("text", "")
                        timestamp = msg_json.get("timestamp", "")
                        if not native_text:
                            continue
                            
                        # Translate to English for Staff Dashboard and Gemini
                        english_text = await translate_to_english(native_text)
                        
                        # 1. Broadcast the complete transcript bubble
                        transcript_json = {
                            "type": "transcript_update",
                            "data": {
                                "id": f"{timestamp}-UB-2026-XXXX", # mock ID
                                "sender": "customer",
                                "originalText": native_text,
                                "translatedText": english_text,
                                "originalLang": session_language,
                                "targetLang": "English",
                                "timestamp": timestamp
                            }
                        }
                        await manager.broadcast(json.dumps(transcript_json))
                        
                        # 2. Fire intent detection asynchronously so it doesn't block the loop
                        asyncio.create_task(detect_intent(english_text, manager, session_id="UB-2026-XXXX"))
                        
                    elif msg_type == "generate_summary":
                        await handle_generate_summary(msg_json, websocket)
                except Exception as e:
                    print(f"Invalid JSON message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        # Do NOT cancel in-flight tasks — they broadcast to all active connections.
        # The staff dashboard is still connected and should receive pending transcripts.
    except Exception as e:
        if "disconnect" not in str(e).lower():
            print(f"Unexpected error: {e}")
        manager.disconnect(websocket)
        # Same: let tasks finish broadcasting to remaining connections

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)