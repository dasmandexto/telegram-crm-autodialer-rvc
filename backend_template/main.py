"""
TeleDial CRM Backend Integration Example
FastAPI + Telethon VoIP Calls
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import os

app = FastAPI(title="TeleDial Telegram Calls API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CallRequest(BaseModel):
    target: str
    account_id: str
    proxy_url: str | None = None

class MessageRequest(BaseModel):
    target: str
    text: str
    account_id: str

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "TeleDial Telegram Gateway", "proxy_rotation": "enabled"}

@app.post("/api/calls/start")
async def start_call(req: CallRequest):
    # При звонке Telethon подключается через переданный прокси:
    # client = TelegramClient(session_file, api_id, api_hash, proxy=parse_proxy(req.proxy_url))
    return {
        "status": "calling",
        "call_id": f"call_{req.target}_{req.account_id}",
        "target": req.target,
        "account": req.account_id,
        "proxy_used": req.proxy_url
    }

@app.post("/api/calls/hangup")
async def hangup_call(call_id: str):
    return {"status": "terminated", "call_id": call_id}

@app.post("/api/messages/send")
async def send_message(req: MessageRequest):
    # telethon client.send_message(req.target, req.text)
    return {"status": "sent", "target": req.target}

@app.post("/api/accounts/upload")
async def upload_account(file: UploadFile = File(...), daily_limit: int = Form(35)):
    # Сохранение .session или распаковка TData
    filename = file.filename
    return {
        "status": "success",
        "filename": filename,
        "daily_limit": daily_limit,
        "message": "Аккаунт успешно авторизован"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
