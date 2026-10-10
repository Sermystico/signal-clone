from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine

# Create the database tables and auto-seed if empty
models.Base.metadata.create_all(bind=engine)
try:
    from .seed import seed_db
    seed_db()
except Exception as e:
    print(f"Auto-seed note: {e}")

app = FastAPI(title="Signal Clone API")

# Allow CORS for all frontend origins (Vercel production, preview branches, and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import auth, users, contacts, conversations, messages, ws, search
import os
from fastapi.staticfiles import StaticFiles

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(contacts.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(ws.router)
app.include_router(search.router)

@app.get("/")
def root():
    return {"message": "Signal Clone Backend API is running", "docs": "/docs", "health": "/health"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is up and running"}
