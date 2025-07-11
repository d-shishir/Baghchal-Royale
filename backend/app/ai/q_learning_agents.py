"""
Specialized Double Q-Learning Agents for Tiger and Goat players
Implements player-specific reward functions and strategic considerations
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from .double_q_learning import DoubleQLearningAgent, QLearningConfig

try:
    from ..core.baghchal_env import Player, GamePhase, PieceType
except ImportError:
    from enum import Enum
    class Player(Enum):
        TIGER = 1
        GOAT = 2
    class GamePhase(Enum):
        PLACEMENT = 1
        MOVEMENT = 2
    class PieceType(Enum):
        EMPTY = 0
        TIGER = 1
        GOAT = 2

class DoubleQLearningTigerAI(DoubleQLearningAgent):
    """Double Q-Learning Tiger AI with tiger-specific reward function."""
    
    def __init__(self, config: QLearningConfig = None):
        super().__init__(Player.TIGER, config)
        print("🐅 Double Q-Learning Tiger AI initialized")
    
    def calculate_reward(self, old_state: Dict, new_state: Dict, action: Tuple) -> float:
        """Calculate tiger-specific rewards."""
        reward = 0.0
        
        # Game outcome rewards
        if new_state.get('game_over', False):
            winner = new_state.get('winner')
            if winner == 'TIGER':
                reward += 100.0  # Win bonus
                print(f"🏆 Tiger wins! Total reward: {reward}")
            else:
                reward -= 100.0  # Loss penalty
                print(f"💀 Tiger loses! Total reward: {reward}")
            return reward
        
        # Capture rewards
        old_captures = old_state.get('goats_captured', 0)
        new_captures = new_state.get('goats_captured', 0)
        captures_made = new_captures - old_captures
        
        if captures_made > 0:
            reward += 20.0 * captures_made  # High reward for captures
            print(f"🎯 Tiger captured {captures_made} goat(s)! Reward: +{20.0 * captures_made}")
        
        # Progressive capture bonus (closer to win = higher reward)
        if new_captures > old_captures:
            capture_progress_bonus = (new_captures / 5.0) * 10.0
            reward += capture_progress_bonus
        
        # Position-based rewards
        board = new_state['board']
        reward += self._calculate_tiger_positional_rewards(board, action)
        
        # Mobility rewards - tigers want to maintain options
        tiger_mobility = self._count_tiger_mobility(board)
        reward += tiger_mobility * 0.1  # Small bonus for having more moves
        
        # Pressure rewards - being close to goats
        reward += self._calculate_pressure_rewards(board)
        
        # Small step penalty to encourage decisive play
        reward -= 0.1
        
        return reward
    
    def _calculate_tiger_positional_rewards(self, board: np.ndarray, action: Tuple) -> float:
        """Calculate rewards based on tiger positioning."""
        reward = 0.0
        
        if action[0] == 'move':
            from_pos = (action[1], action[2])
            to_pos = (action[3], action[4])
            
            # Center control bonus
            center = (2, 2)
            if to_pos == center:
                reward += 2.0
            elif to_pos in [(1, 2), (2, 1), (2, 3), (3, 2)]:  # Near center
                reward += 1.0
            
            # Strategic position bonus (corners and edges can be good for hunting)
            corners = [(0, 0), (0, 4), (4, 0), (4, 4)]
            if to_pos in corners:
                reward += 1.0
        
        return reward
    
    def _count_tiger_mobility(self, board: np.ndarray) -> int:
        """Count total mobility for all tigers."""
        mobility = 0
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        # Find tiger positions
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    # Count moves for this tiger
                    for dr, dc in directions:
                        new_r, new_c = r + dr, c + dc
                        
                        # Regular move
                        if (0 <= new_r < 5 and 0 <= new_c < 5 and 
                            board[new_r, new_c] == PieceType.EMPTY.value):
                            mobility += 1
                        
                        # Capture move
                        elif (0 <= new_r < 5 and 0 <= new_c < 5 and 
                              board[new_r, new_c] == PieceType.GOAT.value):
                            jump_r, jump_c = new_r + dr, new_c + dc
                            if (0 <= jump_r < 5 and 0 <= jump_c < 5 and 
                                board[jump_r, jump_c] == PieceType.EMPTY.value):
                                mobility += 2  # Captures count more
        
        return mobility
    
    def _calculate_pressure_rewards(self, board: np.ndarray) -> float:
        """Calculate rewards for applying pressure on goats."""
        pressure_reward = 0.0
        
        # Find tiger and goat positions
        tiger_positions = []
        goat_positions = []
        
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
                elif board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        # Reward for being close to goats
        for tiger_pos in tiger_positions:
            for goat_pos in goat_positions:
                distance = abs(tiger_pos[0] - goat_pos[0]) + abs(tiger_pos[1] - goat_pos[1])
                
                if distance == 1:  # Adjacent to goat
                    pressure_reward += 1.0
                elif distance == 2:  # Close to goat
                    pressure_reward += 0.5
        
        # Bonus for threatening multiple goats
        threatened_goats = 0
        for goat_pos in goat_positions:
            if self._is_goat_threatened(board, goat_pos, tiger_positions):
                threatened_goats += 1
        
        pressure_reward += threatened_goats * 2.0
        
        return pressure_reward
    
    def _is_goat_threatened(self, board: np.ndarray, goat_pos: Tuple[int, int], 
                          tiger_positions: List[Tuple]) -> bool:
        """Check if a goat is under immediate capture threat."""
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for tiger_pos in tiger_positions:
            for dr, dc in directions:
                # Check if tiger can jump over goat
                if (tiger_pos[0] + dr == goat_pos[0] and tiger_pos[1] + dc == goat_pos[1]):
                    land_r, land_c = goat_pos[0] + dr, goat_pos[1] + dc
                    if (0 <= land_r < 5 and 0 <= land_c < 5 and 
                        board[land_r, land_c] == PieceType.EMPTY.value):
                        return True
        
        return False

class DoubleQLearningGoatAI(DoubleQLearningAgent):
    """Double Q-Learning Goat AI with goat-specific reward function."""
    
    def __init__(self, config: QLearningConfig = None):
        super().__init__(Player.GOAT, config)
        print("🐐 Double Q-Learning Goat AI initialized")
    
    def calculate_reward(self, old_state: Dict, new_state: Dict, action: Tuple) -> float:
        """Calculate goat-specific rewards."""
        reward = 0.0
        
        # Game outcome rewards
        if new_state.get('game_over', False):
            winner = new_state.get('winner')
            if winner == 'GOAT':
                reward += 100.0  # Win bonus
                print(f"🏆 Goats win! Total reward: {reward}")
            else:
                reward -= 100.0  # Loss penalty
                print(f"💀 Goats lose! Total reward: {reward}")
            return reward
        
        # Survival rewards (negative reward for getting captured)
        old_captures = old_state.get('goats_captured', 0)
        new_captures = new_state.get('goats_captured', 0)
        
        if new_captures > old_captures:
            captures_lost = new_captures - old_captures
            reward -= 15.0 * captures_lost  # Penalty for losing goats
            print(f"💀 Lost {captures_lost} goat(s)! Penalty: -{15.0 * captures_lost}")
        
        # Board control rewards
        board = new_state['board']
        reward += self._calculate_goat_positional_rewards(board, action, new_state)
        
        # Formation rewards
        reward += self._calculate_formation_rewards(board)
        
        # Tiger mobility restriction rewards
        reward += self._calculate_blocking_rewards(old_state['board'], board)
        
        # Safety rewards
        reward += self._calculate_safety_rewards(board)
        
        # Phase-specific rewards
        phase = new_state.get('phase', GamePhase.PLACEMENT)
        if phase == GamePhase.PLACEMENT:
            reward += self._calculate_placement_rewards(board, action)
        
        # Small step penalty to encourage efficient play
        reward -= 0.05
        
        return reward
    
    def _calculate_goat_positional_rewards(self, board: np.ndarray, action: Tuple, state: Dict) -> float:
        """Calculate rewards based on goat positioning."""
        reward = 0.0
        
        if action[0] == 'place':
            pos = (action[1], action[2])
        elif action[0] == 'move':
            pos = (action[3], action[4])
        else:
            return 0.0
        
        # Center control (important for goats too)
        center = (2, 2)
        if pos == center:
            reward += 3.0
        elif pos in [(1, 2), (2, 1), (2, 3), (3, 2)]:  # Near center
            reward += 1.5
        
        # Edge and corner bonuses (good defensive positions)
        edges = [(0, 1), (0, 2), (0, 3), (1, 0), (1, 4), (2, 0), (2, 4), 
                (3, 0), (3, 4), (4, 1), (4, 2), (4, 3)]
        corners = [(0, 0), (0, 4), (4, 0), (4, 4)]
        
        if pos in corners:
            reward += 2.0
        elif pos in edges:
            reward += 1.0
        
        return reward
    
    def _calculate_formation_rewards(self, board: np.ndarray) -> float:
        """Calculate rewards for good goat formations."""
        reward = 0.0
        
        # Find goat positions
        goat_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        if len(goat_positions) < 2:
            return 0.0
        
        # Reward for adjacent goats (formation building)
        adjacent_pairs = 0
        for i, pos1 in enumerate(goat_positions):
            for j, pos2 in enumerate(goat_positions):
                if i >= j:
                    continue
                distance = abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])
                if distance == 1:
                    adjacent_pairs += 1
        
        reward += adjacent_pairs * 1.0
        
        # Bonus for line formations (3+ goats in a line)
        line_formations = self._count_line_formations(goat_positions)
        reward += line_formations * 3.0
        
        # Reward for creating "walls" that limit tiger movement
        wall_bonus = self._calculate_wall_effectiveness(board, goat_positions)
        reward += wall_bonus
        
        return reward
    
    def _count_line_formations(self, goat_positions: List[Tuple]) -> int:
        """Count linear formations of 3+ goats."""
        if len(goat_positions) < 3:
            return 0
        
        formations = 0
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        
        for direction in directions:
            checked_positions = set()
            
            for start_pos in goat_positions:
                if start_pos in checked_positions:
                    continue
                
                line_positions = [start_pos]
                current_pos = start_pos
                
                # Check in positive direction
                while True:
                    next_pos = (current_pos[0] + direction[0], current_pos[1] + direction[1])
                    if next_pos in goat_positions:
                        line_positions.append(next_pos)
                        current_pos = next_pos
                    else:
                        break
                
                # Check in negative direction
                current_pos = start_pos
                while True:
                    prev_pos = (current_pos[0] - direction[0], current_pos[1] - direction[1])
                    if prev_pos in goat_positions and prev_pos not in line_positions:
                        line_positions.insert(0, prev_pos)
                        current_pos = prev_pos
                    else:
                        break
                
                if len(line_positions) >= 3:
                    formations += 1
                    checked_positions.update(line_positions)
        
        return formations
    
    def _calculate_wall_effectiveness(self, board: np.ndarray, goat_positions: List[Tuple]) -> float:
        """Calculate how effectively goats are forming walls to block tigers."""
        if len(goat_positions) < 2:
            return 0.0
        
        # Find tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        # Calculate how much goat formations reduce tiger mobility
        old_mobility = self._calculate_theoretical_tiger_mobility(board, tiger_positions, [])
        current_mobility = self._calculate_theoretical_tiger_mobility(board, tiger_positions, goat_positions)
        
        mobility_reduction = old_mobility - current_mobility
        return mobility_reduction * 0.5  # Reward for reducing tiger mobility
    
    def _calculate_theoretical_tiger_mobility(self, board: np.ndarray, tiger_positions: List[Tuple], 
                                           ignore_goats: List[Tuple]) -> int:
        """Calculate tiger mobility ignoring specific goat positions."""
        mobility = 0
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for tr, tc in tiger_positions:
            for dr, dc in directions:
                new_r, new_c = tr + dr, tc + dc
                
                if 0 <= new_r < 5 and 0 <= new_c < 5:
                    cell_value = board[new_r, new_c]
                    
                    # Empty cell - can move
                    if cell_value == PieceType.EMPTY.value:
                        mobility += 1
                    
                    # Goat cell - check if can capture
                    elif (cell_value == PieceType.GOAT.value and 
                          (new_r, new_c) not in ignore_goats):
                        jump_r, jump_c = new_r + dr, new_c + dc
                        if (0 <= jump_r < 5 and 0 <= jump_c < 5 and 
                            board[jump_r, jump_c] == PieceType.EMPTY.value):
                            mobility += 1
        
        return mobility
    
    def _calculate_blocking_rewards(self, old_board: np.ndarray, new_board: np.ndarray) -> float:
        """Calculate rewards for reducing tiger mobility."""
        # Find tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if new_board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        # Calculate mobility before and after
        old_mobility = self._count_tiger_mobility_on_board(old_board, tiger_positions)
        new_mobility = self._count_tiger_mobility_on_board(new_board, tiger_positions)
        
        mobility_reduction = old_mobility - new_mobility
        return mobility_reduction * 1.0  # Reward for each move blocked
    
    def _count_tiger_mobility_on_board(self, board: np.ndarray, tiger_positions: List[Tuple]) -> int:
        """Count tiger mobility on a specific board state."""
        mobility = 0
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for tr, tc in tiger_positions:
            for dr, dc in directions:
                new_r, new_c = tr + dr, tc + dc
                
                # Regular move
                if (0 <= new_r < 5 and 0 <= new_c < 5 and 
                    board[new_r, new_c] == PieceType.EMPTY.value):
                    mobility += 1
                
                # Capture move
                elif (0 <= new_r < 5 and 0 <= new_c < 5 and 
                      board[new_r, new_c] == PieceType.GOAT.value):
                    jump_r, jump_c = new_r + dr, new_c + dc
                    if (0 <= jump_r < 5 and 0 <= jump_c < 5 and 
                        board[jump_r, jump_c] == PieceType.EMPTY.value):
                        mobility += 1
        
        return mobility
    
    def _calculate_safety_rewards(self, board: np.ndarray) -> float:
        """Calculate rewards for keeping goats safe from capture."""
        reward = 0.0
        
        # Find positions
        tiger_positions = []
        goat_positions = []
        
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
                elif board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        # Penalty for goats in danger
        threatened_goats = 0
        for goat_pos in goat_positions:
            if self._is_goat_threatened(board, goat_pos, tiger_positions):
                threatened_goats += 1
        
        reward -= threatened_goats * 2.0  # Penalty for each threatened goat
        
        # Bonus for goats in safe positions (protected by other goats)
        safe_goats = 0
        for goat_pos in goat_positions:
            if self._is_goat_protected(board, goat_pos, goat_positions):
                safe_goats += 1
        
        reward += safe_goats * 0.5  # Small bonus for protected goats
        
        return reward
    
    def _is_goat_threatened(self, board: np.ndarray, goat_pos: Tuple[int, int], 
                          tiger_positions: List[Tuple]) -> bool:
        """Check if a goat is under immediate capture threat."""
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for tiger_pos in tiger_positions:
            for dr, dc in directions:
                if (tiger_pos[0] + dr == goat_pos[0] and tiger_pos[1] + dc == goat_pos[1]):
                    land_r, land_c = goat_pos[0] + dr, goat_pos[1] + dc
                    if (0 <= land_r < 5 and 0 <= land_c < 5 and 
                        board[land_r, land_c] == PieceType.EMPTY.value):
                        return True
        
        return False
    
    def _is_goat_protected(self, board: np.ndarray, goat_pos: Tuple[int, int], 
                         goat_positions: List[Tuple]) -> bool:
        """Check if a goat is protected by being part of a formation."""
        adjacent_goats = 0
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for dr, dc in directions:
            adj_pos = (goat_pos[0] + dr, goat_pos[1] + dc)
            if adj_pos in goat_positions:
                adjacent_goats += 1
        
        return adjacent_goats >= 2  # Protected if part of formation
    
    def _calculate_placement_rewards(self, board: np.ndarray, action: Tuple) -> float:
        """Calculate rewards specific to the placement phase."""
        if action[0] != 'place':
            return 0.0
        
        reward = 0.0
        pos = (action[1], action[2])
        
        # Find tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        # Bonus for placing away from tigers initially
        min_distance_to_tiger = min([abs(pos[0] - tp[0]) + abs(pos[1] - tp[1]) 
                                   for tp in tiger_positions] or [999])
        
        if min_distance_to_tiger >= 2:
            reward += 1.0  # Bonus for safe placement
        
        # Bonus for strategic initial positions
        strategic_positions = [(1, 1), (1, 3), (3, 1), (3, 3)]  # Near center but not center
        if pos in strategic_positions:
            reward += 0.5
        
        return reward 