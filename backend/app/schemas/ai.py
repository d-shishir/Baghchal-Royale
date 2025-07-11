from pydantic import BaseModel, ConfigDict
from typing import List, Tuple, Optional
import uuid

class GameState(BaseModel):
    board: List[List[str]]
    currentPlayer: str
    phase: str
    goatsCaptured: int
    goatsPlaced: int
    
    model_config = ConfigDict(extra='ignore')

class AIInput(BaseModel):
    difficulty: str
    game_state: GameState
    user_id: uuid.UUID
    ai_game_id: Optional[uuid.UUID] = None
    player_side: str 