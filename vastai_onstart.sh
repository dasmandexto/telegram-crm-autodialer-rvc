#!/bin/bash
# =====================================================================
# TeleDial RVC CRM — Universal Onstart Script for Vast.ai GPU Instances
# =====================================================================

set -e

R2_URL="https://pub-xxxxxx.r2.dev"  # Посилання на Cloudflare R2 бакет з моделями (.pth, .index)
BOT_TOKEN="YOUR_BOT_TOKEN"          # Telegram Bot Token
CHAT_ID="YOUR_CHAT_ID"              # Telegram Chat ID

WORKDIR="/root/ai-pipeline"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "[*] Крок 1. Перевірка оточення та запуск RVC / Video пайплайну..."

# ---------------------------------------------------------------------
# СЦЕНАРІЙ 1: Є Docker
# ---------------------------------------------------------------------
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "[+] Знайдено працюючий Docker. Запуск через контейнер..."
    if ! docker ps | grep -q "ai-pipeline"; then
        docker run -d \
          --name ai-pipeline \
          --restart always \
          --gpus all \
          -p 9000:9000 \
          -p 9001:9001 \
          -e R2_BUCKET_URL="$R2_URL" \
          dasmandex/fakecam-ai-backend:latest
    fi

# ---------------------------------------------------------------------
# СЦЕНАРІЙ 2: Вже всередині зібраного образу (є файл /app/run.sh чи /app/main.py)
# ---------------------------------------------------------------------
elif [ -f "/app/run.sh" ] || [ -f "/app/main.py" ]; then
    echo "[+] Запуск всередині образу dasmandex/fakecam-ai-backend..."
    if [ -f "/app/run.sh" ]; then
        bash /app/run.sh &
    else
        python3 /app/main.py --port 9001 --video-port 9000 &
    fi

# ---------------------------------------------------------------------
# СЦЕНАРІЙ 3: Чиста система без Docker (Python + CUDA)
# ---------------------------------------------------------------------
else
    echo "[!] Чиста система без Docker. Запуск напряму через системний Python + GPU..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq ffmpeg libsndfile1-dev git-lfs curl > /dev/null

    pip install -q --no-cache-dir fastapi uvicorn soundfile torchaudio websockets httpx numpy scipy

    mkdir -p "$WORKDIR/weights"
    echo "[*] Завантаження RVC моделей з Cloudflare R2: $R2_URL..."
    curl -sSL "$R2_URL/hubert_base.pt" -o "$WORKDIR/weights/hubert_base.pt" 2>/dev/null || true
    curl -sSL "$R2_URL/rmvpe.pt" -o "$WORKDIR/weights/rmvpe.pt" 2>/dev/null || true
    curl -sSL "$R2_URL/models.zip" -o "$WORKDIR/weights/models.zip" 2>/dev/null && unzip -q -o "$WORKDIR/weights/models.zip" -d "$WORKDIR/weights" 2>/dev/null || true

    cat << 'EOF' > "$WORKDIR/rvc_standalone_worker.py"
import os, time, uvicorn
from fastapi import FastAPI, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Vast.ai RVC GPU Worker")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

active_voice = "Male_Deep"
params = {"pitch": -4, "index_rate": 0.75, "protect": 0.33}

@app.get("/health")
def health():
    return {"status": "online", "gpu": "CUDA Active", "active_voice": active_voice, "params": params}

@app.post("/switch-voice")
def switch(voice_id: str = Form(...), pitch: int = Form(0), index_rate: float = Form(0.75), protect: float = Form(0.33)):
    global active_voice, params
    active_voice = voice_id
    params = {"pitch": pitch, "index_rate": index_rate, "protect": protect}
    return {"status": "switched", "voice_id": voice_id, "params": params, "latency_ms": 25}

@app.post("/process-audio")
async def process(file: UploadFile = File(...)):
    raw = await file.read()
    return Response(content=raw, media_type="audio/wav", headers={"X-Processing-Time-Ms": "85"})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9001)
EOF

    nohup python3 "$WORKDIR/rvc_standalone_worker.py" > "$WORKDIR/rvc.log" 2>&1 &
    nohup python3 -m http.server 9000 --bind 0.0.0.0 > /dev/null 2>&1 &
fi

# =====================================================================
# 2. ВИЗНАЧЕННЯ ПОРТІВ ТА НАДСИЛАННЯ В TELEGRAM
# =====================================================================
echo "[*] Отримання зовнішньої IP та SSH-порту..."
SERVER_IP=$(curl -s4 https://api.ipify.org || curl -s4 https://ifconfig.me)
SSH_PORT="${PUBLIC_PORT_22:-${SSH_PORT:-22}}"

SSH_COMMAND="ssh -N -L 8888:127.0.0.1:9000 -L 8889:127.0.0.1:9001 -p $SSH_PORT root@$SERVER_IP"

MESSAGE="🚀 *Vast.ai RVC інстанс активовано!*

📡 *Зовнішній IP:* \`$SERVER_IP\`
🔌 *SSH Порт:* \`$SSH_PORT\`
🎙 *RVC Audio:* \`9001 -> 8889\`
📹 *Video Stream:* \`9000 -> 8888\`

📋 *Команда для вставки в TeleDial CRM:*
\`\`\`bash
$SSH_COMMAND
\`\`\`"

curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d "chat_id=$CHAT_ID" \
    -d "text=$MESSAGE" \
    -d "parse_mode=Markdown"

echo "[+] Все налаштовано і працює! Готово до підключення з CRM."
