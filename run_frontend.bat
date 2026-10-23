@echo off
chcp 65001 > nul
echo ====================================================
echo   TeleDial CRM - Запуск Vite React 19 Фронтенда
echo ====================================================
cd /d "%~dp0"
echo [*] Запуск Vite dev server на http://localhost:3000
npm run dev
pause
