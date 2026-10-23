@echo off
chcp 65001 > nul
title TeleDial RVC CRM - 1-Click Installer (Windows)

echo =====================================================================
echo           TeleDial RVC CRM — Автоматическая установка
echo =====================================================================
echo.

cd /d "%~dp0"

:: 1. Проверка Python
python --version > nul 2>&1
if %errorlevel% neq 0 goto NO_PYTHON

echo [1/4] Проверка Python:
python --version
goto CHECK_VENV

:NO_PYTHON
echo [ОШИБКА] Python не обнаружен в системе PATH!
echo Установите Python 3.10+ с сайта python.org и обязательно отметьте галочку
echo "Add Python to PATH" при установке.
pause
exit /b 1

:CHECK_VENV
:: 2. Создание виртуального окружения Python
if exist ".venv\Scripts\python.exe" goto VENV_EXISTS

echo [2/4] Создание виртуального окружения venv...
python -m venv .venv
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось создать виртуальное окружение .venv
    pause
    exit /b 1
)
goto INSTALL_DEPS

:VENV_EXISTS
echo [2/4] Виртуальное окружение .venv уже существует.

:INSTALL_DEPS
:: 3. Установка Python зависимостей
echo [3/4] Установка серверных зависимостей FastAPI, Telethon, RVC Gateway...
".venv\Scripts\python.exe" -m pip install --upgrade pip > nul 2>&1
if exist "requirements.txt" (
    ".venv\Scripts\pip.exe" install -r requirements.txt
) else if exist "backend\requirements.txt" (
    ".venv\Scripts\pip.exe" install -r backend\requirements.txt
) else (
    ".venv\Scripts\pip.exe" install -r backend_template\requirements.txt
)

if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить Python пакеты.
    pause
    exit /b 1
)

:: 4. Проверка интерфейса
echo [4/4] Проверка интерфейса dist...
if exist "dist\index.html" goto DIST_OK

echo [*] Фронтенд не собран. Проверяем Node.js...
node -v > nul 2>&1
if %errorlevel% neq 0 goto NO_NODE

echo [*] Сборка интерфейса через Vite...
call npm install --legacy-peer-deps
call npm run build
goto FINISH

:NO_NODE
echo [!] Node.js не найден. Если файлы dist уже скопированы, сервер готов к работе.
goto FINISH

:DIST_OK
echo [*] Интерфейс готов к работе: dist\index.html найден.

:FINISH
echo.
echo =====================================================================
echo   [УСПЕХ] Установка завершена!
echo   Для запуска используйте: start.bat
echo =====================================================================
echo.
pause
