import csv
import io
import httpx
from typing import List, Dict, Any, Optional

class GoogleSheetsBackendService:
    @staticmethod
    def generate_csv(records: List[Dict[str, Any]], filter_status_id: Optional[str] = None) -> str:
        """
        Generates CSV format compatible with Excel & Google Sheets (Semicolon delimited, UTF-8 BOM)
        """
        if filter_status_id:
            records = [r for r in records if r.get("clientStatusId") == filter_status_id or r.get("clientStatus") == filter_status_id]

        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        
        headers = [
            "ID",
            "Дата и время",
            "Номер / Юзернейм",
            "Имя клиента",
            "Компания",
            "Результат звонка",
            "Статус клиента (GSheet)",
            "Группа статуса (Сегмент)",
            "Длительность (сек)",
            "Комментарий / Заметки",
            "Сообщение отправлено",
            "Шаблон / Текст сообщения",
            "Использованный аккаунт",
            "Прокси",
            "Наличие аудиозаписи"
        ]
        writer.writerow(headers)

        for r in records:
            msg = r.get("message", {})
            msg_sent_str = "Да" if msg.get("sent") else "Нет"
            msg_text = msg.get("text") or msg.get("templateTitle") or ""
            has_audio = "Да" if r.get("hasAudioRecord") else "Нет"

            writer.writerow([
                r.get("id", ""),
                r.get("dateTime", ""),
                r.get("target", ""),
                r.get("clientName", ""),
                r.get("company", ""),
                r.get("outcome", ""),
                r.get("clientStatus", "Не указан"),
                r.get("clientStatusGroup", "Общее"),
                r.get("durationSeconds", 0),
                r.get("notes", ""),
                msg_sent_str,
                msg_text.replace("\n", " "),
                r.get("accountUsed", ""),
                r.get("proxyUsed", ""),
                has_audio
            ])

        # Return with UTF-8 BOM
        return "\ufeff" + output.getvalue()

    @staticmethod
    async def sync_to_webhook(webhook_url: str, record: Dict[str, Any]) -> bool:
        if not webhook_url or not webhook_url.startswith("http"):
            return False

        payload = {
            "id": record.get("id"),
            "dateTime": record.get("dateTime"),
            "target": record.get("target"),
            "clientName": record.get("clientName"),
            "company": record.get("company", ""),
            "outcome": record.get("outcome", ""),
            "clientStatus": record.get("clientStatus", ""),
            "clientStatusGroup": record.get("clientStatusGroup", ""),
            "durationSeconds": record.get("durationSeconds", 0),
            "notes": record.get("notes", ""),
            "accountUsed": record.get("accountUsed", ""),
            "messageSent": record.get("message", {}).get("sent", False),
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(webhook_url, json=payload)
                return res.status_code in (200, 201, 302)
        except Exception:
            return False

sheets_service = GoogleSheetsBackendService()
