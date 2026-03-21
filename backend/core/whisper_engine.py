import os
import json
import asyncio
import subprocess
import whisper
from datetime import datetime
from core.gemini_llm import detect_intent

# Initialize MODEL
MODEL = whisper.load_model("small")
SESSION_SENT = set()

async def process_audio(audio_bytes: bytes, websocket):
    """
    Converts WebM/Opus from browser to WAV, transcribes, and detects intent.
    """
    session_id = "UB-2026-XXXX"
    timestamp = datetime.utcnow().isoformat()
    # Use unique IDs to prevent file collisions during concurrent requests
    webm_file = f"temp_{id(websocket)}_{datetime.now().microsecond}.webm"
    wav_file = f"temp_{id(websocket)}_{datetime.now().microsecond}.wav"

    try:
        # Step 1: Save raw browser audio (WebM/Opus format)
        with open(webm_file, "wb") as f:
            f.write(audio_bytes)

        # Step 2: Convert WebM to 16kHz mono 16-bit PCM WAV using ffmpeg
        # This is the "Magic Fix" for the format mismatch
        process = await asyncio.to_thread(
            lambda: subprocess.run([
                "ffmpeg", "-y", "-i", webm_file,
                "-ar", "16000",
                "-ac", "1",
                "-sample_fmt", "s16",
                wav_file
            ], capture_output=True, text=True)
        )
        
        if process.returncode != 0:
            print(f"FFmpeg Error: {process.stderr}")
            return ""

        # Step 3: Pass converted WAV to Whisper
        result = await asyncio.to_thread(
            MODEL.transcribe, wav_file, task="translate"
        )

        text = result.get("text", "").strip()
        source_lang = result.get("language", "unknown")

        # Step 4: Send transcript_update to frontend
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
        await websocket.send_text(json.dumps(transcript_json))

        # Step 5: Send session_meta once per session
        if session_id not in SESSION_SENT:
            # Clamp logprob to 0-1 range
            confidence = min(max(result.get("avg_logprob", -0.3) + 1, 0), 1)
            await websocket.send_text(json.dumps({
                "type": "session_meta",
                "detectedLang": source_lang,
                "targetLang": "English",
                "confidenceScore": round(confidence, 2),
                "sessionId": session_id
            }))
            SESSION_SENT.add(session_id)

        # Step 6: Pass translated text to Gemini for intent detection
        if text:
            await detect_intent(text, websocket, session_id=session_id)

        return text

    except Exception as e:
        print(f"Whisper Error: {e}")
        return ""

    finally:
        # Step 7: Cleanup temp files
        for f in [webm_file, wav_file]:
            if os.path.exists(f):
                os.remove(f)