from fastapi import APIRouter, HTTPException
from models.schemas import SendMessageRequest
from services.telegram_service import telegram_gateway
from services.spintax_service import SpintaxService

router = APIRouter(prefix="/api/messages", tags=["Messages"])

@router.post("/send")
async def send_message(req: SendMessageRequest):
    result = await telegram_gateway.send_message(
        target=req.target,
        text=req.text,
        account_id=req.account_id,
        template_title=req.template_title,
        media_attachment=req.media_attachment
    )
    return result

@router.post("/spintax/preview")
async def preview_spintax(payload: dict):
    text = payload.get("text", "")
    spun = SpintaxService.spin(text)
    combinations = SpintaxService.count_combinations(text)
    return {
        "spunText": spun,
        "combinationsCount": combinations
    }
