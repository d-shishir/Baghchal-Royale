from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.core.matchmaking import matchmaking_manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    current_user: models.User = Depends(deps.get_current_user_ws),
):
    await matchmaking_manager.connect(websocket, current_user)
    try:
        while True:
            data = await websocket.receive_json()
            await matchmaking_manager.handle_message(websocket, data, current_user)
    except WebSocketDisconnect:
        matchmaking_manager.disconnect(websocket) 