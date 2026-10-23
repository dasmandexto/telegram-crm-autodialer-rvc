import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from routers import calls, accounts, messages, rvc, recordings, crm, websocket
from services.db import DATA_DIR

app = FastAPI(
    title="TeleDial RVC CRM",
    description="Unified Telegram Cold Calling & Real-Time RVC Voice Conversion System",
    version="2.0.0"
)

# Enable CORS for cross-origin or local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(calls.router)
app.include_router(accounts.router)
app.include_router(messages.router)
app.include_router(rvc.router)
app.include_router(recordings.router)
app.include_router(crm.router)
app.include_router(websocket.router)

# Static files for uploaded template media and recordings
uploads_dir = os.path.join(DATA_DIR, "uploads")
recordings_dir = os.path.join(DATA_DIR, "recordings")
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(recordings_dir, exist_ok=True)

app.mount("/static/uploads", StaticFiles(directory=uploads_dir), name="uploads")
app.mount("/static/recordings", StaticFiles(directory=recordings_dir), name="recordings")

# Frontend Single-Port Unified Serving (dist/)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="frontend-assets")

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "TeleDial RVC CRM Unified Engine",
        "version": "2.0.0",
        "rvc_pipeline": "online",
        "telegram_mtproto": "ready",
        "proxy_rotation": "enabled",
        "frontend_embedded": os.path.exists(os.path.join(DIST_DIR, "index.html"))
    }

# SPA Fallback: All non-API routes serve frontend index.html
@app.get("/{full_path:path}")
async def serve_spa(full_path: str, request: Request):
    index_file = os.path.join(DIST_DIR, "index.html")
    # If API or static route was requested but not found, return 404 JSON
    if full_path.startswith("api/") or full_path.startswith("static/") or full_path == "api":
        return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
    
    # Check if a static file in dist root exists (e.g. favicon, vite.svg)
    file_candidate = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.isfile(file_candidate):
        return FileResponse(file_candidate)

    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return JSONResponse({
        "message": "TeleDial CRM Backend is running.",
        "note": "Frontend dist/ not built yet. Run 'npm run build' to embed the React UI."
    })

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
