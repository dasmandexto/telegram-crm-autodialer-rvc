import sys
import os
import asyncio
import httpx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))
from main import app

async def run_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("=== RUNNING BACKEND TESTS ===")

        # 1. Health & SPA Frontend
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("✓ Health Check:", res.json())

        res_spa = await client.get("/")
        assert res_spa.status_code == 200
        assert "html" in res_spa.headers.get("content-type", "").lower()
        print("✓ Unified SPA Frontend Serving: index.html served at root '/' successfully")

        # 2. Contacts
        res = await client.get("/api/contacts")
        assert res.status_code == 200
        contacts = res.json()
        print(f"✓ Get Contacts: {len(contacts)} contacts found")

        # 3. Start Call
        res = await client.post("/api/calls/start", json={
            "target": "@test_lead",
            "account_id": "acc-1",
            "proxy_url": "socks5://185.122.90.14:1080",
            "record_mode": "FULL_CALL_MIX",
            "voice_id": "voice_male_deep",
            "pitch": -4
        })
        assert res.status_code == 200
        call_data = res.json()
        call_id = call_data["callId"]
        print("✓ Start Call:", call_data)

        # 4. Hangup Call
        res = await client.post("/api/calls/hangup", json={"call_id": call_id})
        assert res.status_code == 200
        hangup_data = res.json()
        print("✓ Hangup Call (with Audio Generation):", hangup_data)

        # 5. Spintax Preview & Message Sending
        spintax_text = "{Привет|Здравствуйте|Добрый день}, {дорогой|уважаемый} клиент!"
        res = await client.post("/api/messages/spintax/preview", json={"text": spintax_text})
        assert res.status_code == 200
        preview_data = res.json()
        print(f"✓ Spintax Preview: {preview_data['spunText']} (combinations: {preview_data['combinationsCount']})")

        res = await client.post("/api/messages/send", json={
            "target": "@test_lead",
            "text": spintax_text,
            "account_id": "@hunter_sales_1",
            "template_title": "Коммерческое предложение",
            "media_attachment": {
                "type": "image",
                "name": "price.png",
                "url": "https://example.com/price.png"
            }
        })
        assert res.status_code == 200
        print("✓ Send Message with Spintax & Image:", res.json())

        # 6. RVC Parse SSH Command
        ssh_cmd = "ssh -N -L 8888:127.0.0.1:9000 -L 8889:127.0.0.1:9001 -p 25411 root@194.168.1.10"
        res = await client.post("/api/rvc/parse-ssh", json={"command": ssh_cmd})
        assert res.status_code == 200
        parsed = res.json()
        print("✓ RVC Parse SSH Command:", parsed)
        assert parsed["sshPort"] == 25411
        assert parsed["serverIp"] == "194.168.1.10"
        assert parsed["localRvcPort"] == 8889

        # 7. RVC Connect & Switch Voice
        res = await client.post("/api/rvc/connect", json=parsed)
        assert res.status_code == 200
        print("✓ RVC Connect Status:", res.json()["status"])

        res = await client.post("/api/rvc/switch-voice", json={
            "voice_id": "voice_female_soft",
            "pitch": 6,
            "index_rate": 0.8,
            "protect": 0.25
        })
        assert res.status_code == 200
        print("✓ RVC Switch Voice Hot-Swap:", res.json())

        # 8. RVC Process Sample (Voice Lab)
        res = await client.post("/api/rvc/process-sample", data={
            "voice_id": "voice_male_deep",
            "pitch": -4,
            "index_rate": 0.75,
            "protect": 0.33
        })
        assert res.status_code == 200
        assert len(res.content) > 1000
        print(f"✓ RVC Process Audio Sample: Generated WAV ({len(res.content)} bytes), Latency: {res.headers.get('X-Processing-Time-Ms')}ms")

        # 9. Recordings list
        res = await client.get("/api/recordings")
        assert res.status_code == 200
        recs = res.json()
        print(f"✓ Get Recordings: {len(recs)} recordings in registry")

        # 10. Client Statuses & CSV Export
        res = await client.get("/api/client-statuses")
        assert res.status_code == 200
        statuses = res.json()
        print(f"✓ Client Statuses: {len(statuses)} custom tags configured")

        res = await client.get("/api/export/csv")
        assert res.status_code == 200
        csv_text = res.text
        print("✓ Google Sheets CSV Export:", csv_text.splitlines()[0], f"({len(csv_text.splitlines())} rows)")

        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
