# backend/core/gemini_llm.py
import asyncio
import json
from api.prompts import UNION_BANK_SYSTEM_PROMPT
from db.database import SessionLocal
from db.models import Session, Intent
from google.generativeai import Client

# Initialize Gemini client
gemini_client = Client()  # make sure GOOGLE_API_KEY is set in env

async def detect_intent(text: str, websocket, session_id="UB-2026-XXXX"):
    """Send translated text to Gemini and send process_trigger over WebSocket"""
    response = gemini_client.chat(
        model="gemini-1.5",
        prompt=f"{UNION_BANK_SYSTEM_PROMPT}\nUser said: {text}",
        temperature=0.0
    )

    # Extract JSON output from Gemini
    try:
        data = json.loads(response.text)
    except Exception:
        return  # ignore invalid response

    # Expected format: { "intent": "...", "title": "...", "steps": [...], "requiredDocs": [...] }
    process_trigger_json = {
        "type": "process_trigger",
        "intent": data.get("intent", ""),
        "title": data.get("title", ""),
        "steps": data.get("steps", []),
        "requiredDocs": data.get("requiredDocs", [])
    }

    await websocket.send(json.dumps(process_trigger_json))

    # Save intent in DB
    db = SessionLocal()
    db_intent = Intent(session_id=session_id, name=data.get("intent", "unknown"))
    db.add(db_intent)
    db.commit()
    db.close()

async def handle_generate_summary(msg_json, websocket, session_id="UB-2026-XXXX"):
    """Handle generate_summary message from frontend"""
    db = SessionLocal()
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        session = Session(id=session_id)
        db.add(session)
        db.commit()

    # For simplicity, generate a mock summary (replace with actual summarization logic)
    summary_text = f"Summary for session {session_id}..."
    summary_json = {
        "type": "generate_summary",
        "data": {
            "sessionId": session_id,
            "summary": summary_text
        }
    }
    await websocket.send(json.dumps(summary_json))
    db.close()