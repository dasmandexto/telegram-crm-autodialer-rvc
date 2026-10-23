# TeleDial RVC CRM — Cold Calling for Telegram

Полнофункциональная система для автоматизации и ведения холодных звонков в Telegram с изменением голоса в реальном времени через RVC v2 на Vast.ai, записью разговоров по стемам, диспетчером спинтакса и синхронизацией с Google Таблицами.

Фронтенд и бэкенд **полностью объединены в единый интерфейс**. Запускается на одном порту `http://localhost:8000` без необходимости держать отдельный процесс Node.js.

---

## ⚡ 1-Клик Установка и Запуск

### 🪟 Windows:
1. **Установка (1 клик):**
   Дважды нажмите на:
   ```cmd
   install.bat
   ```
   Скрипт сам создаст виртуальное окружение `.venv`, установит библиотеки Python и проверит сборку фронтенда.

2. **Запуск (1 клик):**
   ```cmd
   start.bat
   ```
   Сервер запустится на `http://localhost:8000` и **автоматически откроет браузер**.

---

### 🐧 Debian / Ubuntu / Linux:
1. **Установка (1 клик):**
   ```bash
   chmod +x install_debian.sh start_debian.sh
   ./install_debian.sh
   ```
   *Скрипт автоматически установит системные зависимости `python3`, `python3-venv`, `ffmpeg`, `nodejs`, настроит `.venv` и соберет проект.*

2. **Запуск:**
   ```bash
   ./start_debian.sh
   ```
   Откройте в браузере: `http://localhost:8000` (или IP вашего сервера в локальной сети).

---

### 📱 Android (Termux):
1. **Установка (1 клик):**
   В приложении Termux выполните:
   ```bash
   chmod +x install_termux.sh start_termux.sh
   ./install_termux.sh
   ```
   *Скрипт сам установит через `pkg` Python, clang, ffmpeg, nodejs, подготовит окружение и соберет интерфейс.*

2. **Запуск:**
   ```bash
   ./start_termux.sh
   ```
   При запуске скрипт **автоматически откроет браузер на телефоне** (`http://localhost:8000`), а также покажет IP адрес для подключения с ноутбука в той же Wi-Fi сети.

---

## 📂 Структура Проекта

```
teledial-crm/
├── dist/                           # Собранный в единый билд фронтенд (React 19 + Tailwind)
├── backend/                        # Единый Python FastAPI сервер
│   ├── main.py                     # Раздача фронтенда SPA + REST API + WebSocket
│   ├── models/schemas.py           # Pydantic схемы данных
│   ├── routers/                    # Маршруты: calls, accounts, messages, rvc, recordings, crm
│   ├── services/                   # Движки: RVC Vast.ai, Telethon VoIP, Spintax, Stems Recorder
│   └── data/                       # БД CRM, сессии Telegram и аудиозаписи
├── install.bat                     # 1-клик установка для Windows
├── start.bat                       # 1-клик запуск для Windows
├── install_debian.sh               # 1-клик установка для Debian / Ubuntu
├── start_debian.sh                 # 1-клик запуск для Debian / Ubuntu
├── install_termux.sh               # 1-клик установка для Android Termux
├── start_termux.sh                 # 1-клик запуск для Android Termux
└── test_backend.py                 # Автоматические тесты всей системы
```

---

## 🧪 Проверка работы

Для запуска полного сьюта тестов:
```bash
.\.venv\Scripts\python test_backend.py    # Windows
source .venv/bin/activate && python test_backend.py # Linux / Termux
```
Все тесты проходят со 100% успехом.
