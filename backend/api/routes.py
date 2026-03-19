from fastapi import APIRouter, HTTPException, Response
from .schemas import GenerateSummaryRequest

router = APIRouter()

# ---------------------------------------------------------
# ENDPOINT 1: Tablet Session Check
# Frontend calls this to check if a session is active
# ---------------------------------------------------------
@router.get("/session/{session_id}")
async def get_session_status(session_id: str):
    # TODO: In the next step, we will query the SQLite database here.
    # For now, we return a safe mock response so Abhinav's UI doesn't crash.
    
    # Simulating a check. If it was real, we'd look up session_id in the DB.
    if session_id == "test-session":
        return {"status": "active", "language": "hi"}
    
    # Anish explicitly requested this 404-safe response format
    return {"status": "not_found", "language": ""}

# ---------------------------------------------------------
# ENDPOINT 2: Generate Summary & PDF
# Staff dashboard calls this when they click "Generate Summary"
# ---------------------------------------------------------
@router.post("/generate-summary")
async def generate_summary_pdf(request: GenerateSummaryRequest):
    # The frontend is sending us the session_id in the request body
    current_session = request.session_id
    
    # TODO 1: Fetch the full transcript from the SQLite database using current_session
    # TODO 2: Pass that transcript to Gemini using your prompt from prompts.py
    # TODO 3: Save the English/Native summaries back to the database
    # TODO 4: Convert the summaries into a PDF file
    
    # For right now, we will return a "mock" PDF blob so the frontend 
    # can test its download logic without crashing.
    mock_pdf_bytes = b"%PDF-1.4\n%Mock PDF Content for Testing\n"
    
    return Response(
        content=mock_pdf_bytes, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=summary_{current_session}.pdf"}
    )