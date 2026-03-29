import os
import json
import asyncio
from dotenv import load_dotenv          
load_dotenv()
from google import genai
from google.genai import types
from api.prompts import UNION_BANK_SYSTEM_PROMPT  # noqa: E402
from db.database import SessionLocal               # noqa: E402
from db.models import Intent                       # noqa: E402

# ── Gemini key pool ────────────────────────────────────────────────────────────
# Add teammate keys to .env as:
#   GOOGLE_API_KEY_1=AIza...   ← your key
#   GOOGLE_API_KEY_2=AIza...   ← teammate 2
#   GOOGLE_API_KEY_3=AIza...   ← teammate 3  (add as many as you have)
#
# Falls back to GOOGLE_API_KEY if the numbered ones aren't present.
# ───────────────────────────────────────────────────────────────────────────────
def _build_key_pool() -> list:
    keys = []
    # Collect numbered keys first
    for i in range(1, 20):
        k = os.environ.get(f"GOOGLE_API_KEY_{i}")
        if k:
            keys.append(k)
    # Always include the legacy GOOGLE_API_KEY as a fallback
    fallback = os.environ.get("GOOGLE_API_KEY")
    if fallback and fallback not in keys:
        keys.append(fallback)
    if not keys:
        raise RuntimeError("No Gemini API keys found in environment")
    return keys

_KEY_POOL = _build_key_pool()
_CLIENT_POOL = [genai.Client(api_key=k) for k in _KEY_POOL]
_current_key_index = 0

def _get_client() -> genai.Client:
    """Return the current client in the rotation."""
    return _CLIENT_POOL[_current_key_index % len(_CLIENT_POOL)]

def _rotate_key() -> genai.Client:
    """Advance to the next key and return the new client."""
    global _current_key_index
    _current_key_index = (_current_key_index + 1) % len(_CLIENT_POOL)
    next_idx = _current_key_index
    print(f"[Gemini] Rotated to key #{next_idx + 1} of {len(_CLIENT_POOL)}")
    return _CLIENT_POOL[next_idx]

async def _call_gemini(contents: str, config: types.GenerateContentConfig) -> str:
    """
    Call Gemini with automatic key rotation on rate-limit errors.
    Tries every key in the pool before giving up.
    Returns the raw response text.
    """
    total_keys = len(_CLIENT_POOL)
    for attempt in range(total_keys):
        client = _get_client()
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.5-flash",
                contents=contents,
                config=config,
            )
            return response.text.strip()
        except Exception as e:
            err = str(e)
            if "429" in err or "quota" in err.lower() or "rate" in err.lower() or "exhausted" in err.lower():
                if attempt < total_keys - 1:
                    next_client = _rotate_key()
                    print(f"[Gemini] Rate limited on key #{attempt + 1} — rotating (waiting 3s)...")
                    await asyncio.sleep(3)  # wait before retrying so quota can reset
                    _ = next_client
                else:
                    print(f"[Gemini] All {total_keys} key(s) rate-limited. Giving up.")
                    raise
            else:
                raise  # non-rate-limit error — propagate immediately

# Throttler to prevent spamming Gemini while waiting for a valid intent.
import time
_LAST_GEMINI_CALL: dict[str, float] = {}

async def detect_intent(text: str, manager, session_id="UB-2026-XXXX"):
    """
    Detects banking intent from transcribed text and updates frontend + DB.
    Uses key rotation so a single key hitting its quota doesn't block.
    Skips the call entirely if intent was already detected for this session.
    """
    if not text:
        return

    # Throttle: Max 1 call per 10 seconds per session
    now = time.time()
    last_call = _LAST_GEMINI_CALL.get(session_id, 0.0)
    if now - last_call < 10.0:
        print(f"[Gemini] Throttling call for {session_id} (wait {(10.0 - (now - last_call)):.1f}s)")
        return
    _LAST_GEMINI_CALL[session_id] = now

    # Skip very short utterances (greetings, filler words) — they waste quota
    if len(text.split()) < 5:
        print(f"[Gemini] Text too short ({len(text.split())} words) — skipping intent detection")
        return

    try:
        raw = await _call_gemini(
            contents=text,
            config=types.GenerateContentConfig(system_instruction=UNION_BANK_SYSTEM_PROMPT),
        )
        raw = raw.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)
        detected_intent_value = data.get("intent", "unknown")
        
        # Only broadcast if a valid banking intent was dynamically generated
        if not detected_intent_value or detected_intent_value.lower() == "unknown":
            return

        await manager.broadcast(json.dumps({
            "type": "process_trigger",
            "intent": detected_intent_value,
            "title": data.get("title", "Process Update"),
            "steps": data.get("steps", []),
            "requiredDocs": data.get("requiredDocs", [])
        }))
        await asyncio.to_thread(_db_save_intent, str(session_id), str(detected_intent_value))

    except Exception as e:
        print(f"[Gemini] Intent Detection failed: {e}")


async def handle_generate_summary(msg_json, websocket, session_id="UB-2026-XXXX"):
    """
    Generates bilingual summary using the key pool.
    """
    prompt = ("Provide a summary of the conversation in JSON: "
              "{'english': '...', 'native': '...'}. Use Hindi for native.")

    try:
        raw = await _call_gemini(
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=UNION_BANK_SYSTEM_PROMPT,
                response_mime_type="application/json"
            ),
        )
        raw = raw.replace("```json", "").replace("```", "").strip()
        res_data = json.loads(raw)

        await websocket.send_text(json.dumps({
            "type": "summary_ready",
            "englishSummary": res_data.get("english", ""),
            "nativeSummary": res_data.get("native", "")
        }))
    except Exception as e:
        print(f"[Gemini] Summary Error: {e}")


def _db_save_intent(session_id: str, intent_value: str) -> None:
    """Synchronous DB Helper - matches 'intent' field name."""
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
