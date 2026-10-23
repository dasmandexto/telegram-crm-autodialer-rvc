import asyncio
from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional, Dict, Any
from models.schemas import (
    Contact, MessageTemplate, CallReminder, InboxEvent,
    CallHistoryRecord, ClientStatusDefinition
)
from services.db import db
from services.sheets_service import sheets_service

router = APIRouter(prefix="/api", tags=["CRM"])

# Contacts
@router.get("/contacts", response_model=List[Contact])
async def get_contacts():
    return await db.get_contacts()

@router.post("/contacts")
async def save_contacts(contacts: List[Contact]):
    await db.save_contacts([c.model_dump() for c in contacts])
    return {"status": "saved", "count": len(contacts)}

# Templates
@router.get("/templates", response_model=List[MessageTemplate])
async def get_templates():
    return await db.get_templates()

@router.post("/templates")
async def save_template(tpl: MessageTemplate):
    await db.save_template(tpl.model_dump())
    return {"status": "saved", "template": tpl}

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    success = await db.delete_template(template_id)
    return {"status": "deleted" if success else "not_found", "id": template_id}

# Reminders
@router.get("/reminders", response_model=List[CallReminder])
async def get_reminders():
    return await db.get_reminders()

@router.post("/reminders")
async def save_reminder(reminder: CallReminder):
    await db.save_reminder(reminder.model_dump())
    return {"status": "saved", "reminder": reminder}

# Inbox
@router.get("/inbox", response_model=List[InboxEvent])
async def get_inbox():
    return await db.get_inbox()

@router.post("/inbox/mark-read")
async def mark_inbox_read(payload: dict):
    event_id = payload.get("id", "")
    await db.mark_inbox_read(event_id)
    return {"status": "read", "id": event_id}

# History
@router.get("/history", response_model=List[CallHistoryRecord])
async def get_history():
    return await db.get_history()

@router.post("/history")
async def add_history_record(record: CallHistoryRecord):
    rec_dict = record.model_dump()
    await db.add_history_record(rec_dict)
    
    # Check Google Sheets auto-sync
    settings = await db.get_settings()
    gs_config = settings.get("googleSheets", {})
    if gs_config.get("autoSyncOnCallFinish") and gs_config.get("webhookUrl"):
        asyncio.create_task(sheets_service.sync_to_webhook(gs_config["webhookUrl"], rec_dict))

    return {"status": "saved", "id": record.id}

# Client Statuses & Groups
@router.get("/client-statuses", response_model=List[ClientStatusDefinition])
async def get_client_statuses():
    return await db.get_client_statuses()

@router.post("/client-statuses")
async def save_client_statuses(statuses: List[ClientStatusDefinition]):
    await db.save_client_statuses([s.model_dump() for s in statuses])
    return {"status": "saved", "count": len(statuses)}

# Google Sheets CSV Export
@router.get("/export/csv")
async def export_csv(status_id: Optional[str] = Query(None)):
    history = await db.get_history()
    csv_content = sheets_service.generate_csv(history, filter_status_id=status_id)
    filename = f"teledial_leads_{status_id or 'all'}.csv"
    
    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# Settings
@router.get("/settings")
async def get_settings():
    return await db.get_settings()

@router.post("/settings")
async def update_settings(updates: Dict[str, Any]):
    await db.update_settings(updates)
    return {"status": "updated"}
