import os
import io
import wave
import math
import zipfile
from datetime import datetime
from typing import Dict, Any, List, Optional
from models.schemas import RecordModeType, SavedCallRecording
from services.db import db, DATA_DIR

RECORDINGS_DIR = os.path.join(DATA_DIR, "recordings")
os.makedirs(RECORDINGS_DIR, exist_ok=True)

class RecorderBackendService:
    def __init__(self):
        self.active_recordings: Dict[str, Dict[str, Any]] = {}

    def start_recording(self, call_id: str, client_target: str, client_name: str, mode: RecordModeType, rvc_voice: str, pitch: int):
        self.active_recordings[call_id] = {
            "call_id": call_id,
            "client_target": client_target,
            "client_name": client_name,
            "mode": mode,
            "rvc_voice": rvc_voice,
            "pitch": pitch,
            "start_time": datetime.now(),
        }

    async def stop_recording(self, call_id: str) -> Optional[Dict[str, Any]]:
        record_info = self.active_recordings.pop(call_id, None)
        duration_sec = 45 # default duration if not tracked
        now = datetime.now()
        
        if record_info:
            duration_sec = max(1, int((now - record_info["start_time"]).total_seconds()))
            client_target = record_info["client_target"]
            client_name = record_info["client_name"]
            mode = record_info["mode"]
            rvc_voice = record_info["rvc_voice"]
            pitch = record_info["pitch"]
        else:
            client_target = "Unknown"
            client_name = "Абонент"
            mode = "FULL_CALL_MIX"
            rvc_voice = "Male_Deep"
            pitch = 0

        rec_id = f"rec-{int(now.timestamp())}"
        date_time_str = now.strftime("%Y-%m-%d %H:%M")
        
        # Create audio file on disk
        file_path = os.path.join(RECORDINGS_DIR, f"{rec_id}.wav")
        self._generate_wav_file(file_path, duration_sec, mode, pitch)
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else duration_sec * 32000

        record_data = {
            "id": rec_id,
            "callId": call_id,
            "title": f"Запись: {client_name or client_target}",
            "clientTarget": client_target,
            "clientName": client_name,
            "dateTime": date_time_str,
            "durationSeconds": duration_sec,
            "mode": mode,
            "rvcVoiceName": rvc_voice,
            "rvcPitch": pitch,
            "audioBlobUrl": f"/api/recordings/{rec_id}/download",
            "fileSizeBytes": file_size,
        }

        await db.add_recording(record_data)
        return record_data

    def _generate_wav_file(self, file_path: str, duration_sec: int, mode: RecordModeType, pitch: int):
        sample_rate = 16000
        total_samples = int(sample_rate * min(duration_sec, 60)) # cap at 60s for mock audio file size
        channels = 1 if mode != "MULTI_TRACK_STEMS" else 2
        
        with wave.open(file_path, 'wb') as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            
            audio_bytes = bytearray()
            freq_base = 260.0 * (2.0 ** (pitch / 12.0))
            
            for i in range(total_samples):
                t = i / sample_rate
                # speech simulation pulse
                cadence = math.sin(2.0 * math.pi * 3.0 * t) # cadence of words
                if cadence > 0.1:
                    val = math.sin(2.0 * math.pi * freq_base * t) * 0.3
                else:
                    val = 0.0
                sample = int(val * 16000)
                sample = max(-32767, min(32767, sample))
                audio_bytes.extend(sample.to_bytes(2, byteorder='little', signed=True))
                if channels == 2:
                    # Stem 2
                    stem2 = int(sample * 0.8)
                    audio_bytes.extend(stem2.to_bytes(2, byteorder='little', signed=True))
                    
            wf.writeframes(bytes(audio_bytes))

    def get_recording_file_path(self, rec_id: str) -> Optional[str]:
        path = os.path.join(RECORDINGS_DIR, f"{rec_id}.wav")
        if os.path.exists(path):
            return path
        # Try stems zip
        zip_path = os.path.join(RECORDINGS_DIR, f"{rec_id}_stems.zip")
        if os.path.exists(zip_path):
            return zip_path
        return None

recorder_service = RecorderBackendService()
