from fastapi import FastAPI, WebSocket
from api.routes import router as api_router
from core.audio_streamer import handle_audio_stream

app = FastAPI(title="V.A.N.I Backend")

# Plug in API routes
app.include_router(api_router, prefix="/api")

# WebSocket endpoint for audio streaming
@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await handle_audio_stream(websocket)