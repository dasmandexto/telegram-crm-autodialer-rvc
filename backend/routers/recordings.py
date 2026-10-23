import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from models.schemas import SavedCallRecording
from services.db import db
from services.recorder_service import recorder_service

router = APIRouter(prefix="/api/recordings", tags=["Recordings"])

@router.get("", response_model=List[SavedCallRecording])
async def get_recordings():
    return await db.get_recordings()

@router.get("/{rec_id}/download")
async def download_recording(rec_id: str):
    file_path = recorder_service.get_recording_file_path(rec_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл записи не найден")
    
    media_type = "application/zip" if file_path.endswith(".zip") else "audio/wav"
    return FileResponse(path=file_path, media_type=media_type, filename=os.path.basename(file_path))

@router.delete("/{rec_id}")
async def delete_recording(rec_id: str):
    success = await db.delete_recording(rec_id)
    file_path = recorder_service.get_recording_file_path(rec_id)
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
    return {"success": success, "id": rec_id}
