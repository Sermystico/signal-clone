from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Signal Clone API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # For local development frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import auth
app.include_router(auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is up and running"}
