import os
import json
import asyncio
from datetime import datetime

# Global set to track if session meta was sent (as in your previous code)
SESSION_SENT = set()

async def process_audio(audio_bytes: bytes, websocket):
    """
    FIX 1: Handles raw bytes directly and uses unique filenames for concurrency.
    """
    # Unique filename based on websocket memory ID to avoid race conditions
    filename = f"temp_{id(websocket)}.wav"
    session_id = "UB-2026-XXXX"  # Replace dynamically if needed
    timestamp = datetime.utcnow().isoformat()
    
    try:
        # Save the raw bytes to the unique temp file
        with open(filename, "wb") as f:
            f.write(audio_bytes)

        # Transcribe & translate (Running in thread to keep websocket loop responsive)
        result = await asyncio.to_thread(MODEL.transcribe, filename, task="translate")
        
        text = result.get("text", "").strip()
        source_lang = result.get("language", "unknown")

        # 1. Send transcript update
        transcript_json = {
            "type": "transcript_update",
            "data": {
                "id": f"{timestamp}-{session_id}",
                "sender": "customer",
                "originalText": text,
                "translatedText": text,  # Translation done by Whisper
                "originalLang": source_lang,
                "targetLang": "English",
                "timestamp": timestamp
            }
        }
        await websocket.send_text(json.dumps(transcript_json))

        # 2. Send session_meta once per session
        if session_id not in SESSION_SENT:
            meta_json = {
                "type": "session_meta",
                "detectedLang": source_lang,
                "targetLang": "English",
                "confidenceScore": result.get("avg_logprob", 0.97),
                "sessionId": session_id
            }
            await websocket.send_text(json.dumps(meta_json))
            SESSION_SENT.add(session_id)
            
        return text # Return text so main.py can pass it to intent detection

    except Exception as e:
        print(f"Whisper Error: {e}")
        return ""

    finally:
        # Cleanup: Remove the temp file after processing is done
        if os.path.exists(filename):
            os.remove(filename)