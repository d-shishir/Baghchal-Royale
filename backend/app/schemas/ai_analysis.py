from pydantic import BaseModel
from typing import List, Dict, Any

class AIAnalysisRequest(BaseModel):
    num_games: int = 100
    q_learning_difficulty: str = "hard"
    guest_ai_difficulty: str = "medium"

class AIAnalysisResult(BaseModel):
    q_learning_wins: int
    guest_ai_wins: int
    draws: int
    results: List[Dict[str, Any]] 