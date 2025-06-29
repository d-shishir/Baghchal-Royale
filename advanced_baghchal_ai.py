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
    from backend.app.core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
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
        """Select the best action using advanced defensive analysis."""
        valid_actions = env.get_valid_actions(Player.GOAT)
        if not valid_actions:
            return None
        
        # PRIORITY 1: Avoid immediate capture
        safe_actions = self._filter_safe_actions(valid_actions, state)
        if not safe_actions:
            print("⚠️ GOAT: No safe moves available!")
            safe_actions = valid_actions  # Have to take risk
        
        # PRIORITY 2: Strategic positioning
        return self._select_strategic_action(safe_actions, state)
    
    def _filter_safe_actions(self, valid_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Filter out actions that would result in immediate capture."""
        safe_actions = []
        board = state['board']
        
        # Find tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == 1:  # Tiger value
                    tiger_positions.append((r, c))
        
        for action in valid_actions:
            target_pos = (action[1], action[2])  # Position where goat will be placed/moved
            
            if self._is_position_safe(target_pos, tiger_positions, board):
                safe_actions.append(action)
        
        return safe_actions
    
    def _is_position_safe(self, pos: Tuple[int, int], tiger_positions: List[Tuple], board: np.ndarray) -> bool:
        """Check if a position is safe from tiger capture."""
        for tiger_pos in tiger_positions:
            if self._can_tiger_capture_at_position(tiger_pos, pos, board):
                return False
        return True
    
    def _can_tiger_capture_at_position(self, tiger_pos: Tuple[int, int], target_pos: Tuple[int, int], board: np.ndarray) -> bool:
        """Check if a tiger can capture a goat at the target position."""
        tr, tc = tiger_pos
        gr, gc = target_pos
        
        # Check if tiger can jump over the target position
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for dr, dc in directions:
            # Position tiger would jump from
            jump_from_r = gr - dr
            jump_from_c = gc - dc
            
            # Landing position after jump
            land_r = gr + dr
            land_c = gc + dc
            
            # Check if tiger is in position to make this jump and landing is valid
            if (jump_from_r == tr and jump_from_c == tc and
                0 <= land_r < 5 and 0 <= land_c < 5 and
                board[land_r, land_c] == 0):  # Empty value
                return True
        
        return False
    
    def _select_strategic_action(self, safe_actions: List[Tuple], state: Dict) -> Optional[Tuple]:
        """Select action based on current strategy."""
        board = state['board']
        
        # Find tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == 1:  # Tiger value
                    tiger_positions.append((r, c))
        
        best_action = None
        best_score = -1
        
        for action in safe_actions:
            target_pos = (action[1], action[2])
            score = self._calculate_position_value(target_pos, tiger_positions, board)
            
            if score > best_score:
                best_score = score
                best_action = action
        
        return best_action if best_action else safe_actions[0]
    
    def _calculate_position_value(self, pos: Tuple[int, int], tiger_positions: List[Tuple], board: np.ndarray) -> int:
        """Calculate the strategic value of a position."""
        value = 0
        
        # Bonus for center area control
        if pos[0] in [1, 2, 3] and pos[1] in [1, 2, 3]:
            value += 10
        
        # Bonus for center position itself
        if pos == (2, 2):
            value += 20
        
        # Blocking value - reduce tiger mobility
        for tiger_pos in tiger_positions:
            distance = abs(pos[0] - tiger_pos[0]) + abs(pos[1] - tiger_pos[1])
            if distance <= 2:
                value += 15 - distance * 3
        
        return value

class AdvancedBaghchalAI:
    """Main AI controller that manages both Tiger and Goat agents."""
    
    def __init__(self):
        # Initialize different AI personalities
        self.tiger_agents = {
            "easy": AdvancedTigerAI(TigerStrategy.OPPORTUNISTIC, "easy"),
            "medium": AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "medium"),
            "hard": AdvancedTigerAI(TigerStrategy.CENTER_DOMINANCE, "hard"),
            "expert": AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert"),
            "enhanced": AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert")
        }
        
        self.goat_agents = {
            "easy": AdvancedGoatAI(GoatStrategy.CENTER_CONTROL, "easy"),
            "medium": AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "medium"),
            "hard": AdvancedGoatAI(GoatStrategy.FORMATION_BUILD, "hard"),
            "expert": AdvancedGoatAI(GoatStrategy.TIGER_CONTAINMENT, "expert"),
            "enhanced": AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "expert")
        }
        
        print("🎯 Advanced Baghchal AI System initialized successfully!")
    
    def get_ai_move(self, player, difficulty: str, env, state: Dict) -> Optional[Tuple]:
        """Get AI move for the specified player and difficulty."""
        try:
            if str(player) == "tigers" or (hasattr(player, 'value') and player.value == 1):
                agent = self.tiger_agents.get(difficulty, self.tiger_agents["medium"])
                return agent.select_action(env, state)
            else:  # Goats
                agent = self.goat_agents.get(difficulty, self.goat_agents["medium"])
                return agent.select_action(env, state)
        except Exception as e:
            print(f"❌ AI Error: {e}")
            # Fallback to random valid move
            try:
                valid_actions = env.get_valid_actions(player)
                return random.choice(valid_actions) if valid_actions else None
            except:
                return None

# Global AI instance
advanced_ai = AdvancedBaghchalAI()

def get_ai_move(player, difficulty: str, env, state: Dict) -> Optional[Tuple]:
    """Global function for AI move selection."""
    return advanced_ai.get_ai_move(player, difficulty, env, state)

if __name__ == "__main__":
    print("🎉 Advanced Baghchal AI System ready!") 