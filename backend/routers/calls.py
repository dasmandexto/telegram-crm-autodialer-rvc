from fastapi import APIRouter, HTTPException
from models.schemas import StartCallRequest, HangupCallRequest
from services.telegram_service import telegram_gateway

router = APIRouter(prefix="/api/calls", tags=["Calls"])

@router.post("/start")
async def start_call(req: StartCallRequest):
    result = await telegram_gateway.initiate_call(
        target=req.target,
        account_id=req.account_id,
        proxy_url=req.proxy_url,
        record_mode=req.record_mode,
        voice_id=req.voice_id,
        pitch=req.pitch
    )
    return {
        "callId": result["call_id"],
        "call_id": result["call_id"],
        "status": result["status"],
        "target": result["target"],
        "account": result["account"],
        "proxy_used": result["proxy_used"],
        "record_mode": result["record_mode"]
    }

@router.post("/hangup")
async def hangup_call(req: HangupCallRequest):
    res = await telegram_gateway.hangup_call(req.call_id)
    return res
