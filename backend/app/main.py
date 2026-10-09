from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Signal Clone API")

import os
allowed_origins_str = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import auth, users, contacts, conversations, messages, ws
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
from .routers import search
app.include_router(search.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is up and running"}
