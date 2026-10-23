#!/usr/bin/env bash
# =====================================================================
# TeleDial RVC CRM — Launch Unified Server for Debian / Ubuntu / Linux
# =====================================================================

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

if [ ! -d ".venv" ]; then
    echo "[!] Віртуальне середовище не знайдено. Запускаємо установку..."
    ./install_debian.sh
fi

source .venv/bin/activate
export PYTHONPATH="$APP_DIR/backend"

PORT=8000
HOST="0.0.0.0"

# Determine local IP for convenient opening
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo "====================================================================="
echo "        TeleDial RVC CRM — Сервер запущено в єдиному інтерфейсі       "
echo "====================================================================="
echo ""
echo "  [✓] Локальна адреса:   http://localhost:$PORT"
echo "  [✓] Мережева адреса:   http://$LOCAL_IP:$PORT"
echo "  [✓] OpenAPI / Swagger: http://$LOCAL_IP:$PORT/docs"
echo ""
echo "====================================================================="
echo "Натисніть Ctrl+C для зупинки сервера."
echo ""

exec uvicorn main:app --app-dir backend --host "$HOST" --port "$PORT" --reload
