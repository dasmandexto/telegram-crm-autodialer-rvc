@echo off
chcp 65001 > nul
title TeleDial RVC CRM - Unified Interface (Windows)

cd /d "%~dp0"

echo =====================================================================
echo         TeleDial RVC CRM — Запуск единого сервера
echo =====================================================================
echo.

if exist ".venv\Scripts\python.exe" goto START_SERVER

echo [!] Виртуальное окружение не найдено. Выполняем установку...
call install.bat
if not exist ".venv\Scripts\python.exe" (
    echo [ОШИБКА] Установка не удалась.
    pause
    exit /b 1
)

:START_SERVER
set PYTHONPATH=%cd%\backend
set HOST=0.0.0.0
set PORT=8000

echo [*] Запуск единого шлюза TeleDial CRM на http://localhost:%PORT%
echo [*] Открытие интерфейса в браузере...
start http://localhost:%PORT%

".venv\Scripts\python.exe" -m uvicorn main:app --app-dir backend --host %HOST% --port %PORT% --reload

pause
