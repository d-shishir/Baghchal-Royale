from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect, Path
from app import models
from app.api import deps
from app.core.game_websocket import game_ws_manager

router = APIRouter()


@router.websocket("/{game_id}/ws")
async def game_websocket_endpoint(
    websocket: WebSocket,
    game_id: str = Path(..., description="The game ID"),
    current_user: models.User = Depends(deps.get_current_user_ws),
):
    """WebSocket endpoint for real-time game communication."""
    await game_ws_manager.connect(websocket, current_user, game_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            message_type = data.get("type")
            
            if message_type == "move":
                move_data = data.get("move")
                if move_data:
                    await game_ws_manager.handle_move(websocket, current_user, game_id, move_data)
            elif message_type == "forfeit":
                # Handle player forfeit
                await game_ws_manager.handle_player_forfeit(websocket, current_user, game_id)
            elif message_type == "ping":
                # Heartbeat/ping message
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json({
                    "status": "error", 
                    "message": f"Unknown message type: {message_type}"
                })
                
    except WebSocketDisconnect:
        await game_ws_manager.disconnect(websocket, game_id)
    except Exception as e:
        print(f"WebSocket error in game {game_id}: {e}")
        await game_ws_manager.disconnect(websocket, game_id) 