from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from typing import Optional, List
from models.schemas import (
    RvcVoiceModel, RvcConnectionConfig, SwitchVoiceRequest,
    UpdateRvcParamsRequest, ParseSshRequest
)
from services.rvc_service import rvc_service
from services.db import db

router = APIRouter(prefix="/api/rvc", tags=["RVC Vast.ai"])

@router.post("/parse-ssh")
async def parse_ssh(req: ParseSshRequest):
    return rvc_service.parse_ssh_command(req.command)

@router.post("/connect")
async def connect_rvc(config: RvcConnectionConfig):
    health = await rvc_service.check_health(config.serverIp, config.localRvcPort)
    config.status = "online" if health["online"] else "offline"
    config.pingMs = health["pingMs"]
    
    settings = await db.get_settings()
    settings["rvcConfig"] = config.model_dump()
    await db.update_settings({"rvcConfig": config.model_dump()})

    return {
        "status": config.status,
        "pingMs": config.pingMs,
        "config": config
    }

@router.get("/health")
async def get_health(ip: str = "127.0.0.1", port: int = 8889):
    health = await rvc_service.check_health(ip, port)
    return health

@router.get("/models", response_model=List[RvcVoiceModel])
async def get_models():
    return rvc_service.get_models()

@router.post("/switch-voice")
async def switch_voice(req: SwitchVoiceRequest):
    res = await rvc_service.switch_voice(
        voice_id=req.voice_id,
        pitch=req.pitch,
        index_rate=req.index_rate,
        protect=req.protect
    )
    # Save active voice to DB settings
    settings = await db.get_settings()
    rvc_settings = settings.get("rvcSettings", {})
    rvc_settings["activeVoiceId"] = req.voice_id
    if req.pitch is not None:
        rvc_settings["pitch"] = req.pitch
    if req.index_rate is not None:
        rvc_settings["indexRate"] = req.index_rate
    if req.protect is not None:
        rvc_settings["protect"] = req.protect
    await db.update_settings({"rvcSettings": rvc_settings})
    
    return res

@router.post("/update-params")
async def update_params(req: UpdateRvcParamsRequest):
    res = rvc_service.update_params(req.pitch, req.index_rate, req.protect)
    settings = await db.get_settings()
    rvc_settings = settings.get("rvcSettings", {})
    rvc_settings["pitch"] = req.pitch
    rvc_settings["indexRate"] = req.index_rate
    rvc_settings["protect"] = req.protect
    await db.update_settings({"rvcSettings": rvc_settings})
    return res

@router.post("/process-sample")
async def process_sample(
    file: Optional[UploadFile] = File(None),
    voice_id: str = Form("voice_male_deep"),
    pitch: int = Form(0),
    index_rate: float = Form(0.75),
    protect: float = Form(0.33)
):
    raw_bytes = await file.read() if file else b""
    processed_audio, latency_ms = await rvc_service.process_sample(
        raw_audio=raw_bytes,
        voice_id=voice_id,
        pitch=pitch,
        index_rate=index_rate,
        protect=protect
    )
    return Response(
        content=processed_audio,
        media_type="audio/wav",
        headers={"X-Processing-Time-Ms": str(latency_ms)}
    )
