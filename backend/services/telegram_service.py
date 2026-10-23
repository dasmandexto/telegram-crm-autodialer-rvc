import os
import shutil
import zipfile
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from services.spintax_service import SpintaxService
from services.recorder_service import recorder_service
from services.db import db, DATA_DIR
from models.schemas import TemplateMediaAttachment, RecordModeType

SESSIONS_DIR = os.path.join(DATA_DIR, "sessions")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

class TelegramCallSession:
    def __init__(self, call_id: str, target: str, account_id: str, record_mode: RecordModeType, rvc_voice: str, pitch: int):
        self.call_id = call_id
        self.target = target
        self.account_id = account_id
        self.record_mode = record_mode
        self.rvc_voice = rvc_voice
        self.pitch = pitch
        self.status = "calling"
        self.started_at = datetime.now()

class TelegramGatewayService:
    def __init__(self):
        self.active_calls: Dict[str, TelegramCallSession] = {}
        self.clients: Dict[str, Any] = {} # Telethon client instances

    async def initiate_call(
        self,
        target: str,
        account_id: str,
        proxy_url: Optional[str] = None,
        record_mode: Optional[RecordModeType] = "FULL_CALL_MIX",
        voice_id: Optional[str] = "voice_male_deep",
        pitch: Optional[int] = -4
    ) -> Dict[str, Any]:
        call_id = f"call_{int(datetime.now().timestamp())}_{account_id.replace('@', '')}"
        
        session = TelegramCallSession(
            call_id=call_id,
            target=target,
            account_id=account_id,
            record_mode=record_mode or "FULL_CALL_MIX",
            rvc_voice=voice_id or "Male_Deep",
            pitch=pitch if pitch is not None else -4
        )
        self.active_calls[call_id] = session

        # Start call recorder
        recorder_service.start_recording(
            call_id=call_id,
            client_target=target,
            client_name=target,
            mode=record_mode or "FULL_CALL_MIX",
            rvc_voice=voice_id or "Male_Deep",
            pitch=pitch if pitch is not None else -4
        )

        # Increment callsToday for account in db
        accounts = await db.get_accounts()
        for acc in accounts:
            if acc["id"] == account_id or acc["username"] == account_id:
                acc["callsToday"] = acc.get("callsToday", 0) + 1
                break
        await db.save_accounts(accounts)

        return {
            "status": "calling",
            "call_id": call_id,
            "target": target,
            "account": account_id,
            "proxy_used": proxy_url,
            "record_mode": record_mode
        }

    async def hangup_call(self, call_id: str) -> Dict[str, Any]:
        session = self.active_calls.pop(call_id, None)
        rec_data = await recorder_service.stop_recording(call_id)
        
        return {
            "status": "terminated",
            "call_id": call_id,
            "recording": rec_data
        }

    async def send_message(
        self,
        target: str,
        text: str,
        account_id: str,
        template_title: Optional[str] = None,
        media_attachment: Optional[TemplateMediaAttachment] = None
    ) -> Dict[str, Any]:
        # 1. Unfold Spintax
        spun_text = SpintaxService.spin(text)
        
        # 2. Check if we have an active Telethon client for this account
        # (In production, client.send_message / client.send_file is executed here)
        media_type = media_attachment.type if media_attachment else "none"
        media_url = media_attachment.url if media_attachment else None
        
        # Simulated send delay
        await asyncio.sleep(0.3)

        return {
            "success": True,
            "target": target,
            "account_id": account_id,
            "spun_text": spun_text,
            "template_title": template_title,
            "media_type": media_type,
            "media_url": media_url,
            "sent_at": datetime.now().strftime("%H:%M:%S")
        }

    async def save_uploaded_account(self, file_content: bytes, filename: str, daily_limit: int) -> Dict[str, Any]:
        dest_path = os.path.join(SESSIONS_DIR, filename)
        with open(dest_path, "wb") as f:
            f.write(file_content)

        is_tdata = "tdata" in filename.lower() or filename.endswith(".zip")
        if is_tdata and filename.endswith(".zip"):
            extract_dir = os.path.join(SESSIONS_DIR, f"tdata_{os.path.splitext(filename)[0]}")
            try:
                with zipfile.ZipFile(dest_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
            except Exception:
                pass

        account_id = f"acc-{int(datetime.now().timestamp())}"
        suffix = int(datetime.now().timestamp() % 899 + 100)
        phone = f"+7 999 710-{suffix}"
        username = f"@tele_dial_{suffix}"

        new_account = {
            "id": account_id,
            "phone": phone,
            "username": username,
            "displayName": f"TData Auth #{suffix}" if is_tdata else f"Session Auth #{suffix}",
            "avatarColor": "bg-emerald-600",
            "dailyCallLimit": daily_limit,
            "callsToday": 0,
            "status": "active",
            "proxy": "SOCKS5: 185.122.90.14:1080 (RU)",
            "sessionFile": filename,
        }

        await db.add_account(new_account)
        return new_account

telegram_gateway = TelegramGatewayService()
