@echo off
chcp 65001 > nul
echo ====================================================
echo   TeleDial CRM - Полный запуск (Бэкенд + Фронтенд)
echo ====================================================
cd /d "%~dp0"
start "TeleDial FastAPI Backend" cmd /c "run_backend.bat"
timeout /t 2 /nobreak > nul
start "TeleDial Vite Frontend" cmd /c "run_frontend.bat"
echo [*] Все службы запущены! Откройте http://localhost:3000 в браузере.
