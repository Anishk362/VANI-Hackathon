import os
import json
import asyncio
import google.generativeai as genai
from api.prompts import UNION_BANK_SYSTEM_PROMPT
from db.database import SessionLocal
from db.models import Intent

# Configure Gemini
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=UNION_BANK_SYSTEM_PROMPT
)

async def detect_intent(text: str, websocket, session_id="UB-2026-XXXX"):
    """
    FIX 4: Detects intent and saves to DB using the 'intent' field.
    """
    if not text: return

    try:
        response = await asyncio.to_thread(model.generate_content, text)
        data = json.loads(response.text)
        detected_intent_value = data.get("intent", "unknown")

        process_trigger_json = {
            "type": "process_trigger",
            "intent": detected_intent_value,
            "title": data.get("title", "Process Update"),
            "steps": data.get("steps", []),
            "requiredDocs": data.get("requiredDocs", [])
        }

        await websocket.send_text(json.dumps(process_trigger_json))
        await asyncio.to_thread(_db_save_intent, session_id, detected_intent_value)

    except Exception as e:
        print(f"Intent Detection Error: {e}")

async def handle_generate_summary(websocket, session_id="UB-2026-XXXX"):
    """
    FIX 5: Bilingual summary generation.
    """
    prompt = ("Provide a summary of the conversation in JSON: "
              "{'english': '...', 'native': '...'}. Use Hindi for native.")
    
    try:
        response = await asyncio.to_thread(
            model.generate_content, 
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        res_data = json.loads(response.text)
        
        await websocket.send_text(json.dumps({
            "type": "summary_ready",
            "englishSummary": res_data.get("english", ""),
            "nativeSummary": res_data.get("native", "")
        }))
    except Exception as e:
        print(f"Summary Error: {e}")

def _db_save_intent(session_id, intent_value):
    """DB Helper - matches 'intent' field name."""
    db = SessionLocal()
    try:
        db_intent = Intent(session_id=session_id, intent=intent_value)
        db.add(db_intent)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"DB Error: {e}")
    finally:
        db.close()