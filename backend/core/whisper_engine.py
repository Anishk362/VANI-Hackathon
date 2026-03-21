import os
import json
import asyncio
import whisper
from datetime import datetime
from core.gemini_llm import detect_intent 

# FIX 1: Initialize MODEL
MODEL = whisper.load_model("small")
SESSION_SENT = set()

async def process_audio(audio_bytes: bytes, websocket):
    """
    Transcribes audio bytes and triggers Gemini intent detection.
    """
    filename = f"temp_{id(websocket)}.wav"
    session_id = "UB-2026-XXXX"
    timestamp = datetime.utcnow().isoformat()
    
    try:
        with open(filename, "wb") as f:
            f.write(audio_bytes)

        # Transcribe & translate
        result = await asyncio.to_thread(MODEL.transcribe, filename, task="translate")
        text = result.get("text", "").strip()
        source_lang = result.get("language", "unknown")

        # 1. Update Frontend with transcript
        transcript_json = {
            "type": "transcript_update",
            "data": {
                "id": f"{timestamp}-{session_id}",
                "sender": "customer",
                "originalText": text,
                "translatedText": text,
                "originalLang": source_lang,
                "targetLang": "English",
                "timestamp": timestamp
            }
        }
        await websocket.send_text(json.dumps(transcript_update_json))

        # 2. Send session meta once
        if session_id not in SESSION_SENT:
            await websocket.send_text(json.dumps({
                "type": "session_meta",
                "detectedLang": source_lang,
                "targetLang": "English",
                "confidenceScore": result.get("avg_logprob", 0.97),
                "sessionId": session_id
            }))
            SESSION_SENT.add(session_id)
            
        # 3. Trigger Gemini Intent Detection
        if text:
            await detect_intent(text, websocket, session_id=session_id)

        return text

    except Exception as e:
        print(f"Whisper Error: {e}")
        return ""
    finally:
        if os.path.exists(filename):
            os.remove(filename)