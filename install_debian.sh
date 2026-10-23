#!/usr/bin/env bash
# =====================================================================
# TeleDial RVC CRM — 1-Click Installer for Debian / Ubuntu / Linux
# =====================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================================${NC}"
echo -e "${GREEN}      TeleDial RVC CRM — Автоматична установка для Debian/Linux      ${NC}"
echo -e "${BLUE}=====================================================================${NC}"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# 1. Update packages & install system requirements
echo -e "\n${YELLOW}[1/4] Перевірка системних пакетів (Python3, venv, ffmpeg, nodejs)...${NC}"

if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

if command -v apt-get &> /dev/null; then
    echo "[*] Оновлення списку пакетів apt..."
    $SUDO apt-get update -y
    echo "[*] Встановлення необхідних системних залежностей..."
    $SUDO apt-get install -y python3 python3-venv python3-pip ffmpeg curl git
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "[*] Встановлення Node.js LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
        $SUDO apt-get install -y nodejs
    fi
else
    echo -e "${YELLOW}[!] Не знайдено apt-get. Переконайтеся, що встановлені python3, python3-venv, ffmpeg та nodejs.${NC}"
fi

# 2. Virtual environment setup
echo -e "\n${YELLOW}[2/4] Налаштування віртуального середовища Python (.venv)...${NC}"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip

# 3. Install Python backend dependencies
echo -e "\n${YELLOW}[3/4] Встановлення Python залежностей (FastAPI, Telethon, RVC Gateway)...${NC}"
pip install -r backend_template/requirements.txt

# 4. Check & Build Frontend if needed
echo -e "\n${YELLOW}[4/4] Перевірка інтерфейсу (dist/)...${NC}"
if [ ! -f "dist/index.html" ]; then
    if command -v npm &> /dev/null; then
        echo "[*] Збірка фронтенду через Vite..."
        npm install --legacy-peer-deps
        npm run build
    else
        echo -e "${RED}[!] npm не знайдено, пропуск збірки фронтенду.${NC}"
    fi
else
    echo -e "${GREEN}[*] Готовий інтерфейс dist/index.html присутній.${NC}"
fi

# Set executable permissions
chmod +x *.sh 2>/dev/null || true

echo -e "\n${BLUE}=====================================================================${NC}"
echo -e "${GREEN}  [УСПІХ] Установку завершено!${NC}"
echo -e "  Для запуску виконайте: ${YELLOW}./start_debian.sh${NC}"
echo -e "${BLUE}=====================================================================${NC}\n"
