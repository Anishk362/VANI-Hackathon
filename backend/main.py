<<<<<<< Updated upstream
from fastapi import FastAPI
from api.routes import router as api_router

app = FastAPI(title="V.A.N.I Backend")

# Plug in your routes
app.include_router(api_router, prefix="/api")
=======
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        data = await websocket.receive_bytes()
        print("Received chunk:", len(data))
>>>>>>> Stashed changes
