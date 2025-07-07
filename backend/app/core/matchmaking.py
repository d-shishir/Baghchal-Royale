from fastapi import WebSocket
from typing import Dict, List, Optional
import uuid

class MatchmakingManager:
    def __init__(self):
        self.waiting_player: Optional[Dict] = None
        self.active_games: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if self.waiting_player and self.waiting_player["user_id"] != user_id:
            # Match found
            opponent = self.waiting_player
            self.waiting_player = None
            
            match_id = str(uuid.uuid4())
            
            # Randomly assign sides
            import random
            sides = ["Goat", "Tiger"]
            random.shuffle(sides)
            
            player1_side = sides[0]
            player2_side = sides[1]

            game_details = {
                "match_id": match_id,
                "players": {
                    user_id: {"ws": websocket, "side": player1_side},
                    opponent["user_id"]: {"ws": opponent["ws"], "side": player2_side},
                },
                "game_state": "initial_state", # Replace with actual initial game state
                "turn": "Goat" # Or determined by some logic
            }
            self.active_games[match_id] = game_details

            # Notify both players that a match has been found
            await self.notify_match_found(user_id, opponent["user_id"], match_id, player1_side)
            await self.notify_match_found(opponent["user_id"], user_id, match_id, player2_side)

        else:
            # No one waiting, or user is already waiting
            self.waiting_player = {"ws": websocket, "user_id": user_id}
            await websocket.send_json({"status": "waiting"})

    async def notify_match_found(self, user_id: int, opponent_id: int, match_id: str, side: str):
        game_details = self.active_games[match_id]
        player_ws = game_details["players"][user_id]["ws"]
        await player_ws.send_json({
            "status": "match_found",
            "match_id": match_id,
            "opponent_id": opponent_id,
            "side": side
        })

    def disconnect(self, websocket: WebSocket):
        # Find if the disconnected user was in a game or waiting
        if self.waiting_player and self.waiting_player["ws"] == websocket:
            self.waiting_player = None
            return

        game_to_remove = None
        for match_id, game in self.active_games.items():
            for user_id, player_data in game["players"].items():
                if player_data["ws"] == websocket:
                    game_to_remove = match_id
                    # Notify opponent about the disconnection
                    for other_user_id, other_player_data in game["players"].items():
                        if other_user_id != user_id:
                            # This is a fire and forget, if it fails, it fails.
                            try:
                                other_player_data["ws"].send_json({"status": "opponent_disconnected"})
                            except:
                                pass # Opponent might have already disconnected
                    break
            if game_to_remove:
                break
        
        if game_to_remove:
            del self.active_games[game_to_remove]

    async def handle_message(self, websocket: WebSocket, data: dict, user_id: int):
        match_id = data.get("match_id")
        move = data.get("move")

        if not match_id or not move or match_id not in self.active_games:
            return

        game = self.active_games[match_id]
        
        # Basic turn validation
        player_side = game["players"][user_id]["side"]
        if game["turn"] != player_side:
            # It's not this player's turn.
            return

        # Find opponent to relay the move
        for opponent_id, opponent_data in game["players"].items():
            if opponent_id != user_id:
                await opponent_data["ws"].send_json({
                    "status": "move",
                    "move": move
                })
                # Update turn
                game["turn"] = "Goat" if player_side == "Tiger" else "Tiger"
                break

matchmaking_manager = MatchmakingManager() 