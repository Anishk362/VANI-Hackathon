import os
import json
import asyncio
import google.generativeai as genai
from api.prompts import UNION_BANK_SYSTEM_PROMPT
from db.database import SessionLocal
from db.models import Session, Intent

# Configure the SDK
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# Initialize the model with the system instruction once at the module level
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=UNION_BANK_SYSTEM_PROMPT
)

# async def detect_intent(text: str, websocket, session_id="UB-2026-XXXX"):
#     """
#     Sends text to Gemini to detect banking intent and triggers frontend updates.
#     """
#     try:
#         # Run the synchronous SDK call in a separate thread to keep the loop alive
#         response = await asyncio.to_thread(
#             model.generate_content, text
#         )

#         # Parse the JSON response from Gemini
#         # (Assuming the prompt ensures valid JSON formatting)
#         data = json.loads(response.text)
        
#         process_trigger_json = {
#             "type": "process_trigger",
#             "intent": data.get("intent", "unknown"),
#             "title": data.get("title", "Process Update"),
#             "steps": data.get("steps", []),
#             "requiredDocs": data.get("requiredDocs", [])
#         }

#         # Send the JSON payload to the frontend via the active WebSocket
#         await websocket.send_text(json.dumps(process_trigger_json))

#         # Save to Database via a thread-safe helper
#         await asyncio.to_thread(_db_save_intent, session_id, data.get("intent", "unknown"))

#     except Exception as e:
#         print(f"Gemini Intent Detection Error: {e}")

async def detect_intent(text: str, websocket, session_id="UB-2026-XXXX"):
    """
    Sends text to Gemini to detect banking intent and triggers frontend updates.
    """
    try:
        # Run the synchronous SDK call in a separate thread to keep the loop alive
        response = await asyncio.to_thread(
            model.generate_content, text
        )

        # Parse the JSON response from Gemini
        data = json.loads(response.text)
        
        # Extract intent for both the WebSocket and the DB
        detected_intent_value = data.get("intent", "unknown")

        process_trigger_json = {
            "type": "process_trigger",
            "intent": detected_intent_value,
            "title": data.get("title", "Process Update"),
            "steps": data.get("steps", []),
            "requiredDocs": data.get("requiredDocs", [])
        }

        # Send the JSON payload to the frontend via the active WebSocket
        await websocket.send_text(json.dumps(process_trigger_json))

        # FIX 4: Save to Database using the correct 'intent' field name
        await asyncio.to_thread(_db_save_intent, session_id, detected_intent_value)

    except Exception as e:
        print(f"Gemini Intent Detection Error: {e}")



# def _db_save_intent(session_id, intent_name):
#     """Synchronous database helper"""
#     db = SessionLocal()
#     try:
#         db_intent = Intent(session_id=session_id, name=intent_name)
#         db.add(db_intent)
#         db.commit()
#     finally:
#         db.close()

def _db_save_intent(session_id, intent_value):
    """
    Synchronous database helper using the correct field name 'intent'.
    """
    db = SessionLocal()
    try:
        # FIX 4: Changed field name from 'name' to 'intent'
        db_intent = Intent(session_id=session_id, intent=intent_value)
        db.add(db_intent)
        db.commit()
    except Exception as e:
        print(f"Database Save Error: {e}")
        db.rollback()
    finally:
        db.close()

async def handle_generate_summary(msg_json, websocket, session_id="UB-2026-XXXX"):
    """
    Generates a bilingual summary (English and Native/Hindi) and 
    sends it to the frontend with the 'summary_ready' type.
    """
    # Instruct the model to provide both versions in a JSON-parsable format
    prompt = (
        "Based on the conversation, provide a concise summary in two parts: "
        "1. In English. 2. In Hindi (Native). "
        "Return the response as a JSON object with keys 'english' and 'native'."
    )
    
    try:
        # Using the same non-blocking thread pattern from Fix 3
        response = await asyncio.to_thread(model.generate_content, prompt)
        
        # Try to parse the bilingual response
        try:
            res_data = json.loads(response.text)
            english_text = res_data.get("english", "Summary not available.")
            native_text = res_data.get("native", "सारांश उपलब्ध नहीं है।")
        except:
            # Fallback if Gemini returns plain text instead of JSON
            english_text = response.text
            native_text = "विवरण उपलब्ध नहीं है (Hindi translation failed)."

        # FIX 5: Updated response structure for the frontend
        summary_json = {
            "type": "summary_ready",
            "englishSummary": english_text,
            "nativeSummary": native_text
        }
        
        await websocket.send_text(json.dumps(summary_json))
        
    except Exception as e:
        print(f"Summary Generation Error: {e}")