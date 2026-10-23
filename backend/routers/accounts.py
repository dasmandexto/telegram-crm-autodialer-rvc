from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from models.schemas import TelegramAccount
from services.db import db
from services.telegram_service import telegram_gateway

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

@router.get("", response_model=List[TelegramAccount])
async def get_accounts():
    accounts = await db.get_accounts()
    return accounts

@router.post("/upload")
async def upload_account(file: UploadFile = File(...), daily_limit: int = Form(35)):
    contents = await file.read()
    new_account = await telegram_gateway.save_uploaded_account(
        file_content=contents,
        filename=file.filename or "session.session",
        daily_limit=daily_limit
    )
    return new_account
