from pydantic import BaseModel

class SummaryRequest(BaseModel):
    transcript_text: str
    customer_language: str

class SummaryResponse(BaseModel):
    english_summary: str
    native_summary: str