@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title TeleDial RVC CRM - 1-Click Installer (Windows)

echo =====================================================================
echo           TeleDial RVC CRM — Автоматическая установка (1-Клик)
echo =====================================================================
echo.

cd /d "%~dp0"

:: 1. Проверка Python
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не обнаружен в системе PATH!
    echo Установите Python 3.10+ с сайта python.org и обязательно отметьте галочку
    echo "Add Python to PATH" при установке.
    pause
    exit /b 1
)

echo [1/4] Проверка Python:
python --version

:: 2. Создание виртуального окружения Python
if not exist ".venv\Scripts\python.exe" (
    echo [2/4] Создание виртуального окружения (.venv)...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось создать .venv
        pause
        exit /b 1
    )
) else (
    echo [2/4] Виртуальное окружение .venv уже существует.
)

:: 3. Установка Python зависимостей
echo [3/4] Установка серверных зависимостей (FastAPI, Telethon, RVC Gateway)...
".venv\Scripts\python.exe" -m pip install --upgrade pip > nul 2>&1
".venv\Scripts\pip.exe" install -r backend_template\requirements.txt
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить Python пакеты.
    pause
    exit /b 1
)

:: 4. Проверка и сборка фронтенда (если dist отсутствует)
echo [4/4] Проверка собранного интерфейса (dist/)...
if not exist "dist\index.html" (
    echo [*] Фронтенд не собран. Проверяем Node.js...
    node -v > nul 2>&1
    if %errorlevel% equ 0 (
        echo [*] Сборка интерфейса через Vite...
        call npm install --legacy-peer-deps
        call npm run build
    ) else (
        echo [!] Node.js не найден, но если файлы dist уже скопированы, сервер готов к работе.
    )
) else (
    echo [*] Интерфейс готов к работе (dist/index.html найден).
)

echo.
echo =====================================================================
echo   [УСПЕХ] Установка завершена!
echo   Для запуска используйте: start.bat
echo =====================================================================
echo.
pause
