from fastapi import APIRouter
from .schemas import SummaryRequest, SummaryResponse

router = APIRouter()

@router.post("/generate-summary", response_model=SummaryResponse)
async def generate_interaction_summary(request: SummaryRequest):
    # TODO: Connect to Gemini LLM here later to actually process the text

    # For now, return mock data so Abhinav can test his frontend
    return SummaryResponse(
        english_summary="Mock English CRM Summary based on: " + request.transcript_text,
        native_summary="Mock Native Summary in " + request.customer_language
    )