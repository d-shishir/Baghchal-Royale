from fastapi import WebSocket
from typing import Dict, List, Optional
import uuid
import json
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
from app.crud.game import game as game_repository
from app.crud.move import move as move_repository
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.elo import calculate_elo
from app.crud.rating_history import rating_history as rating_history_repository
from app.crud.user import user as user_repository


class GameWebSocketManager:
    def __init__(self):
        # Structure: {game_id: {user_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # Structure: {game_id: BaghchalEnv}
        self.game_environments: Dict[str, BaghchalEnv] = {}
        # Structure: {game_id: asyncio.TimerHandle}
        self.game_timers: Dict[str, asyncio.TimerHandle] = {}
        self.inactivity_timeout = 60.0  # 1 minute

    async def connect(self, websocket: WebSocket, user: models.User, game_id: str):
        """Connect a user to a specific game's WebSocket."""
        await websocket.accept()
        
        user_id = str(user.user_id)
        
        # Initialize game connection if it doesn't exist
        if game_id not in self.active_connections:
            self.active_connections[game_id] = {}
            
        # Add user connection
        self.active_connections[game_id][user_id] = websocket
        
        # Initialize game environment and start timer if needed
        if game_id not in self.game_environments:
            await self._initialize_game_environment(game_id)
            self._start_inactivity_timer(game_id)
        
        # Send current game state to the connecting player
        if game_id in self.game_environments:
            current_state = self.game_environments[game_id].get_state()
            await websocket.send_json({
                "status": "connected",
                "game_id": game_id,
                "game_state": self._serialize_game_state(current_state)
            })
        
        print(f"User {user_id} connected to game {game_id}")

    async def disconnect(self, websocket: WebSocket, game_id: str):
        """Disconnect a user from a game."""
        user_id_to_remove = None
        
        # Find the user ID for this websocket
        if game_id in self.active_connections:
            for user_id, ws in self.active_connections[game_id].items():
                if ws == websocket:
                    user_id_to_remove = user_id
                    break
        
        # Remove the connection
        if user_id_to_remove and game_id in self.active_connections:
            del self.active_connections[game_id][user_id_to_remove]
            
            # Notify other players about disconnection
            await self._broadcast_to_game(game_id, {
                "status": "player_disconnected",
                "disconnected_user": user_id_to_remove
            }, exclude_user=user_id_to_remove)
            
            # Clean up empty game rooms
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]
                if game_id in self.game_environments:
                    del self.game_environments[game_id]
                # Stop any running timers for this game
                self._cancel_inactivity_timer(game_id)
        
        print(f"User {user_id_to_remove} disconnected from game {game_id}")

    async def handle_move(self, websocket: WebSocket, user: models.User, game_id: str, move_data: dict):
        """Handle a move from a player."""
        user_id = str(user.user_id)
        
        # A move has been made, so cancel the inactivity timer
        self._cancel_inactivity_timer(game_id)
        
        if game_id not in self.game_environments:
            await websocket.send_json({"status": "error", "message": "Game not found"})
            return
        
        env = self.game_environments[game_id]
        
        # Validate that it's the player's turn
        if not await self._is_player_turn(user.user_id, game_id, env):
            await websocket.send_json({"status": "error", "message": "Not your turn"})
            return
        
        try:
            # Convert frontend move format to backend format
            backend_move = self._convert_move_format(move_data)
            
            # Apply move to game environment
            state, reward, done, info = env.step(backend_move)
            
            # Store move in database
            await self._store_move(game_id, user.user_id, backend_move, env)
            
            # Broadcast updated game state to all players
            await self._broadcast_to_game(game_id, {
                "status": "move_made",
                "move": move_data,
                "game_state": self._serialize_game_state(state),
                "player": user_id
            })
            
            # Check if game is over
            if done:
                winner_id = await self._determine_winner(state, game_id)
                
                # Update game record
                await self._finish_game(game_id, winner_id)
                
                # Broadcast game over
                await self._broadcast_to_game(game_id, {
                    "status": "game_over",
                    "winner": state["winner"].name if state["winner"] and hasattr(state["winner"], 'name') else None,
                    "final_state": self._serialize_game_state(state)
                })
                
                # Clean up game
                if game_id in self.game_environments:
                    del self.game_environments[game_id]
                self._cancel_inactivity_timer(game_id)
            else:
                # If game is not over, restart the inactivity timer for the next player
                self._start_inactivity_timer(game_id)
                
        except Exception as e:
            print(f"Error handling move: {e}")
            await websocket.send_json({"status": "error", "message": f"Invalid move: {str(e)}"})

    async def _initialize_game_environment(self, game_id: str):
        """Initialize game environment from database state."""
        try:
            async with AsyncSessionLocal() as db:
                game = await game_repository.get(db, id=uuid.UUID(game_id))
                if not game:
                    print(f"Game {game_id} not found in database")
                    return
                
                # Initialize fresh environment
                env = BaghchalEnv()
                
                # TODO: Reconstruct game state from moves if needed
                # For now, start with fresh state
                self.game_environments[game_id] = env
                
        except Exception as e:
            print(f"Error initializing game environment: {e}")

    async def _is_player_turn(self, user_id: uuid.UUID, game_id: str, env: BaghchalEnv) -> bool:
        """Check if it's the specified player's turn."""
        try:
            async with AsyncSessionLocal() as db:
                game = await game_repository.get(db, id=uuid.UUID(game_id))
                if not game:
                    return False
                
                current_state = env.get_state()
                current_player = current_state["current_player"]
                
                # Determine if this user should be playing as tiger or goat
                if current_player == Player.TIGER:
                    return str(user_id) == str(game.player_tiger_id)
                else:  # GOAT
                    return str(user_id) == str(game.player_goat_id)
                    
        except Exception as e:
            print(f"Error checking player turn: {e}")
            return False

    async def _store_move(self, game_id: str, user_id: uuid.UUID, move_data: tuple, env: BaghchalEnv):
        """Store a move in the database."""
        try:
            async with AsyncSessionLocal() as db:
                # Get current move count for move number
                existing_moves = await move_repository.get_moves_by_game(db, game_id=uuid.UUID(game_id))
                move_number = len(existing_moves) + 1
                
                # Convert move tuple to database format
                move_create_data = {
                    "game_id": uuid.UUID(game_id),
                    "player_id": user_id,
                    "move_number": move_number,
                    "to_row": move_data[1] if move_data[0] == 'place' else move_data[3],
                    "to_col": move_data[2] if move_data[0] == 'place' else move_data[4],
                    "move_type": "PLACEMENT" if move_data[0] == 'place' else "MOVE"
                }
                
                # Add from position if it's a move
                if move_data[0] == 'move':
                    move_create_data["from_row"] = move_data[1]
                    move_create_data["from_col"] = move_data[2]
                
                move_create = schemas.MoveCreate(**move_create_data)
                await move_repository.create_move(db, obj_in=move_create)
                
        except Exception as e:
            print(f"Error storing move: {e}")

    async def _determine_winner(self, state: dict, game_id: str) -> Optional[uuid.UUID]:
        """Determine the winner user ID from game state."""
        try:
            if not state.get("winner"):
                return None
                
            async with AsyncSessionLocal() as db:
                game = await game_repository.get(db, id=uuid.UUID(game_id))
                if not game:
                    return None
                
                winner_player = state["winner"]
                if winner_player == Player.TIGER:
                    return game.player_tiger_id
                elif winner_player == Player.GOAT:
                    return game.player_goat_id
                    
        except Exception as e:
            print(f"Error determining winner: {e}")
            return None

    async def _finish_game(self, game_id: str, winner_id: Optional[uuid.UUID]):
        """Update game record when finished."""
        try:
            async with AsyncSessionLocal() as db:
                game = await game_repository.get(db, id=uuid.UUID(game_id))
                if game:
                    game_update = schemas.GameUpdate(
                        status=schemas.GameStatus.COMPLETED,
                        winner_id=winner_id
                    )
                    await game_repository.update(db, db_obj=game, obj_in=game_update)

                    # Update player ratings for completed PvP games
                    if winner_id:
                        await self._update_ratings(db, game, winner_id)
        except Exception as e:
            print(f"Error finishing game: {e}")

    async def _broadcast_to_game(self, game_id: str, message: dict, exclude_user: Optional[str] = None):
        """Broadcast a message to all players in a game."""
        if game_id not in self.active_connections:
            return
        
        for user_id, websocket in self.active_connections[game_id].items():
            if exclude_user and user_id == exclude_user:
                continue
                
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to user {user_id}: {e}")

    def _convert_move_format(self, frontend_move: dict) -> tuple:
        """Convert frontend move format to backend tuple format."""
        if frontend_move.get("type") == "place":
            return ("place", frontend_move["to_row"], frontend_move["to_col"])
        elif frontend_move.get("type") == "move":
            return ("move", frontend_move["from_row"], frontend_move["from_col"], 
                   frontend_move["to_row"], frontend_move["to_col"])
        else:
            raise ValueError(f"Unknown move type: {frontend_move}")

    def _serialize_game_state(self, state: dict) -> dict:
        """Serialize game state for JSON transmission."""
        try:
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

    async def handle_forfeit(self, game_id: str):
        """Handle a player forfeit due to inactivity."""
        print(f"Game {game_id} forfeited due to inactivity.")
        if game_id not in self.game_environments:
            return

        env = self.game_environments[game_id]
        current_state = env.get_state()
        
        # Determine who timed out and who the winner is
        loser_player = current_state["current_player"]
        winner_player = Player.GOAT if loser_player == Player.TIGER else Player.TIGER
        
        async with AsyncSessionLocal() as db:
            game = await game_repository.get(db, id=uuid.UUID(game_id))
            if not game:
                return

            winner_id = game.player_goat_id if winner_player == Player.GOAT else game.player_tiger_id
            
            # Update game status to abandoned and set winner
            game_update = schemas.GameUpdate(status=schemas.GameStatus.ABANDONED, winner_id=winner_id)
            updated_game = await game_repository.update(db, db_obj=game, obj_in=game_update)

            # Apply rating update on forfeit as a win/loss
            if winner_id:
                try:
                    await self._update_ratings(db, updated_game, winner_id)
                except Exception as e:
                    print(f"Error updating ratings on forfeit: {e}")

        # Broadcast game over message
        await self._broadcast_to_game(game_id, {
            "status": "game_over",
            "winner": winner_player.name,
            "final_state": self._serialize_game_state(current_state),
            "message": f"{loser_player.name} forfeited due to inactivity."
        })

        # Clean up game
        self._cancel_inactivity_timer(game_id)
        if game_id in self.game_environments:
            del self.game_environments[game_id]
        if game_id in self.active_connections:
            del self.active_connections[game_id]

    async def _update_ratings(self, db: AsyncSession, game: models.Game, winner_id: uuid.UUID):
        """Compute ELO and persist rating changes and history for both players."""
        try:
            # Determine loser id
            p_tiger = game.player_tiger_id
            p_goat = game.player_goat_id
            loser_id = p_goat if str(winner_id) == str(p_tiger) else p_tiger

            winner_user = await user_repository.get(db, id=winner_id)
            loser_user = await user_repository.get(db, id=loser_id)
            if not winner_user or not loser_user:
                return

            winner_before = winner_user.rating
            loser_before = loser_user.rating

            new_winner, new_loser = calculate_elo(winner_before, loser_before, 1.0)

            winner_user.rating = new_winner
            loser_user.rating = new_loser
            db.add(winner_user)
            db.add(loser_user)
            await db.commit()

            # Record rating history for both players
            await rating_history_repository.create_rating_history(db, obj_in=schemas.RatingHistoryCreate(
                user_id=winner_user.user_id,
                game_id=game.game_id,
                rating_before=winner_before,
                rating_after=new_winner,
            ))
            await rating_history_repository.create_rating_history(db, obj_in=schemas.RatingHistoryCreate(
                user_id=loser_user.user_id,
                game_id=game.game_id,
                rating_before=loser_before,
                rating_after=new_loser,
            ))
        except Exception as e:
            print(f"Error updating ratings: {e}")

    def _start_inactivity_timer(self, game_id: str):
        """Start a timer that will trigger a forfeit if no move is made."""
        self._cancel_inactivity_timer(game_id) # Ensure no old timer is running
        loop = asyncio.get_running_loop()
        self.game_timers[game_id] = loop.call_later(
            self.inactivity_timeout,
            lambda: asyncio.create_task(self.handle_forfeit(game_id))
        )
        print(f"Inactivity timer started for game {game_id}")

    def _cancel_inactivity_timer(self, game_id: str):
        """Cancel the inactivity timer for a game."""
        if game_id in self.game_timers:
            self.game_timers[game_id].cancel()
            del self.game_timers[game_id]
            print(f"Inactivity timer cancelled for game {game_id}")


# Global game WebSocket manager
game_ws_manager = GameWebSocketManager() 