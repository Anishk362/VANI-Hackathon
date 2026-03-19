# from fastapi import FastAPI, WebSocket

# app = FastAPI()

# @app.get("/")
# def home():
#     return {"status": "running"}

# @app.websocket("/ws/audio")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     print("Client connected")

#     try:
#         while True:
#             data = await websocket.receive_bytes()
#             print("Received audio chunk:", len(data))

#     except Exception as e:
#         print("Connection closed:", e)

#!!!!!!!!!NEW!!!!!!!!!!!!

from fastapi import FastAPI, WebSocket
from core.audio_streamer import handle_audio_stream

app = FastAPI()

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await handle_audio_stream(websocket)