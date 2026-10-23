#!/data/data/com.termux/files/usr/bin/bash
# =====================================================================
# TeleDial RVC CRM — Launch Unified Server for Termux (Android)
# =====================================================================

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

if [ ! -d ".venv" ]; then
    echo "[!] Віртуальне середовище не знайдено. Запускаємо установку..."
    ./install_termux.sh
fi

source .venv/bin/activate
export PYTHONPATH="$APP_DIR/backend"

PORT=8000
HOST="0.0.0.0"

# Find WiFi IP in Termux
WIFI_IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || true)
if [ -z "$WIFI_IP" ]; then
    WIFI_IP="127.0.0.1"
fi

echo "====================================================================="
echo "       TeleDial RVC CRM — Сервер запущено на Android (Termux)        "
echo "====================================================================="
echo ""
echo "  [✓] Відкрити на смартфоні:    http://localhost:$PORT"
echo "  [✓] З комп'ютера у тій же WiFi: http://$WIFI_IP:$PORT"
echo ""
echo "====================================================================="

# If termux-open-url exists, automatically open default browser
if command -v termux-open-url &> /dev/null; then
    (sleep 1 && termux-open-url "http://localhost:$PORT") &
fi

exec uvicorn main:app --app-dir backend --host "$HOST" --port "$PORT"
