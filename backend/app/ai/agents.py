"""
Advanced Baghchal AI System
Sophisticated strategic agents for Tigers and Goats with proper capture mechanics
"""

import numpy as np
import random
from typing import Dict, List, Tuple, Optional
from enum import Enum
import sys
from pathlib import Path

# Add backend path for imports
sys.path.append(str(Path(__file__).parent / "backend"))

try:
    from ..core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
except ImportError:
    print("Warning: Could not import BaghchalEnv from backend")

class TigerStrategy(Enum):
    AGGRESSIVE_HUNT = "aggressive_hunt"
    OPPORTUNISTIC = "opportunistic"
    CORNER_CONTROL = "corner_control"
    CENTER_DOMINANCE = "center_dominance"

class GoatStrategy(Enum):
    DEFENSIVE_BLOCK = "defensive_block"
    CENTER_CONTROL = "center_control"
    FORMATION_BUILD = "formation_build"
    TIGER_CONTAINMENT = "tiger_containment"

class AdvancedTigerAI:
    """Advanced Tiger AI with sophisticated hunting strategies."""
    
    def __init__(self, strategy: TigerStrategy = TigerStrategy.AGGRESSIVE_HUNT, difficulty: str = "expert"):
        self.strategy = strategy
        self.difficulty = difficulty
        print(f"🐅 Advanced Tiger AI initialized: {strategy.value} ({difficulty})")
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """Select the best action using advanced strategic analysis."""
        valid_actions = env.get_valid_actions(Player.TIGER)
        if not valid_actions:
            return None
        
        # PRIORITY 1: Always prioritize captures
        capture_actions = self._find_capture_actions(valid_actions, state['board'])
        if capture_actions:
            print(f"🎯 TIGER found {len(capture_actions)} capture opportunities!")
            return self._select_best_capture(capture_actions, state)
        
        # PRIORITY 2: Strategic positioning
        return self._select_strategic_action(valid_actions, state)
    
    def _find_capture_actions(self, valid_actions: List[Tuple], board: np.ndarray) -> List[Tuple]:
        """Find all actions that result in capturing goats."""
        capture_actions = []
        
        for action in valid_actions:
            if len(action) == 5 and action[0] == 'move':
                from_r, from_c, to_r, to_c = action[1], action[2], action[3], action[4]
                
                # Check if this is a capture move (distance > 1 indicates a jump)
                distance = max(abs(to_r - from_r), abs(to_c - from_c))
                if distance > 1:
                    # Verify there's a goat to capture
                    mid_r = (from_r + to_r) // 2
                    mid_c = (from_c + to_c) // 2
                    if 0 <= mid_r < 5 and 0 <= mid_c < 5 and board[mid_r, mid_c] == 2:  # Goat value
                        capture_actions.append(action)
        
        return capture_actions
    
    def _select_best_capture(self, capture_actions: List[Tuple], state: Dict) -> Tuple:
        """Select the best capture action."""
        # For now, just return the first capture (all captures are valuable)
        return capture_actions[0]
    
    def _select_strategic_action(self, valid_actions: List[Tuple], state: Dict) -> Optional[Tuple]:
        """Select action based on current strategy."""
        board = state['board']
        
        # Find goat positions
        goat_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == 2:  # Goat value
                    goat_positions.append((r, c))
        
        best_action = None
        best_score = -1
        
        for action in valid_actions:
            if len(action) >= 5 and action[0] == 'move':
                from_r, from_c, to_r, to_c = action[1], action[2], action[3], action[4]
                
                # Score based on proximity to goats
                score = 0
                for goat_r, goat_c in goat_positions:
                    old_distance = abs(from_r - goat_r) + abs(from_c - goat_c)
                    new_distance = abs(to_r - goat_r) + abs(to_c - goat_c)
                    if new_distance < old_distance:
                        score += 10  # Getting closer to goat
                    
                    # Bonus for adjacent positioning (setup for capture)
                    if new_distance == 1:
                        score += 20
                
                # Bonus for center control
                if (to_r, to_c) == (2, 2):
                    score += 15
                
                if score > best_score:
                    best_score = score
                    best_action = action
        
        return best_action if best_action else random.choice(valid_actions)

class AdvancedGoatAI:
    """Advanced Goat AI with sophisticated defensive strategies."""
    
    def __init__(self, strategy: GoatStrategy = GoatStrategy.DEFENSIVE_BLOCK, difficulty: str = "expert"):
        self.strategy = strategy
        self.difficulty = difficulty
        print(f"🐐 Advanced Goat AI initialized: {strategy.value} ({difficulty})")
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """Selects an action based on the goat's strategy."""
        valid_actions = env.get_valid_actions(Player.GOAT)
        if not valid_actions:
            return None
        
        # Simple defensive placement: avoid placing next to a tiger if possible.
        if state.get('phase') == GamePhase.PLACEMENT:
            best_placement = None
            best_score = -float('inf')
            
            # Find all empty spots for placement
            for r in range(env.board_size):
                for c in range(env.board_size):
                    if state['board'][r, c] == PieceType.EMPTY.value:
                        action = ('place', r, c)
                        score = self._score_placement((r, c), state['board'], env)
                        if score > best_score:
                            best_score = score
                            best_placement = action
            
            return best_placement

        # Movement phase: prioritize moves that block tigers
        elif state.get('phase') == GamePhase.MOVEMENT:
            board = state['board']
            
            # --- New blocking logic ---
            best_move = None
            min_tiger_moves = float('inf')

            # Evaluate each valid move
            for action in valid_actions:
                if action[0] != 'move': continue

                from_pos, to_pos = action[1], action[2]
                
                # Simulate the move on a temporary board
                temp_board = np.copy(board)
                temp_board[from_pos[0], from_pos[1]] = 0
                temp_board[to_pos[0], to_pos[1]] = 2
                
                # Calculate how many moves tigers have after our move
                tiger_mobility = self._calculate_tiger_mobility(temp_board, env)

                # We want the move that results in the *fewest* tiger moves
                if tiger_mobility < min_tiger_moves:
                    min_tiger_moves = tiger_mobility
                    best_move = action
            
            if best_move:
                return best_move
            # --- End of new logic ---

        # Fallback to random action if no other logic works
        return random.choice(valid_actions) if valid_actions else None

    def _score_placement(self, pos: Tuple[int, int], board: np.ndarray, env: 'BaghchalEnv') -> int:
        """Scores a potential goat placement based on safety and strategic value."""
        score = 0
        
        # 1. Check for immediate capture vulnerability (HIGH penalty)
        # Temporarily place a goat to see what tigers could do
        temp_board = np.copy(board)
        temp_board[pos] = PieceType.GOAT.value
        
        for r in range(env.board_size):
            for c in range(env.board_size):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_pos = (r, c)
                    # Check if this tiger can capture the newly placed goat
                    jump_dir_r = pos[0] - tiger_pos[0]
                    jump_dir_c = pos[1] - tiger_pos[1]
                    
                    # This implies the tiger is one step away from the goat
                    if abs(jump_dir_r) <= 1 and abs(jump_dir_c) <= 1:
                        landing_pos = (pos[0] + jump_dir_r, pos[1] + jump_dir_c)
                        if (0 <= landing_pos[0] < env.board_size and
                            0 <= landing_pos[1] < env.board_size and
                            board[landing_pos] == PieceType.EMPTY.value and
                            env.is_adjacent(pos, landing_pos) and
                            env.is_adjacent(tiger_pos, pos)):
                             # This placement creates a capture lane for the tiger
                            score -= 100 # Heavy penalty

        # 2. Reward for building formations (adjacent to other goats)
        for neighbor in env.adjacency_matrix.get(pos, []):
            if board[neighbor] == PieceType.GOAT.value:
                score += 10 # Reward for being next to a friendly goat

        # 3. Penalty for being close to tigers
        for r in range(env.board_size):
            for c in range(env.board_size):
                if board[r, c] == PieceType.TIGER.value:
                    # Manhattan distance
                    distance = abs(pos[0] - r) + abs(pos[1] - c)
                    if distance == 1:
                        score -= 5 # Adjacent to tiger is risky
                    elif distance == 2:
                        score -= 2
                        
        return score

    def _calculate_tiger_mobility(self, board: np.ndarray, env: 'BaghchalEnv') -> int:
        """
        Calculates the total number of valid moves for all tigers on the given board
        by using the environment's own move validation logic for accuracy.
        """
        mobility = 0
        for r in range(env.board_size):
            for c in range(env.board_size):
                if board[r, c] == PieceType.TIGER.value:
                    pos = (r, c)
                    # Use a helper that mirrors env's logic but on a given board
                    mobility += len(self._get_valid_moves_for_tiger_on_board(pos, board, env))
        return mobility

    def _get_valid_moves_for_tiger_on_board(self, position: Tuple[int, int], board: np.ndarray, env: 'BaghchalEnv') -> List[Tuple[int, int]]:
        """
        Gets valid moves for a tiger at a given position on a given board.
        This is a re-implementation of the environment's logic to work on temporary boards.
        """
        valid_moves = []
        # Check standard moves to adjacent empty positions
        for neighbor in env.adjacency_matrix.get(position, []):
            if board[neighbor[0], neighbor[1]] == PieceType.EMPTY.value:
                valid_moves.append(neighbor)
        
        # Check capture moves
        for neighbor in env.adjacency_matrix.get(position, []):
            if board[neighbor[0], neighbor[1]] == PieceType.GOAT.value:
                # Potential capture, find where the tiger could land
                jump_dir_r = neighbor[0] - position[0]
                jump_dir_c = neighbor[1] - position[1]
                landing_pos = (neighbor[0] + jump_dir_r, neighbor[1] + jump_dir_c)

                # Check if landing position is on board, empty, and a valid jump
                if (0 <= landing_pos[0] < env.board_size and
                    0 <= landing_pos[1] < env.board_size and
                    board[landing_pos[0], landing_pos[1]] == PieceType.EMPTY.value and
                    env.is_adjacent(neighbor, landing_pos)):
                    valid_moves.append(landing_pos)
                    
        return valid_moves

if __name__ == "__main__":
    print("🎉 Advanced Baghchal AI System ready!") 