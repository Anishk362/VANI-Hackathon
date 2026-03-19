from pydantic import BaseModel
from typing import List, Literal

class TranscriptLine(BaseModel):
    id: str
    sender: Literal["customer", "officer"]
    originalText: str
    translatedText: str
    originalLang: str
    targetLang: str
    timestamp: str

class ProcessTrigger(BaseModel):
    type: Literal["process_trigger"] = "process_trigger"
    intent: str
    title: str
    steps: List[str]
    requiredDocs: List[str]

class SessionMeta(BaseModel):
    type: Literal["session_meta"] = "session_meta"
    detectedLang: str
    targetLang: str
    confidenceScore: float
    sessionId: str

class SummaryReady(BaseModel):
    type: Literal["summary_ready"] = "summary_ready"
    englishSummary: str
    nativeSummary: str

# Request model for the POST endpoint Anish mentioned
class GenerateSummaryRequest(BaseModel):
    session_id: str