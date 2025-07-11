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

# Import from the same core directory
try:
    from .baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
    print("✅ Successfully imported Player from baghchal_env")
except ImportError as e:
    print(f"Warning: Could not import BaghchalEnv from backend: {e}")
    # Fallback enum definitions if import fails
    class Player(Enum):
        TIGER = 1
        GOAT = 2

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
            print("❌ TIGER AI: No valid actions available from environment.")
            return None
        
        print(f"🔍 TIGER AI: Found {len(valid_actions)} valid actions.")
        
        # PRIORITY 1: Always prioritize captures
        capture_actions = self._find_capture_actions(valid_actions, state['board'])
        if capture_actions:
            print(f"🎯 TIGER AI: Found {len(capture_actions)} capture opportunities!")
            return self._select_best_capture(capture_actions, state)
        
        # PRIORITY 2: Strategic positioning
        print("✅ TIGER AI: No captures, selecting strategic move.")
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
        selected_capture = capture_actions[0]
        print(f"✅ TIGER AI: Selected best capture: {selected_capture}")
        return selected_capture
    
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
        
        if best_action:
            print(f"✅ TIGER AI: Selected best strategic action with score {best_score}: {best_action}")
            return best_action
        else:
            # Fallback to a random valid action if no strategic action is found
            selected_action = random.choice(valid_actions)
            print(f"⚠️ TIGER AI: No best action found, defaulting to random action: {selected_action}")
            return selected_action

class AdvancedGoatAI:
    """Advanced Goat AI with sophisticated defensive and trapping strategies."""
    
    def __init__(self, strategy: GoatStrategy = GoatStrategy.DEFENSIVE_BLOCK, difficulty: str = "expert"):
        self.strategy = strategy
        self.difficulty = difficulty
        print(f"🐐 Advanced Goat AI initialized: {strategy.value} ({difficulty})")
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """Select the best action using advanced defensive and trapping analysis."""
        valid_actions = env.get_valid_actions(Player.GOAT)
        if not valid_actions:
            print(f"❌ GOAT AI: No valid actions available from environment.")
            return None
        
        print(f"🔍 GOAT AI: Found {len(valid_actions)} valid actions. Phase: {state.get('phase')}. First 5 actions: {valid_actions[:5]}")
        
        # PRIORITY 1: Avoid immediate capture threats
        safe_actions = self._filter_safe_actions(valid_actions, state)
        if not safe_actions:
            print("⚠️ GOAT AI: No completely safe moves available, checking escape moves.")
            # If no completely safe moves, try to find moves that at least escape current threats
            escape_actions = self._find_escape_actions(valid_actions, state)
            safe_actions = escape_actions if escape_actions else valid_actions
            print(f"🐐 GOAT AI: Using {len(safe_actions)} escape/risk actions.")
        else:
            print(f"✅ GOAT AI: Found {len(safe_actions)} safe actions out of {len(valid_actions)} valid actions.")
        
        # PRIORITY 2: Among safe moves, prioritize tiger trapping
        trapping_actions = self._find_trapping_actions(safe_actions, state)
        if trapping_actions:
            print(f"🎯 GOAT AI: Found {len(trapping_actions)} tiger trapping opportunities!")
            return self._select_best_trapping_action(trapping_actions, state)
        
        # PRIORITY 3: Formation building and strategic positioning
        return self._select_strategic_action(safe_actions, state)
    
    def _filter_safe_actions(self, valid_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Filter out actions that would result in immediate capture."""
        safe_actions = []
        board = state['board']
        
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == 1:
                    tiger_positions.append((r, c))
        
        for action in valid_actions:
            if action[0] == 'place':
                target_pos = (action[1], action[2])
            elif action[0] == 'move':
                target_pos = (action[3], action[4])
            else:
                continue
            
            if self._is_position_safe(target_pos, tiger_positions, board, action):
                safe_actions.append(action)
        
        return safe_actions
    
    def _find_escape_actions(self, valid_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Find actions that move goats away from immediate tiger threats."""
        escape_actions = []
        board = state['board']
        
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == 1:
                    tiger_positions.append((r, c))
        
        for action in valid_actions:
            if action[0] == 'move':
                from_pos = (action[1], action[2])
                to_pos = (action[3], action[4])
                
                # Check if this move increases distance from nearest tiger
                current_min_distance = min([abs(from_pos[0] - tp[0]) + abs(from_pos[1] - tp[1]) 
                                          for tp in tiger_positions] or [999])
                new_min_distance = min([abs(to_pos[0] - tp[0]) + abs(to_pos[1] - tp[1]) 
                                      for tp in tiger_positions] or [999])
                
                if new_min_distance > current_min_distance:
                    escape_actions.append(action)
            elif action[0] == 'place':
                # For placement, just check if it's not adjacent to tigers
                target_pos = (action[1], action[2])
                min_distance = min([abs(target_pos[0] - tp[0]) + abs(target_pos[1] - tp[1]) 
                                  for tp in tiger_positions] or [999])
                if min_distance > 1:
                    escape_actions.append(action)
        
        return escape_actions
    
    def _find_trapping_actions(self, safe_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Find actions that help trap tigers by reducing their mobility."""
        trapping_actions = []
        board = state['board']
        
        for action in safe_actions:
            # Simulate the action on a temporary board
            temp_board = np.copy(board)
            
            if action[0] == 'place':
                temp_board[action[1], action[2]] = 2  # Place goat
            elif action[0] == 'move':
                temp_board[action[1], action[2]] = 0  # Remove from old position
                temp_board[action[3], action[4]] = 2  # Place at new position
            
            # Calculate tiger mobility before and after
            current_mobility = self._calculate_tiger_mobility(board)
            new_mobility = self._calculate_tiger_mobility(temp_board)
            
            # If this action reduces tiger mobility, it's a trapping action
            if new_mobility < current_mobility:
                trapping_actions.append(action)
        
        return trapping_actions
    
    def _select_best_trapping_action(self, trapping_actions: List[Tuple], state: Dict) -> Optional[Tuple]:
        """Select the trapping action that most reduces tiger mobility."""
        board = state['board']
        best_action = None
        best_mobility_reduction = 0
        
        current_mobility = self._calculate_tiger_mobility(board)
        
        for action in trapping_actions:
            # Simulate the action
            temp_board = np.copy(board)
            
            if action[0] == 'place':
                temp_board[action[1], action[2]] = 2
            elif action[0] == 'move':
                temp_board[action[1], action[2]] = 0
                temp_board[action[3], action[4]] = 2
            
            new_mobility = self._calculate_tiger_mobility(temp_board)
            mobility_reduction = current_mobility - new_mobility
            
            if mobility_reduction > best_mobility_reduction:
                best_mobility_reduction = mobility_reduction
                best_action = action
        
        if best_action:
            print(f"🎯 GOAT AI: Selected trapping action reducing tiger mobility by {best_mobility_reduction}: {best_action}")
            return best_action
        
        return trapping_actions[0] if trapping_actions else None
    
    def _calculate_tiger_mobility(self, board: np.ndarray) -> int:
        """Calculate total number of moves available to all tigers."""
        total_moves = 0
        
        # Find all tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == 1:
                    tiger_positions.append((r, c))
        
        # Count valid moves for each tiger
        for tiger_pos in tiger_positions:
            tr, tc = tiger_pos
            
            # Check all 8 directions for regular moves
            directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
            
            for dr, dc in directions:
                new_r, new_c = tr + dr, tc + dc
                
                # Regular move
                if (0 <= new_r < 5 and 0 <= new_c < 5 and board[new_r, new_c] == 0):
                    total_moves += 1
                
                # Capture move (jump over goat)
                elif (0 <= new_r < 5 and 0 <= new_c < 5 and board[new_r, new_c] == 2):
                    jump_r, jump_c = new_r + dr, new_c + dc
                    if (0 <= jump_r < 5 and 0 <= jump_c < 5 and board[jump_r, jump_c] == 0):
                        total_moves += 2  # Captures are more valuable, count double
        
        return total_moves
    
    def _is_position_safe(self, pos: Tuple[int, int], tiger_positions: List[Tuple], board: np.ndarray, action: Tuple) -> bool:
        """Enhanced safety check that considers multiple threat patterns."""
        # Check direct capture threats
        for tiger_pos in tiger_positions:
            if self._can_tiger_capture_at_position(tiger_pos, pos, board):
                return False
        
        # Check if moving into a "sandwich" position between two tigers
        if action[0] == 'move':
            if self._is_sandwich_position(pos, tiger_positions):
                return False
        
        # Check if adjacent to too many tigers (risky position)
        adjacent_tigers = 0
        for tiger_pos in tiger_positions:
            distance = abs(pos[0] - tiger_pos[0]) + abs(pos[1] - tiger_pos[1])
            if distance == 1:
                adjacent_tigers += 1
        
        # Being adjacent to more than one tiger is usually dangerous
        if adjacent_tigers > 1:
            return False
        
        return True
    
    def _is_sandwich_position(self, pos: Tuple[int, int], tiger_positions: List[Tuple]) -> bool:
        """Check if position is between two tigers in a line (dangerous sandwich)."""
        for i, tiger1 in enumerate(tiger_positions):
            for j, tiger2 in enumerate(tiger_positions):
                if i >= j:
                    continue
                
                # Check if pos is on the line between tiger1 and tiger2
                if self._is_on_line(tiger1, pos, tiger2):
                    return True
        
        return False
    
    def _is_on_line(self, p1: Tuple[int, int], p2: Tuple[int, int], p3: Tuple[int, int]) -> bool:
        """Check if p2 is on the line between p1 and p3."""
        # For grid positions, check if they're collinear and p2 is between p1 and p3
        dx1, dy1 = p2[0] - p1[0], p2[1] - p1[1]
        dx2, dy2 = p3[0] - p2[0], p3[1] - p2[1]
        
        # Check if vectors are in same direction (collinear and same direction)
        if dx1 == 0 and dx2 == 0:  # Vertical line
            return (p1[1] < p2[1] < p3[1]) or (p3[1] < p2[1] < p1[1])
        elif dy1 == 0 and dy2 == 0:  # Horizontal line
            return (p1[0] < p2[0] < p3[0]) or (p3[0] < p2[0] < p1[0])
        elif dx1 * dy2 == dx2 * dy1 and dx1 * dx2 >= 0 and dy1 * dy2 >= 0:  # Diagonal line
            return True
        
        return False
    
    def _can_tiger_capture_at_position(self, tiger_pos: Tuple[int, int], target_pos: Tuple[int, int], board: np.ndarray) -> bool:
        """Enhanced capture detection that considers all valid tiger jump patterns."""
        tr, tc = tiger_pos
        gr, gc = target_pos
        
        # Check all 8 directions for potential jumps
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for dr, dc in directions:
            # Check if tiger can jump over target position in this direction
            if (tr + dr == gr and tc + dc == gc):  # Tiger is one step away from target
                land_r, land_c = gr + dr, gc + dc  # Landing position after jump
                
                # Check if landing position is valid and empty
                if (0 <= land_r < 5 and 0 <= land_c < 5 and board[land_r, land_c] == 0):
                    return True
        
        return False
    
    def _select_strategic_action(self, safe_actions: List[Tuple], state: Dict) -> Optional[Tuple]:
        """Enhanced strategic selection with formation building and positioning."""
        if not safe_actions:
            print("❌ GOAT AI: No actions (safe or otherwise) to select from.")
            return None
        
        board = state['board']
        tiger_positions = []
        goat_positions = []
        
        for r in range(5):
            for c in range(5):
                if board[r, c] == 1:
                    tiger_positions.append((r, c))
                elif board[r, c] == 2:
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

            score = self._calculate_enhanced_position_value(target_pos, tiger_positions, goat_positions, board, action)
            
            if score > best_score:
                best_score = score
                best_action = action
        
        if best_action:
            print(f"✅ GOAT AI: Selected strategic action with score {best_score}: {best_action}")
            return best_action
        else:
            selected_action = safe_actions[0]
            print(f"⚠️ GOAT AI: No best action found, defaulting to first available action: {selected_action}")
            return selected_action
    
    def _calculate_enhanced_position_value(self, pos: Tuple[int, int], tiger_positions: List[Tuple], 
                                         goat_positions: List[Tuple], board: np.ndarray, action: Tuple) -> int:
        """Enhanced position evaluation considering formations, blocking, and strategic value."""
        if not isinstance(pos, tuple) or len(pos) != 2:
            return -999
        
        value = 0
        
        # 1. Formation building - bonus for being near other goats
        goat_neighbors = 0
        for goat_pos in goat_positions:
            distance = abs(pos[0] - goat_pos[0]) + abs(pos[1] - goat_pos[1])
            if distance == 1:
                goat_neighbors += 1
                value += 25  # Strong bonus for formation
            elif distance == 2:
                value += 10  # Moderate bonus for proximity
        
        # 2. Strategic positions - corners and edges can be good for defense
        if pos in [(0, 0), (0, 4), (4, 0), (4, 4)]:  # Corners
            value += 15
        elif pos[0] == 0 or pos[0] == 4 or pos[1] == 0 or pos[1] == 4:  # Edges
            value += 10
        
        # 3. Center control (but not as important as safety)
        if pos == (2, 2):
            value += 20
        elif pos[0] in [1, 2, 3] and pos[1] in [1, 2, 3]:
            value += 8
        
        # 4. Tiger blocking value - positions that limit tiger movement
        for tiger_pos in tiger_positions:
            distance = abs(pos[0] - tiger_pos[0]) + abs(pos[1] - tiger_pos[1])
            
            # Moderate distance is good for blocking without being too risky
            if distance == 2:
                value += 20  # Sweet spot for blocking
            elif distance == 3:
                value += 10  # Still helpful for area control
            elif distance == 1:
                value -= 5   # Too close can be risky even if marked safe
        
        # 5. Bonus for moves that create "walls" or lines of goats
        if action[0] == 'place' or action[0] == 'move':
            wall_bonus = self._calculate_wall_formation_bonus(pos, goat_positions)
            value += wall_bonus
        
        # 6. Penalty for isolated positions
        if goat_neighbors == 0:
            nearest_goat_distance = min([abs(pos[0] - gp[0]) + abs(pos[1] - gp[1]) 
                                       for gp in goat_positions] or [999])
            if nearest_goat_distance > 3:
                value -= 15  # Penalty for being too isolated
        
        return value
    
    def _calculate_wall_formation_bonus(self, pos: Tuple[int, int], goat_positions: List[Tuple]) -> int:
        """Calculate bonus for creating wall-like formations that can trap tigers."""
        bonus = 0
        
        # Check for horizontal, vertical, and diagonal line formations
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]  # right, down, diagonal-down-right, diagonal-down-left
        
        for dr, dc in directions:
            line_length = 1  # Start with current position
            
            # Check in positive direction
            r, c = pos[0] + dr, pos[1] + dc
            while 0 <= r < 5 and 0 <= c < 5 and (r, c) in goat_positions:
                line_length += 1
                r, c = r + dr, c + dc
            
            # Check in negative direction
            r, c = pos[0] - dr, pos[1] - dc
            while 0 <= r < 5 and 0 <= c < 5 and (r, c) in goat_positions:
                line_length += 1
                r, c = r - dr, c - dc
            
            # Bonus for longer lines (more effective barriers)
            if line_length >= 3:
                bonus += line_length * 5
        
        return bonus

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
            "expert": AdvancedGoatAI(GoatStrategy.ADVANCED_TRAPPING, "expert"),
            "enhanced": AdvancedGoatAI(GoatStrategy.WALL_BUILDER, "expert")
        }
        
        print("🎯 Advanced Baghchal AI System initialized successfully!")
        print("🐐 Enhanced Goat AI: Now focuses on capture avoidance and tiger trapping!")
    
    def get_ai_move(self, player, difficulty: str, state: Dict) -> Optional[Tuple]:
        """Get the AI's move based on the provided game state."""
        
        difficulty_lower = difficulty.lower()

        # Determine which AI to use
        if player == Player.TIGER:
            ai_agent = self.tiger_agents.get(difficulty_lower)
        elif player == Player.GOAT:
            ai_agent = self.goat_agents.get(difficulty_lower)
        else:
            ai_agent = None

        if not ai_agent:
            print(f"🚨 No AI agent found for player {player} and difficulty {difficulty}")
            return None
            
        print(f"🤖 Using AI: {type(ai_agent).__name__} for player {player}")
        
        # The AI needs a BaghchalEnv to calculate valid moves. We'll create a temporary one.
        temp_env = BaghchalEnv()
        
        # Manually load the state into the temporary environment
        temp_env.board = state['board']
        temp_env.current_player = state['current_player']
        temp_env.goats_captured = state['goats_captured']
        temp_env.goats_placed = state['goats_placed']
        temp_env.phase = state['phase']
        
        # Now, the AI agent can use the temp_env to select an action
        return ai_agent.select_action(temp_env, state)

def get_ai_move(player: Player, difficulty: str, state: Dict) -> Optional[Tuple]:
    """Top-level function to get an AI move."""
    ai_system = AdvancedBaghchalAI()
    return ai_system.get_ai_move(player, difficulty, state)

if __name__ == "__main__":
    print("🎉 Advanced Baghchal AI System ready!") 