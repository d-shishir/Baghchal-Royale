from fastapi import WebSocket
from typing import Dict, List, Optional
import uuid
import json
import asyncio
import math
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.game_websocket import GameWebSocketManager
from app.crud.game import game as game_repository
from app.crud.move import move as move_repository

XP_FOR_WIN = 100
XP_FOR_LOSS = 25

def get_level_for_xp(xp: int) -> int:
    if xp < 0:
        return 1
    return math.floor((xp / 100) ** (2/3)) + 1

class MatchmakingManager:
    def __init__(self):
        self.waiting_player: Optional[Dict] = None
        self.active_games: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, user: models.User):
        await websocket.accept()
        user_id = str(user.user_id)
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

            # Create actual game record in database
            game_id = await self._create_multiplayer_game(user.user_id, opponent["user_obj"].user_id, player1_side, player2_side)
            
            if game_id:
                # Initialize game environment
                env = BaghchalEnv()
                initial_state = env.get_state()
                
                # Serialize and save initial state
                serialized_state = self._serialize_game_state(initial_state)
                await self._update_game_state_in_db(game_id, serialized_state)

                game_details = {
                    "match_id": match_id,
                    "game_id": str(game_id),
                    "players": {
                        user_id: {"ws": websocket, "side": player1_side, "user": user},
                        opponent["user_id"]: {"ws": opponent["ws"], "side": player2_side, "user": opponent["user_obj"]},
                    },
                    "game_state": initial_state,
                    "env": env,
                    "turn": initial_state["current_player"].name if hasattr(initial_state["current_player"], 'name') else str(initial_state["current_player"])
                }
                self.active_games[match_id] = game_details

                # Notify both players that a match has been found
                await self.notify_match_found(user_id, opponent["user_id"], match_id, player1_side, str(game_id))
                await self.notify_match_found(opponent["user_id"], user_id, match_id, player2_side, str(game_id))
            else:
                # Failed to create game, notify error
                await websocket.send_json({"status": "error", "message": "Failed to create game"})
                await opponent["ws"].send_json({"status": "error", "message": "Failed to create game"})
                
        else:
            # No one waiting, or user is already waiting
            self.waiting_player = {"ws": websocket, "user_id": user_id, "user_obj": user}
            await websocket.send_json({"status": "waiting"})

    async def notify_match_found(self, user_id: str, opponent_id: str, match_id: str, side: str, game_id: str):
        game_details = self.active_games[match_id]
        player_ws = game_details["players"][user_id]["ws"]
        opponent_user = game_details["players"][opponent_id]["user"]
        await player_ws.send_json({
            "status": "match_found",
            "match_id": match_id,
            "opponent": {
                "id": str(opponent_user.user_id),
                "username": opponent_user.username,
                "rating": opponent_user.rating
            },
            "player_side": side,
            "game_id": game_id
        })

    async def _update_game_state_in_db(self, game_id: uuid.UUID, game_state: dict):
        """Update game state in the database."""
        try:
            async with AsyncSessionLocal() as db:
                game = await crud.game.get(db, id=game_id)
                if game:
                    game_update = schemas.GameUpdate(game_state=game_state)
                    await crud.game.update(db, db_obj=game, obj_in=game_update)
        except Exception as e:
            print(f"Error updating initial game state: {e}")

    async def _create_multiplayer_game(self, player1_id: uuid.UUID, player2_id: uuid.UUID, player1_side: str, player2_side: str) -> Optional[uuid.UUID]:
        """Create a multiplayer game record in the database."""
        try:
            async with AsyncSessionLocal() as db:
                # Determine player assignments based on sides
                goat_player_id = player1_id if player1_side == "Goat" else player2_id
                tiger_player_id = player1_id if player1_side == "Tiger" else player2_id
                
                # Create game record
                game_create = schemas.GameCreate(
                    player_goat_id=goat_player_id,
                    player_tiger_id=tiger_player_id
                )
                
                game = await crud.game.create(db, obj_in=game_create)
                return game.game_id
                
        except Exception as e:
            print(f"Error creating multiplayer game: {e}")
            return None

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
                                asyncio.create_task(other_player_data["ws"].send_json({"status": "opponent_disconnected"}))
                            except:
                                pass # Opponent might have already disconnected
                    break
            if game_to_remove:
                break
        
        if game_to_remove:
            del self.active_games[game_to_remove]

    async def handle_message(self, websocket: WebSocket, data: dict, user: models.User):
        match_id = data.get("match_id")
        move_data = data.get("move")
        user_id = str(user.user_id)

        if not match_id or not move_data or match_id not in self.active_games:
            return

        game = self.active_games[match_id]
        
        # Basic turn validation
        player_side = game["players"][user_id]["side"]
        if game["turn"] != player_side:
            # It's not this player's turn.
            await websocket.send_json({"status": "error", "message": "Not your turn"})
            return

        # Process the move through the game environment
        env = game["env"]
        try:
            # Apply the move to the game environment
            state, reward, done, info = env.step(move_data)
            
            # Update game state
            game["game_state"] = state
            game["turn"] = state["current_player"].name if hasattr(state["current_player"], 'name') else str(state["current_player"])
            
            # Store move in database
            await self._store_move(game["game_id"], user.user_id, move_data)
            
            # Notify both players about the move
            for player_id, player_data in game["players"].items():
                await player_data["ws"].send_json({
                    "status": "move",
                    "move": move_data,
                    "game_state": self._serialize_game_state(state),
                    "current_turn": game["turn"]
                })
            
            # Check if game is over
            if done:
                winner_side = state["winner"].name if state["winner"] and hasattr(state["winner"], 'name') else str(state["winner"]) if state["winner"] else None
                winner_user = None
                loser_user = None
                
                if winner_side:
                    for player_id, player_data in game["players"].items():
                        if player_data["side"] == winner_side:
                            winner_user = player_data["user"]
                        else:
                            loser_user = player_data["user"]
                
                # Update game record with winner
                await self._finish_game(game["game_id"], winner_user.user_id if winner_user else None)

                # Update player stats
                if winner_user and loser_user:
                    await self._update_player_stats(winner_user, loser_user)
                
                # Notify players about game end
                for player_id, player_data in game["players"].items():
                    await player_data["ws"].send_json({
                        "status": "game_over",
                        "winner": winner_side,
                        "game_state": self._serialize_game_state(state)
                    })
                
                # Remove from active games
                del self.active_games[match_id]
                
        except Exception as e:
            print(f"Error processing move: {e}")
            await websocket.send_json({"status": "error", "message": "Invalid move"})

    async def _store_move(self, game_id: str, user_id: uuid.UUID, move_data: dict):
        """Store a move in the database."""
        try:
            async with AsyncSessionLocal() as db:
                # Convert move_data to the required format
                move_create_data = {
                    "game_id": uuid.UUID(game_id),
                    "player_id": user_id,
                    "move_number": 1,  # This should be calculated based on existing moves
                    "to_row": move_data.get("to_row", move_data[1] if len(move_data) > 1 else 0),
                    "to_col": move_data.get("to_col", move_data[2] if len(move_data) > 2 else 0),
                    "move_type": move_data.get("move_type", move_data[0] if len(move_data) > 0 else "PLACEMENT")
                }
                
                # Add from position if it's a move (not placement)
                if move_data[0] == "move" and len(move_data) >= 5:
                    move_create_data["from_row"] = move_data[1]
                    move_create_data["from_col"] = move_data[2]
                
                move_create = schemas.MoveCreate(**move_create_data)
                await crud.move.create_move(db, obj_in=move_create)
        except Exception as e:
            print(f"Error storing move: {e}")

    async def _update_player_stats(self, winner: models.User, loser: models.User):
        """Update winner and loser stats after a game."""
        try:
            async with AsyncSessionLocal() as db:
                # Update winner
                winner.xp += XP_FOR_WIN
                new_level = get_level_for_xp(winner.xp)
                if new_level > winner.level:
                    winner.level = new_level
                    if f"Reached Level {new_level}" not in winner.achievements:
                        winner.achievements.append(f"Reached Level {new_level}")

                # Update loser
                loser.xp += XP_FOR_LOSS
                
                db.add(winner)
                db.add(loser)
                await db.commit()
        except Exception as e:
            print(f"Error updating player stats: {e}")

    async def _finish_game(self, game_id: str, winner_id: Optional[uuid.UUID]):
        """Update game record when game finishes."""
        try:
            async with AsyncSessionLocal() as db:
                game = await crud.game.get(db, id=uuid.UUID(game_id))
                if game:
                    game_update = schemas.GameUpdate(
                        status=schemas.GameStatus.COMPLETED,
                        winner_id=winner_id
                    )
                    await crud.game.update(db, db_obj=game, obj_in=game_update)
        except Exception as e:
            print(f"Error finishing game: {e}")

    def _serialize_game_state(self, state: dict) -> dict:
        """Serialize game state for transmission over WebSocket."""
        try:
            # Convert numpy arrays and enums to JSON-serializable format
            serialized = {}
            for key, value in state.items():
                if hasattr(value, 'tolist'):  # numpy array
                    serialized[key] = value.tolist()
                elif hasattr(value, 'name'):  # enum
                    serialized[key] = value.name
                elif hasattr(value, 'value'):  # enum with value
                    serialized[key] = value.value
                else:
                    serialized[key] = value
            return serialized
        except Exception as e:
            print(f"Error serializing game state: {e}")
            return {}

    async def create_game_and_notify(self, player1: User, player2: User):
        """Creates a game session and notifies both players."""
        match_id = str(uuid.uuid4())
        game_id = str(uuid.uuid4())
        
        async with AsyncSessionLocal() as db:
            new_game = await game_repository.create_game_with_players(
                db, player1_id=player1.user_id, player2_id=player2.user_id
            )

matchmaking_manager = MatchmakingManager() 