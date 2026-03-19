import io
import json
import time
from core.whisper_engine import process_audio
from core.gemini_llm import detect_intent

CHUNK_DURATION = 3  # seconds

async def handle_audio_stream(websocket):
    buffer = io.BytesIO()
    start_time = time.time()
    language = "hi"

    while True:
        message = await websocket.receive()

        # 1. Handle JSON messages
        if "text" in message:
            data = json.loads(message["text"])

            if data["type"] == "session_start":
                language = data.get("language", "hi")

            elif data["type"] == "ping":
                # optional pong
                await websocket.send_text(json.dumps({"type": "pong"}))

        # 2. Handle binary audio
        elif "bytes" in message:
            buffer.write(message["bytes"])

        # 3. Check if 3 seconds passed
        if time.time() - start_time >= CHUNK_DURATION:
            buffer.seek(0)

            result = await process_audio(buffer, language)

            # Send transcript
            await websocket.send_text(json.dumps(result["transcript"]))

            # Detect intent
            intent = await detect_intent(result["translated_text"])

            if intent:
                await websocket.send_text(json.dumps(intent))

            # Reset buffer
            buffer = io.BytesIO()
            start_time = time.time()