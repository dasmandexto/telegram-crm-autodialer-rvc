import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead_conns = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_conns.add(connection)
        for dead in dead_conns:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()

@router.websocket("/ws")
@router.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial connected greeting
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": "TeleDial Live Stream Gateway Connected"
        }))
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                # Handle incoming ws messages (e.g. ping, loopback audio packet)
                if payload.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "timestamp": payload.get("timestamp")}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
