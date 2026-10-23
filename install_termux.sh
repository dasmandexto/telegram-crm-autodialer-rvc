#!/data/data/com.termux/files/usr/bin/bash
# =====================================================================
# TeleDial RVC CRM — 1-Click Installer for Termux (Android)
# =====================================================================

set -e

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=====================================================================${NC}"
echo -e "${GREEN}        TeleDial RVC CRM — Автоматична установка для Termux          ${NC}"
echo -e "${CYAN}=====================================================================${NC}"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# 1. Update Termux repositories & install packages
echo -e "\n${YELLOW}[1/4] Встановлення необхідних пакетів Termux...${NC}"
pkg update -y
pkg install -y python python-pip ffmpeg clang make libjpeg-turbo libcrypt termux-tools nodejs-lts

# 2. Virtual environment setup
echo -e "\n${YELLOW}[2/4] Створення Python віртуального середовища...${NC}"
if [ ! -d ".venv" ]; then
    python -m venv .venv --system-site-packages || python -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip

# 3. Install Python requirements
echo -e "\n${YELLOW}[3/4] Встановлення Python залежностей (FastAPI, Telethon, Uvicorn)...${NC}"
pip install -r backend_template/requirements.txt

# 4. Check Frontend build
echo -e "\n${YELLOW}[4/4] Перевірка фронтенду (dist/)...${NC}"
if [ ! -f "dist/index.html" ]; then
    echo "[*] Збірка фронтенду через npm у Termux..."
    npm install --legacy-peer-deps
    npm run build
else
    echo -e "${GREEN}[*] Інтерфейс вже зібрано (dist/index.html знайдено).${NC}"
fi

# Set permissions
chmod +x *.sh 2>/dev/null || true

echo -e "\n${CYAN}=====================================================================${NC}"
echo -e "${GREEN}  [УСПІХ] Установку в Termux завершено!${NC}"
echo -e "  Для запуску виконайте: ${YELLOW}./start_termux.sh${NC}"
echo -e "${CYAN}=====================================================================${NC}\n"
