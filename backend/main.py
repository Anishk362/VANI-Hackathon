from fastapi import FastAPI
from api.routes import router as api_router

app = FastAPI(title="V.A.N.I Backend")

# Plug in your routes
app.include_router(api_router, prefix="/api")