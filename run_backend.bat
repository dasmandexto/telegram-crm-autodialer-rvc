@echo off
chcp 65001 > nul
echo ====================================================
echo   TeleDial CRM - Запуск Python FastAPI Бэкенда
echo ====================================================
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    echo [!] Виртуальное окружение не найдено. Создаем .venv...
    python -m venv .venv
    call .venv\Scripts\pip install -r backend\requirements.txt
)
set PYTHONPATH=%cd%\backend
echo [*] Запуск сервера uvicorn на http://localhost:8000
".venv\Scripts\python.exe" -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
pause
