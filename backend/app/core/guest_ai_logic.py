import random
from typing import Optional, Tuple, Dict
from app.core.baghchal_env import BaghchalEnv, Player
from app.schemas.ai import GameState

class GuestModeAI:
    def __init__(self, difficulty: str = "medium"):
        self.difficulty = difficulty

    def get_move(self, state: Dict) -> Optional[Tuple]:
        env = BaghchalEnv()
        # Convert dict state to environment state
        env.board = state['board']
        env.current_player = state['current_player']
        env.goats_captured = state['goats_captured']
        env.goats_placed = state['goats_placed']
        env.phase = state['phase']
        
        valid_actions = env.get_valid_actions(env.current_player)

        if not valid_actions:
            return None

        if self.difficulty == "easy":
            return random.choice(valid_actions)
        else:
            # Simple minimax for medium/hard
            best_move = None
            best_score = float('-inf')
            for move in valid_actions:
                # Create a copy of the environment to simulate the move
                temp_env = BaghchalEnv()
                temp_env.board = env.board.copy()
                temp_env.current_player = env.current_player
                temp_env.goats_captured = env.goats_captured
                temp_env.goats_placed = env.goats_placed
                temp_env.phase = env.phase
                
                new_state, _, _, _ = temp_env.step(move)
                score = self._evaluate_state(new_state, env.current_player)
                if score > best_score:
                    best_score = score
                    best_move = move
            return best_move

    def _evaluate_state(self, state: Dict, player: Player) -> float:
        # A simple evaluation function
        if state['game_over']:
            if state['winner'] == player:
                return 100
            elif state['winner'] is None:
                return 0
            else:
                return -100
        
        return random.random() # Placeholder for more complex evaluation 