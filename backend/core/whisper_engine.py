# backend/core/whisper_engine.py
import uuid
from datetime import datetime

async def process_audio(buffer, language):
    # Fake Whisper output for testing
    original_text = "मुझे लॉकर खोलना है"
    translated_text = "I want to open a locker"

    return {
        "translated_text": translated_text,
        "transcript": {
            "type": "transcript_update",
            "data": {
                "id": str(uuid.uuid4()),
                "sender": "customer",
                "originalText": original_text,
                "translatedText": translated_text,
                "originalLang": "Hindi",
                "targetLang": "English",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    }