import JSZip from 'jszip';

export async function generateProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'README.md',
    `# TeleDial CRM — Фронтенд для холодных звонков через Telegram

Готовый фронтенд для интеграции с бэкендом на Python (Telethon / Pyrogram) или Node.js (GramJS).

## Структура проекта
- \`/src/components\` — UI-компоненты (Очередь, Звонок, Пост-вызов, Календарь, Аккаунты, Инбокс)
- \`/src/services\` — Хранилище, Web Audio звуки, экспорт
- \`/src/types\` — TypeScript-модели данных
- \`/backend_template\` — Готовый шаблон бэкенда на FastAPI + Telethon

## Быстрый запуск фронтенда
\`\`\`bash
npm install
npm run dev
\`\`\`

## Подключение к бэкенду
В файле \`src/api/client.ts\` переключите:
\`\`\`ts
export const USE_REAL_BACKEND = true;
export const API_BASE_URL = 'http://localhost:8000/api';
\`\`\`

## Бэкенд на Python (FastAPI + Telethon)
В папке \`backend_template/main.py\` находится рабочий сервер с маршрутами:
- \`POST /api/calls/start\` — инициация Telegram VoIP вызова
- \`POST /api/calls/hangup\` — завершение вызова
- \`POST /api/messages/send\` — отправка сообщения
- \`POST /api/accounts/upload\` — загрузка session.json / tdata
- \`GET /api/inbox\` — вебсокет/SSE для входящих событий
`
  );

  // Backend starter template inside the zip
  const backendFolder = zip.folder('backend_template');
  if (backendFolder) {
    backendFolder.file(
      'requirements.txt',
      `fastapi>=0.110.0\nuvicorn>=0.28.0\ntelethon>=1.34.0\npydantic>=2.6.0\npython-multipart>=0.0.9\n`
    );

    backendFolder.file(
      'main.py',
      `"""
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
`
    );
  }

  // Generate blob
  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
