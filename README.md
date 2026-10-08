# Secure Messaging Platform (Signal Clone)

## Overview
This is a functional clone of the Signal messaging application, focusing on recreating the UI, UX, and core messaging workflows. The project is split into a Next.js (TypeScript) frontend and a FastAPI (Python) backend.

## Tech Stack
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, SQLite, SQLAlchemy
- **Real-time:** WebSockets

## How to run Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize and seed the database:
   ```bash
   python -m app.seed
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be available at http://localhost:8000 and the `/health` endpoint at http://localhost:8000/health.

## How to run Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:3000.

## Current Implementation Status
- **Phase 1 (Project Foundation):** Completed. Frontend and Backend projects initialized, database models created, seed script created, health endpoint verified.

## Demo Login Data
- **Username:** `alice` (OTP: `123456`)
- **Username:** `bob` (OTP: `123456`)
- **Username:** `charlie` (OTP: `123456`)
