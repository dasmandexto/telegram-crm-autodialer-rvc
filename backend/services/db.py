import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from models.schemas import (
    Contact, TelegramAccount, MessageTemplate, CallReminder,
    InboxEvent, CallHistoryRecord, ClientStatusDefinition,
    CRMSettings, GoogleSheetsConfig, ProxyServer, RvcConnectionConfig,
    RvcSettings, SavedCallRecording
)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DB_FILE = os.path.join(DATA_DIR, "crm_store.json")

class CRMDatabase:
    def __init__(self):
        self.lock = asyncio.Lock()
        self._ensure_storage()

    def _get_default_statuses(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "status_refused_contact",
                "label": "отказался но на контакт идёт",
                "color": "amber",
                "group": "Отказ (с шансом)",
                "description": "Отказ от прямого оффера, но готов к переписке и обсуждению деталей",
                "isDefault": True,
            },
            {
                "id": "status_toxic_histeric",
                "label": "истеричка",
                "color": "rose",
                "group": "Сложные клиенты",
                "description": "Эмоциональный срыв, негатив, неадекватная реакция на звонок",
                "isDefault": True,
            },
            {
                "id": "status_no_answer",
                "label": "не ответил",
                "color": "slate",
                "group": "Недозвон",
                "description": "Гудки без ответа, сброс до поднятия трубки",
                "isDefault": True,
            },
            {
                "id": "status_privacy_closed",
                "label": "закрыты настройки",
                "color": "purple",
                "group": "Приватность",
                "description": "Запрет входящих звонков от неизвестных в настройках Telegram",
                "isDefault": True,
            },
            {
                "id": "status_interested_hot",
                "label": "заинтересован (горячий)",
                "color": "emerald",
                "group": "Горячие",
                "description": "Прямой интерес, запросил КП, прайс или расчет окупаемости",
                "isDefault": True,
            },
            {
                "id": "status_call_scheduled",
                "label": "согласован созвон",
                "color": "sky",
                "group": "Встречи",
                "description": "Зафиксировано точное время повторного звонка или демо-презентации",
                "isDefault": True,
            },
            {
                "id": "status_spamblock_invalid",
                "label": "спамблок / неверный контакт",
                "color": "orange",
                "group": "Невалидные",
                "description": "Удаленный профиль, спамблок или неверный номер",
                "isDefault": True,
            },
        ]

    def _get_initial_data(self) -> Dict[str, Any]:
        today_str = datetime.now().strftime("%Y-%m-%d")
        return {
            "contacts": [
                {"id": "c-1", "target": "@dmitriy_b2b", "name": "Дмитрий Волков", "company": "Logistics Pro", "status": "pending"},
                {"id": "c-2", "target": "+79261234567", "name": "Алексей Смирнов", "company": "FinTech Cloud", "status": "pending"},
                {"id": "c-3", "target": "@olga_marketing", "name": "Ольга Кузнецова", "company": "MediaGroup Digital", "status": "pending"},
                {"id": "c-4", "target": "+79165554321", "name": "Михаил Соколов", "company": "E-com Retail Hub", "status": "pending"},
                {"id": "c-5", "target": "@sergey_director", "name": "Сергей Морозов", "company": "СтройКомплект", "status": "pending"},
                {"id": "c-6", "target": "+79037778899", "name": "Елена Васильева", "company": "ИнвестКапитал", "status": "pending"},
                {"id": "c-7", "target": "@pavel_techlead", "name": "Павел Новиков", "company": "SaaS Platform", "status": "pending"},
            ],
            "accounts": [
                {
                    "id": "acc-1",
                    "phone": "+7 999 444-12-01",
                    "username": "@hunter_sales_1",
                    "displayName": "Sales Account Alpha",
                    "avatarColor": "bg-emerald-600",
                    "dailyCallLimit": 35,
                    "callsToday": 18,
                    "status": "active",
                    "proxy": "SOCKS5: 185.122.90.14:1080 (RU)",
                    "sessionFile": "session_alpha_1.session",
                },
                {
                    "id": "acc-2",
                    "phone": "+7 999 444-12-02",
                    "username": "@hunter_sales_2",
                    "displayName": "Sales Account Beta",
                    "avatarColor": "bg-blue-600",
                    "dailyCallLimit": 35,
                    "callsToday": 24,
                    "status": "active",
                    "proxy": "SOCKS5: 185.122.90.15:1080 (RU)",
                    "sessionFile": "session_beta_2.session",
                },
                {
                    "id": "acc-3",
                    "phone": "+7 999 444-12-03",
                    "username": "@hunter_sales_3",
                    "displayName": "Sales Account Gamma",
                    "avatarColor": "bg-purple-600",
                    "dailyCallLimit": 35,
                    "callsToday": 6,
                    "status": "warming",
                    "proxy": "SOCKS5: 185.122.90.16:1080 (RU)",
                    "sessionFile": "tdata_gamma_folder",
                },
            ],
            "templates": [
                {
                    "id": "tpl-1",
                    "title": "Коммерческое предложение (с изображением КП)",
                    "category": "Пост-звонок",
                    "content": "{Здравствуйте|Добрый день|Приветствую}, {имя}! {Договорились на созвоне|Как и обсуждали во время звонка} в Telegram. {Направляю|Прикрепляю|Высылаю} краткую презентацию и расчет окупаемости для вашей компании: https://teledial.crm/proposal/{id}\n{Буду рад ответить на любые вопросы!|С удовольствием отвечу на детали в удобное время!}",
                    "mediaAttachment": {
                        "type": "image",
                        "name": "КП_Презентация_Тарифов.png",
                        "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
                        "sizeKb": 245,
                    },
                },
                {
                    "id": "tpl-2",
                    "title": "Не дозвонился — голосовая аудио-заметка",
                    "category": "Дозвон",
                    "content": "{Добрый день|Здравствуйте|Приветствую}, {имя}! {Не удалось до вас дозвониться|Пытался набрать вас по аудио}. {Записал краткое голосовое сообщение на 20 секунд|Прикрепляю короткую аудио-заметку с сутью предложения}. {Подскажите, в какое время вам удобно созвониться на 5 минут?|Буду очень признателен за обратную связь!}",
                    "mediaAttachment": {
                        "type": "audio",
                        "name": "Голосовое_сообщение_менеджера.mp3",
                        "url": "https://actions.google.com/sounds/v1/ambient/rain_heavy.ogg",
                        "sizeKb": 180,
                    },
                },
                {
                    "id": "tpl-3",
                    "title": "Подтверждение запланированного созвона (с видео-демо)",
                    "category": "Встречи",
                    "content": "{Добрый день|Здравствуйте|Привет}, {имя}! {Фиксирую нашу договоренность на созвон {время}|Подтверждаю встречу {время}}. {Прикрепляю короткое минутное видео о возможностях CRM|Посмотрите минутный видео-обзор перед созвоном}: https://teledial.crm/demo",
                    "mediaAttachment": {
                        "type": "video",
                        "name": "Видео_обзор_платформы.mp4",
                        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                        "sizeKb": 1420,
                    },
                },
                {
                    "id": "tpl-4",
                    "title": "Благодарность за диалог (GIF-стикер)",
                    "category": "Лояльность",
                    "content": "{Отличного дня|Хорошей рабочей недели}, {имя}! {Спасибо за приятный диалог на созвоне|Рад был познакомиться}. {Всегда на связи в Telegram!|Если возникнут любые вопросы — сразу пишите сюда!}",
                    "mediaAttachment": {
                        "type": "gif",
                        "name": "Спасибо_за_звонок.gif",
                        "url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1aHk3Zjh3b2V1ZjlhNHlhZDF2OG10ZXd5eGttOTRraDJ6cWphdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif",
                        "sizeKb": 380,
                    },
                },
            ],
            "reminders": [
                {
                    "id": "rem-1",
                    "contactTarget": "@dmitriy_b2b",
                    "contactName": "Дмитрий Волков (Logistics Pro)",
                    "dateTime": f"{today_str}T10:00",
                    "durationMinutes": 30,
                    "notes": "Повторный звонок по согласованию договора на пилотный запуск",
                    "account": "@hunter_sales_1",
                    "completed": False,
                },
                {
                    "id": "rem-2",
                    "contactTarget": "+79165554321",
                    "contactName": "Михаил Соколов (Retail Hub)",
                    "dateTime": f"{today_str}T14:30",
                    "durationMinutes": 30,
                    "notes": "Демонстрация работы CRM и выгрузки базы контактов",
                    "account": "@hunter_sales_2",
                    "completed": False,
                },
                {
                    "id": "rem-3",
                    "contactTarget": "@sergey_director",
                    "contactName": "Сергей Морозов (СтройКомплект)",
                    "dateTime": f"{today_str}T16:00",
                    "durationMinutes": 45,
                    "notes": "Обсуждение интеграции с их текущей базой 1С",
                    "account": "@hunter_sales_1",
                    "completed": False,
                },
            ],
            "inbox": [
                {
                    "id": "inb-1",
                    "type": "message",
                    "client": "@dmitriy_b2b",
                    "clientName": "Дмитрий Волков",
                    "account": "@hunter_sales_1",
                    "timestamp": "14:22",
                    "previewText": "Изучил ваше КП. Давайте согласуем созвон с техническим директором.",
                    "read": False,
                },
                {
                    "id": "inb-2",
                    "type": "missed_call",
                    "client": "+79037778899",
                    "clientName": "Елена Васильева",
                    "account": "@hunter_sales_2",
                    "timestamp": "12:45",
                    "previewText": "Входящий аудиовызов (12 сек, без ответа)",
                    "read": False,
                },
            ],
            "history": [
                {
                    "id": "hist-1",
                    "dateTime": "2026-10-22 16:45:12",
                    "target": "+79261234567",
                    "clientName": "Алексей Смирнов",
                    "company": "FinTech Cloud",
                    "outcome": "успешно",
                    "clientStatus": "заинтересован (горячий)",
                    "clientStatusId": "status_interested_hot",
                    "clientStatusGroup": "Горячие",
                    "clientStatusColor": "emerald",
                    "durationSeconds": 142,
                    "notes": "Очень заинтересованы в Telegram-автодозвоне для отдела продаж. Договорились о созвоне завтра.",
                    "message": {
                        "sent": True,
                        "text": "Алексей, добрый день! Направляю презентацию: https://teledial.crm/proposal/482",
                        "templateTitle": "Коммерческое предложение (с изображением КП)",
                        "sentAt": "16:48",
                    },
                    "accountUsed": "@hunter_sales_1",
                    "proxyUsed": "SOCKS5 #1 (185.122.90.14:1080 RU)",
                    "syncedToGoogleSheets": True,
                    "hasAudioRecord": True,
                    "recordingId": "rec-1",
                }
            ],
            "client_statuses": self._get_default_statuses(),
            "recordings": [
                {
                    "id": "rec-1",
                    "callId": "call_mock_1",
                    "title": "Запись: Алексей Смирнов (+79261234567)",
                    "clientTarget": "+79261234567",
                    "clientName": "Алексей Смирнов",
                    "dateTime": "2026-10-22 16:45",
                    "durationSeconds": 142,
                    "mode": "FULL_CALL_MIX",
                    "rvcVoiceName": "Male_Deep (Баритон / Шеф)",
                    "rvcPitch": -4,
                    "fileSizeBytes": 4544000,
                }
            ],
            "settings": {
                "dailyCallLimitPerAccount": 35,
                "autoRotateAccounts": True,
                "autoNextCallDelaySeconds": 5,
                "soundEnabled": True,
                "proxyRotationEnabled": True,
                "currentProxyIndex": 0,
                "proxies": [
                    {
                        "id": "prx-1",
                        "url": "socks5://user:pass@185.122.90.14:1080",
                        "label": "SOCKS5 #1 (185.122.90.14 RU)",
                        "country": "RU",
                        "pingMs": 35,
                        "status": "active",
                        "callsCount": 18,
                    },
                    {
                        "id": "prx-2",
                        "url": "socks5://user:pass@185.122.90.15:1080",
                        "label": "SOCKS5 #2 (185.122.90.15 RU)",
                        "country": "RU",
                        "pingMs": 42,
                        "status": "active",
                        "callsCount": 24,
                    },
                ],
                "googleSheets": {
                    "webhookUrl": "https://script.google.com/macros/s/AKfycbx_mock_webhook/exec",
                    "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
                    "sheetName": "База_Позвонивших",
                    "autoSyncOnCallFinish": True,
                    "lastSyncTime": None,
                    "syncedCount": 14,
                },
                "rvcConfig": {
                    "rawSshCommand": "ssh -N -L 8888:127.0.0.1:9000 -L 8889:127.0.0.1:9001 -p 25411 root@194.168.1.10",
                    "serverIp": "194.168.1.10",
                    "sshPort": 25411,
                    "localRvcPort": 8889,
                    "remoteRvcPort": 9001,
                    "localVideoPort": 8888,
                    "remoteVideoPort": 9000,
                    "status": "offline",
                    "pingMs": 0,
                },
                "rvcSettings": {
                    "pitch": -4,
                    "indexRate": 0.75,
                    "protect": 0.33,
                    "activeVoiceId": "voice_male_deep",
                    "isSwitching": False,
                },
                "defaultRecordMode": "FULL_CALL_MIX",
            }
        }

    def _ensure_storage(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(DB_FILE):
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self._get_initial_data(), f, ensure_ascii=False, indent=2)

    def _read_data(self) -> Dict[str, Any]:
        self._ensure_storage()
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return self._get_initial_data()

    def _write_data(self, data: Dict[str, Any]):
        tmp_file = f"{DB_FILE}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_file, DB_FILE)

    # Contacts
    async def get_contacts(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("contacts", [])

    async def save_contacts(self, contacts: List[Dict[str, Any]]):
        async with self.lock:
            data = self._read_data()
            data["contacts"] = contacts
            self._write_data(data)

    async def update_contact(self, contact_id: str, updates: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            contacts = data.get("contacts", [])
            for c in contacts:
                if c["id"] == contact_id or c.get("target") == contact_id:
                    c.update(updates)
                    break
            data["contacts"] = contacts
            self._write_data(data)

    # Accounts
    async def get_accounts(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("accounts", [])

    async def save_accounts(self, accounts: List[Dict[str, Any]]):
        async with self.lock:
            data = self._read_data()
            data["accounts"] = accounts
            self._write_data(data)

    async def add_account(self, account: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            accounts = data.get("accounts", [])
            accounts.append(account)
            data["accounts"] = accounts
            self._write_data(data)

    # Templates
    async def get_templates(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("templates", [])

    async def save_template(self, template: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            templates = data.get("templates", [])
            # replace or append
            idx = next((i for i, t in enumerate(templates) if t["id"] == template["id"]), -1)
            if idx >= 0:
                templates[idx] = template
            else:
                templates.append(template)
            data["templates"] = templates
            self._write_data(data)

    async def delete_template(self, template_id: str) -> bool:
        async with self.lock:
            data = self._read_data()
            templates = data.get("templates", [])
            initial_len = len(templates)
            templates = [t for t in templates if t["id"] != template_id]
            data["templates"] = templates
            self._write_data(data)
            return len(templates) < initial_len

    # Reminders
    async def get_reminders(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("reminders", [])

    async def save_reminder(self, reminder: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            reminders = data.get("reminders", [])
            idx = next((i for i, r in enumerate(reminders) if r["id"] == reminder["id"]), -1)
            if idx >= 0:
                reminders[idx] = reminder
            else:
                reminders.append(reminder)
            data["reminders"] = reminders
            self._write_data(data)

    # Inbox
    async def get_inbox(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("inbox", [])

    async def mark_inbox_read(self, event_id: str):
        async with self.lock:
            data = self._read_data()
            inbox = data.get("inbox", [])
            for item in inbox:
                if item["id"] == event_id:
                    item["read"] = True
                    break
            data["inbox"] = inbox
            self._write_data(data)

    # History
    async def get_history(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("history", [])

    async def add_history_record(self, record: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            history = data.get("history", [])
            history.insert(0, record)
            data["history"] = history
            self._write_data(data)

    # Client Statuses
    async def get_client_statuses(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("client_statuses", self._get_default_statuses())

    async def save_client_statuses(self, statuses: List[Dict[str, Any]]):
        async with self.lock:
            data = self._read_data()
            data["client_statuses"] = statuses
            self._write_data(data)

    # Recordings
    async def get_recordings(self) -> List[Dict[str, Any]]:
        async with self.lock:
            return self._read_data().get("recordings", [])

    async def add_recording(self, recording: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            recs = data.get("recordings", [])
            recs.insert(0, recording)
            data["recordings"] = recs
            self._write_data(data)

    async def delete_recording(self, rec_id: str) -> bool:
        async with self.lock:
            data = self._read_data()
            recs = data.get("recordings", [])
            init_len = len(recs)
            recs = [r for r in recs if r["id"] != rec_id]
            data["recordings"] = recs
            self._write_data(data)
            return len(recs) < init_len

    # Settings
    async def get_settings(self) -> Dict[str, Any]:
        async with self.lock:
            data = self._read_data()
            return data.get("settings", {})

    async def update_settings(self, updates: Dict[str, Any]):
        async with self.lock:
            data = self._read_data()
            settings = data.get("settings", {})
            settings.update(updates)
            data["settings"] = settings
            self._write_data(data)

db = CRMDatabase()
