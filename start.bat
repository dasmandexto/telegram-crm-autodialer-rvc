@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title TeleDial RVC CRM - Единый интерфейс (Windows)

cd /d "%~dp0"

echo =====================================================================
echo         TeleDial RVC CRM — Запуск единого сервера (Фронт + Бэк)
echo =====================================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [!] Виртуальное окружение не найдено. Выполняем авто-установку...
    call install.bat
)

set PYTHONPATH=%cd%\backend
set HOST=0.0.0.0
set PORT=8000

echo [*] Запуск единого шлюза TeleDial CRM на http://localhost:%PORT%
echo [*] Открытие интерфейса в браузере...
start http://localhost:%PORT%

".venv\Scripts\python.exe" -m uvicorn main:app --app-dir backend --host %HOST% --port %PORT% --reload

pause
