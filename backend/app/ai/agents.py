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
    ADVANCED_TRAPPING = "advanced_trapping"
    WALL_BUILDER = "wall_builder"

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
    """Advanced Goat AI with sophisticated defensive and trapping strategies."""
    
    def __init__(self, strategy: GoatStrategy = GoatStrategy.DEFENSIVE_BLOCK, difficulty: str = "expert"):
        self.strategy = strategy
        self.difficulty = difficulty
        print(f"🐐 Advanced Goat AI initialized: {strategy.value} ({difficulty})")
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """Enhanced action selection with priority-based decision making."""
        valid_actions = env.get_valid_actions(Player.GOAT)
        if not valid_actions:
            return None
        
        # PRIORITY 1: Avoid immediate capture threats
        safe_actions = self._filter_safe_actions(valid_actions, state)
        if not safe_actions:
            print("⚠️ GOAT AI: No safe moves available, looking for escape moves.")
            # Try to find moves that at least improve the situation
            escape_actions = self._find_escape_moves(valid_actions, state)
            safe_actions = escape_actions if escape_actions else valid_actions
        
        # PRIORITY 2: Among safe moves, find trapping opportunities
        trapping_actions = self._find_trapping_moves(safe_actions, state)
        if trapping_actions:
            print(f"🎯 GOAT AI: Found {len(trapping_actions)} tiger trapping opportunities!")
            return self._select_best_trapping_move(trapping_actions, state)
        
        # PRIORITY 3: Formation building and strategic positioning
        return self._select_strategic_move(safe_actions, state)
    
    def _filter_safe_actions(self, valid_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Filter out moves that would result in immediate capture."""
        safe_actions = []
        board = state['board']
        
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        for action in valid_actions:
            if action[0] == 'place':
                target_pos = (action[1], action[2])
            elif action[0] == 'move':
                target_pos = (action[3], action[4])
            else:
                continue
            
            if self._is_position_safe(target_pos, tiger_positions, board):
                safe_actions.append(action)
        
        return safe_actions
    
    def _find_escape_moves(self, valid_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Find moves that increase distance from tigers."""
        escape_moves = []
        board = state['board']
        
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        for action in valid_actions:
            if action[0] == 'move':
                from_pos = (action[1], action[2])
                to_pos = (action[3], action[4])
                
                # Calculate distance improvement
                old_min_dist = min([abs(from_pos[0] - tp[0]) + abs(from_pos[1] - tp[1]) 
                                   for tp in tiger_positions] or [999])
                new_min_dist = min([abs(to_pos[0] - tp[0]) + abs(to_pos[1] - tp[1]) 
                                   for tp in tiger_positions] or [999])
                
                if new_min_dist > old_min_dist:
                    escape_moves.append(action)
        
        return escape_moves
    
    def _find_trapping_moves(self, safe_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Find moves that reduce tiger mobility (trapping effect)."""
        trapping_moves = []
        board = state['board']
        
        current_tiger_mobility = self._calculate_tiger_mobility(board)
        
        for action in safe_actions:
            # Simulate the move
            temp_board = np.copy(board)
            
            if action[0] == 'place':
                temp_board[action[1], action[2]] = PieceType.GOAT.value
            elif action[0] == 'move':
                temp_board[action[1], action[2]] = PieceType.EMPTY.value
                temp_board[action[3], action[4]] = PieceType.GOAT.value
            
            new_tiger_mobility = self._calculate_tiger_mobility(temp_board)
            
            # If this move reduces tiger mobility, it's a trapping move
            if new_tiger_mobility < current_tiger_mobility:
                trapping_moves.append(action)
        
        return trapping_moves
    
    def _select_best_trapping_move(self, trapping_moves: List[Tuple], state: Dict) -> Optional[Tuple]:
        """Select the move that most reduces tiger mobility."""
        board = state['board']
        current_mobility = self._calculate_tiger_mobility(board)
        
        best_move = None
        best_reduction = 0
        
        for action in trapping_moves:
            temp_board = np.copy(board)
            
            if action[0] == 'place':
                temp_board[action[1], action[2]] = PieceType.GOAT.value
            elif action[0] == 'move':
                temp_board[action[1], action[2]] = PieceType.EMPTY.value
                temp_board[action[3], action[4]] = PieceType.GOAT.value
            
            new_mobility = self._calculate_tiger_mobility(temp_board)
            reduction = current_mobility - new_mobility
            
            if reduction > best_reduction:
                best_reduction = reduction
                best_move = action
        
        print(f"🎯 GOAT AI: Selected trapping move reducing tiger mobility by {best_reduction}")
        return best_move
    
    def _calculate_tiger_mobility(self, board: np.ndarray) -> int:
        """Calculate total number of moves available to all tigers."""
        total_moves = 0
        
        # Find tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        # Count moves for each tiger
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for tr, tc in tiger_positions:
            for dr, dc in directions:
                new_r, new_c = tr + dr, tc + dc
                
                # Regular move
                if (0 <= new_r < 5 and 0 <= new_c < 5 and 
                    board[new_r, new_c] == PieceType.EMPTY.value):
                    total_moves += 1
                
                # Capture move
                elif (0 <= new_r < 5 and 0 <= new_c < 5 and 
                      board[new_r, new_c] == PieceType.GOAT.value):
                    jump_r, jump_c = new_r + dr, new_c + dc
                    if (0 <= jump_r < 5 and 0 <= jump_c < 5 and 
                        board[jump_r, jump_c] == PieceType.EMPTY.value):
                        total_moves += 2  # Captures count more
        
        return total_moves
    
    def _is_position_safe(self, pos: Tuple[int, int], tiger_positions: List[Tuple], board: np.ndarray) -> bool:
        """Check if a position is safe from immediate capture."""
        for tiger_pos in tiger_positions:
            if self._can_tiger_capture_at_position(tiger_pos, pos, board):
                return False
        return True
    
    def _can_tiger_capture_at_position(self, tiger_pos: Tuple[int, int], target_pos: Tuple[int, int], board: np.ndarray) -> bool:
        """Check if tiger can capture at target position."""
        tr, tc = tiger_pos
        gr, gc = target_pos
        
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for dr, dc in directions:
            # Check if tiger is one step away and can jump over target
            if (tr + dr == gr and tc + dc == gc):
                land_r, land_c = gr + dr, gc + dc
                if (0 <= land_r < 5 and 0 <= land_c < 5 and 
                    board[land_r, land_c] == PieceType.EMPTY.value):
                    return True
        
        return False
    
    def _select_strategic_move(self, safe_actions: List[Tuple], state: Dict) -> Optional[Tuple]:
        """Select move based on strategic value with enhanced formation building."""
        if not safe_actions:
            return None
        
        board = state['board']
        
        # Get positions of all pieces
        tiger_positions = []
        goat_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
                elif board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        best_action = None
        best_score = -999
        
        for action in safe_actions:
            if action[0] == 'place':
                target_pos = (action[1], action[2])
            elif action[0] == 'move':
                target_pos = (action[3], action[4])
            else:
                continue
            
            score = self._calculate_position_value(target_pos, tiger_positions, goat_positions, board)
            
            if score > best_score:
                best_score = score
                best_action = action
        
        return best_action if best_action else safe_actions[0]
    
    def _calculate_position_value(self, pos: Tuple[int, int], tiger_positions: List[Tuple], 
                                goat_positions: List[Tuple], board: np.ndarray) -> int:
        """Calculate strategic value of a position."""
        value = 0
        
        # Formation building - bonus for being near other goats
        for goat_pos in goat_positions:
            distance = abs(pos[0] - goat_pos[0]) + abs(pos[1] - goat_pos[1])
            if distance == 1:
                value += 25  # Strong formation bonus
            elif distance == 2:
                value += 10  # Proximity bonus
        
        # Strategic positions
        if pos in [(0, 0), (0, 4), (4, 0), (4, 4)]:  # Corners
            value += 15
        elif pos[0] == 0 or pos[0] == 4 or pos[1] == 0 or pos[1] == 4:  # Edges
            value += 10
        
        # Center control
        if pos == (2, 2):
            value += 20
        elif pos[0] in [1, 2, 3] and pos[1] in [1, 2, 3]:
            value += 8
        
        # Tiger blocking - maintain distance for effective blocking
        for tiger_pos in tiger_positions:
            distance = abs(pos[0] - tiger_pos[0]) + abs(pos[1] - tiger_pos[1])
            if distance == 2:
                value += 20  # Optimal blocking distance
            elif distance == 3:
                value += 10  # Still useful
        
        return value

if __name__ == "__main__":
    print("🎉 Advanced Baghchal AI System ready!") 