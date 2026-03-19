# backend/core/whisper_engine.py
import io
import json
import asyncio
import whisper
from datetime import datetime

# Load Whisper model once
MODEL = whisper.load_model("small")  # or "medium", "large" if you want better accuracy

SESSION_SENT = set()  # track session_meta sent

async def process_audio(buffer: io.BytesIO, websocket):
    buffer.seek(0)
    audio_bytes = buffer.read()

    # Save temp file for Whisper
    with open("temp.wav", "wb") as f:
        f.write(audio_bytes)

    # Transcribe & translate
    result = MODEL.transcribe("temp.wav", task="translate")  # automatically detects source language
    text = result.get("text", "").strip()
    source_lang = result.get("language", "unknown")

    session_id = "UB-2026-XXXX"  # replace dynamically if needed
    timestamp = datetime.utcnow().isoformat()

    # Send transcript update
    transcript_json = {
        "type": "transcript_update",
        "data": {
            "id": f"{timestamp}-{session_id}",
            "sender": "customer",
            "originalText": text,
            "translatedText": text,  # translation already done by Whisper
            "originalLang": source_lang,
            "targetLang": "English",
            "timestamp": timestamp
        }
    }
    await websocket.send(json.dumps(transcript_json))

    # Send session_meta once
    if session_id not in SESSION_SENT:
        meta_json = {
            "type": "session_meta",
            "detectedLang": source_lang,
            "targetLang": "English",
            "confidenceScore": result.get("avg_logprob", 0.97),
            "sessionId": session_id
        }
        await websocket.send(json.dumps(meta_json))
        SESSION_SENT.add(session_id)