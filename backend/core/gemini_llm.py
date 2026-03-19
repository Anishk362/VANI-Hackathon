# backend/core/gemini_llm.py
async def detect_intent(text: str):
    # Fake banking intent detection
    if "locker" in text.lower():
        return {
            "type": "process_trigger",
            "intent": "open_locker",
            "title": "Locker Opening Request",
            "steps": [
                "Verify KYC documents",
                "Check locker availability",
                "Fill Form A-7"
            ],
            "requiredDocs": [
                "Aadhaar Card",
                "PAN Card",
                "Passport Photo"
            ]
        }
    return None