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
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """AGGRESSIVE action selection that prioritizes capturing goats above all else."""
        valid_actions = env.get_valid_actions(self.player)
        if not valid_actions:
            return None
        
        # PRIORITY 1: ALWAYS check for immediate winning moves first
        for action in valid_actions:
            temp_state = self._simulate_action(state, action)
            winner = temp_state.get('winner')
            if (temp_state.get('game_over') and 
                (winner == Player.TIGER or winner == 'TIGER' or 
                 (hasattr(winner, 'name') and winner.name == 'TIGER'))):
                print(f"🏆 TIGER: Found winning move! {action}")
                return action
        
        # PRIORITY 2: AGGRESSIVELY seek capture opportunities (HIGHEST PRIORITY)
        capture_actions = self._find_capture_actions(valid_actions, state['board'])
        if capture_actions:
            print(f"🎯 AGGRESSIVE TIGER: Found {len(capture_actions)} capture opportunities! Taking the first one.")
            # Return the first capture action immediately - all captures are valuable
            return capture_actions[0]
        
        # PRIORITY 3: Moves that set up captures for the next turn
        setup_actions = self._find_capture_setup_actions(valid_actions, state['board'])
        if setup_actions:
            print(f"⚡ AGGRESSIVE TIGER: Found {len(setup_actions)} capture setup moves!")
            return setup_actions[0]
        
        # PRIORITY 4: Moves that get closer to goats
        hunting_actions = self._find_hunting_actions(valid_actions, state['board'])
        if hunting_actions:
            print(f"🔍 AGGRESSIVE TIGER: Hunting mode - moving closer to goats!")
            return hunting_actions[0]
        
        # If no aggressive moves available, use regular Q-learning selection
        return super().select_action(env, state)
    
    def calculate_reward(self, old_state: Dict, new_state: Dict, action: Tuple) -> float:
        """Calculate tiger-specific rewards."""
        reward = 0.0
        
        # Game outcome rewards
        if new_state.get('game_over', False):
            winner = new_state.get('winner')
            # Handle both enum and string winner values
            if (winner == Player.TIGER or winner == 'TIGER' or 
                (hasattr(winner, 'name') and winner.name == 'TIGER')):
                reward += 1000.0  # Massive win bonus to prioritize winning
                print(f"🏆 Tiger wins! Total reward: {reward}")
            else:
                reward -= 1000.0  # Massive loss penalty
                print(f"💀 Tiger loses! Total reward: {reward}")
            return reward
        
        # Check if this move leads to an immediate win condition
        goats_captured = new_state.get('goats_captured', 0)
        if goats_captured >= 5:
            reward += 500.0  # Huge bonus for moves that lead to winning
            print(f"🎯 Tiger winning move! Captured {goats_captured} goats! Reward: +500.0")
        
        # Check if move leads closer to blocking all goats (win condition)
        if self._check_near_win_by_blocking(new_state):
            reward += 100.0  # Bonus for moves that block goats
            print(f"🔒 Tiger near win by blocking! Reward: +100.0")
        
        # AGGRESSIVE CAPTURE REWARDS - MASSIVELY INCREASED
        old_captures = old_state.get('goats_captured', 0)
        new_captures = new_state.get('goats_captured', 0)
        captures_made = new_captures - old_captures
        
        if captures_made > 0:
            # MASSIVE reward for captures - this is the tiger's PRIMARY goal
            base_capture_reward = 100.0 * captures_made  # 5x increase from 20.0
            
            # Additional bonus based on how many goats already captured (momentum bonus)
            momentum_bonus = new_captures * 20.0  # More captures = higher future rewards
            
            # Exponential bonus for multiple captures in one move (if possible)
            if captures_made > 1:
                multi_capture_bonus = captures_made * captures_made * 50.0
                reward += multi_capture_bonus
                print(f"🔥 INCREDIBLE! Tiger captured {captures_made} goats in one move! Multi-bonus: +{multi_capture_bonus}")
            
            total_capture_reward = base_capture_reward + momentum_bonus
            reward += total_capture_reward
            print(f"🎯 AGGRESSIVE TIGER captured {captures_made} goat(s)! Total capture reward: +{total_capture_reward}")
        
        # Progressive capture bonus (closer to win = exponentially higher reward)
        if new_captures > old_captures:
            capture_progress_bonus = (new_captures / 5.0) * 50.0  # 5x increase from 10.0
            # Exponential scaling as we get closer to winning
            exponential_bonus = (new_captures ** 2) * 10.0
            reward += capture_progress_bonus + exponential_bonus
            print(f"📈 Tiger capture progress bonus: +{capture_progress_bonus + exponential_bonus}")
        
        # Position-based rewards
        board = new_state['board']
        reward += self._calculate_tiger_positional_rewards(board, action)
        
        # Mobility rewards - tigers want to maintain options
        tiger_mobility = self._count_tiger_mobility(board)
        reward += tiger_mobility * 0.1  # Small bonus for having more moves
        
        # AGGRESSIVE PRESSURE REWARDS - hunt relentlessly
        pressure_reward = self._calculate_aggressive_pressure_rewards(board)
        reward += pressure_reward
        
        # Penalty for not being aggressive enough
        if captures_made == 0:  # No capture this turn
            reward -= 2.0  # Increased penalty to force aggressive play
            
        # Bonus for threatening multiple goats
        threat_bonus = self._calculate_threat_bonus(board)
        reward += threat_bonus
        
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
    
    def _find_capture_actions(self, valid_actions: List[Tuple], board: np.ndarray) -> List[Tuple]:
        """Find all actions that result in capturing goats - AGGRESSIVE PRIORITY."""
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
                    if 0 <= mid_r < 5 and 0 <= mid_c < 5 and board[mid_r, mid_c] == PieceType.GOAT.value:
                        capture_actions.append(action)
        
        return capture_actions
    
    def _find_capture_setup_actions(self, valid_actions: List[Tuple], board: np.ndarray) -> List[Tuple]:
        """Find moves that set up captures for the next turn - AGGRESSIVE HUNTING."""
        setup_actions = []
        
        # Find goat positions
        goat_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        for action in valid_actions:
            if len(action) == 5 and action[0] == 'move':
                to_r, to_c = action[3], action[4]
                
                # Check if this position sets up a capture
                for goat_r, goat_c in goat_positions:
                    # Check if tiger would be adjacent to goat and can capture next turn
                    distance = max(abs(to_r - goat_r), abs(to_c - goat_c))
                    if distance == 1:
                        # Check if there's space to land after jumping over goat
                        dr, dc = goat_r - to_r, goat_c - to_c
                        land_r, land_c = goat_r + dr, goat_c + dc
                        if (0 <= land_r < 5 and 0 <= land_c < 5 and 
                            board[land_r, land_c] == PieceType.EMPTY.value):
                            setup_actions.append(action)
                            break
        
        return setup_actions
    
    def _find_hunting_actions(self, valid_actions: List[Tuple], board: np.ndarray) -> List[Tuple]:
        """Find moves that get closer to goats for hunting - AGGRESSIVE PURSUIT."""
        hunting_actions = []
        
        # Find goat positions
        goat_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        if not goat_positions:
            return []
        
        best_distance = float('inf')
        for action in valid_actions:
            if len(action) == 5 and action[0] == 'move':
                from_r, from_c, to_r, to_c = action[1], action[2], action[3], action[4]
                
                # Calculate improvement in distance to closest goat
                old_min_distance = min(abs(from_r - gr) + abs(from_c - gc) for gr, gc in goat_positions)
                new_min_distance = min(abs(to_r - gr) + abs(to_c - gc) for gr, gc in goat_positions)
                
                if new_min_distance < old_min_distance:
                    distance_improvement = old_min_distance - new_min_distance
                    if distance_improvement > 0:
                        hunting_actions.append((action, distance_improvement))
        
        # Sort by distance improvement (best hunters first)
        hunting_actions.sort(key=lambda x: x[1], reverse=True)
        return [action for action, _ in hunting_actions]
    
    def _calculate_aggressive_pressure_rewards(self, board: np.ndarray) -> float:
        """Calculate AGGRESSIVE pressure rewards for hunting goats relentlessly."""
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
        
        # MASSIVE reward for being close to goats
        for tiger_pos in tiger_positions:
            for goat_pos in goat_positions:
                distance = abs(tiger_pos[0] - goat_pos[0]) + abs(tiger_pos[1] - goat_pos[1])
                
                if distance == 1:  # Adjacent to goat - HUGE bonus
                    pressure_reward += 10.0  # 10x increase from 1.0
                elif distance == 2:  # Close to goat - big bonus
                    pressure_reward += 5.0   # 10x increase from 0.5
                elif distance == 3:  # Somewhat close - medium bonus
                    pressure_reward += 2.0
        
        return pressure_reward
    
    def _calculate_threat_bonus(self, board: np.ndarray) -> float:
        """Calculate bonus for threatening multiple goats simultaneously."""
        threat_bonus = 0.0
        
        # Find positions
        tiger_positions = []
        goat_positions = []
        
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
                elif board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        # Count threatened goats
        threatened_goats = 0
        for goat_pos in goat_positions:
            if self._is_goat_threatened(board, goat_pos, tiger_positions):
                threatened_goats += 1
        
        # MASSIVE bonus for threatening multiple goats
        if threatened_goats >= 2:
            threat_bonus += threatened_goats * 15.0  # Exponential bonus
        elif threatened_goats == 1:
            threat_bonus += 5.0
        
        return threat_bonus
    
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
    
    def _check_near_win_by_blocking(self, state: Dict) -> bool:
        """Check if tigers are close to winning by blocking all goat moves."""
        import numpy as np
        board = np.array(state['board'])
        
        # Find all goat positions
        goat_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
        
        if not goat_positions:
            return False
        
        # Count total possible goat moves
        total_moves = 0
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for gr, gc in goat_positions:
            for dr, dc in directions:
                new_r, new_c = gr + dr, gc + dc
                if (0 <= new_r < 5 and 0 <= new_c < 5 and 
                    board[new_r, new_c] == PieceType.EMPTY.value):
                    total_moves += 1
        
        # If goats have very few moves left, tigers are close to winning
        return total_moves <= 2

class DoubleQLearningGoatAI(DoubleQLearningAgent):
    """Double Q-Learning Goat AI with goat-specific reward function."""
    
    def __init__(self, config: QLearningConfig = None):
        super().__init__(Player.GOAT, config)
        print("🐐 Double Q-Learning Goat AI initialized")
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """SURVIVAL-FIRST action selection that prioritizes safety above all else."""
        valid_actions = env.get_valid_actions(self.player)
        if not valid_actions:
            return None
        
        # PRIORITY 1: Check for immediate winning moves (blocking all tigers)
        for action in valid_actions:
            temp_state = self._simulate_action(state, action)
            winner = temp_state.get('winner')
            if (self._check_tiger_blocked(temp_state) or 
                (temp_state.get('game_over') and 
                 (winner == Player.GOAT or winner == 'GOAT' or 
                  (hasattr(winner, 'name') and winner.name == 'GOAT')))):
                print(f"🏆 GOAT: Found winning move! {action}")
                return action
        
        # PRIORITY 2: SURVIVAL - Filter out ANY moves that put goats in danger
        safe_actions = self._filter_ultra_safe_actions(valid_actions, state)
        if not safe_actions:
            print(f"⚠️ CRITICAL: No completely safe moves! Looking for least dangerous options...")
            # If no completely safe moves, find the "least bad" options
            safe_actions = self._find_least_dangerous_actions(valid_actions, state)
        
        print(f"🛡️ DEFENSIVE GOAT: Using {len(safe_actions)} safe moves out of {len(valid_actions)} total")
        
        # PRIORITY 3: Among safe moves, look for moves that help trap tigers
        if safe_actions:
            trapping_actions = self._find_safe_trapping_moves(safe_actions, state)
            if trapping_actions:
                print(f"🎯 DEFENSIVE GOAT: Found {len(trapping_actions)} safe trapping opportunities!")
                return trapping_actions[0]
        
        # PRIORITY 4: Among safe moves, build defensive formations
        if safe_actions:
            formation_actions = self._find_safe_formation_moves(safe_actions, state)
            if formation_actions:
                print(f"🛡️ DEFENSIVE GOAT: Building safe defensive formation!")
                return formation_actions[0]
        
        # Use the safest available move
        return safe_actions[0] if safe_actions else valid_actions[0]
    
    def calculate_reward(self, old_state: Dict, new_state: Dict, action: Tuple) -> float:
        """Calculate goat-specific rewards."""
        reward = 0.0
        
        # Game outcome rewards
        if new_state.get('game_over', False):
            winner = new_state.get('winner')
            # Handle both enum and string winner values
            if (winner == Player.GOAT or winner == 'GOAT' or 
                (hasattr(winner, 'name') and winner.name == 'GOAT')):
                reward += 1000.0  # Massive win bonus to prioritize winning
                print(f"🏆 Goats win! Total reward: {reward}")
            else:
                reward -= 1000.0  # Massive loss penalty
                print(f"💀 Goats lose! Total reward: {reward}")
            return reward
        
        # Check if this move leads to blocking tigers (win condition)
        if self._check_tiger_blocked(new_state):
            reward += 500.0  # Huge bonus for moves that block all tigers
            print(f"🔒 Goats blocking all tigers! Win move! Reward: +500.0")
        
        # SURVIVAL REWARDS - MASSIVE PENALTIES FOR GETTING CAPTURED
        old_captures = old_state.get('goats_captured', 0)
        new_captures = new_state.get('goats_captured', 0)
        
        if new_captures > old_captures:
            captures_lost = new_captures - old_captures
            # CATASTROPHIC penalty for losing goats - this should NEVER happen
            base_penalty = 200.0 * captures_lost  # Increased from 15.0 to 200.0
            
            # Exponential penalty based on total captures (game gets more critical)
            exponential_penalty = (new_captures ** 2) * 50.0
            
            # Extra penalty for losing multiple goats
            if captures_lost > 1:
                multi_loss_penalty = captures_lost * captures_lost * 100.0
                reward -= multi_loss_penalty
                print(f"🔥 DISASTER! Lost {captures_lost} goats in one move! Multi-loss penalty: -{multi_loss_penalty}")
            
            total_survival_penalty = base_penalty + exponential_penalty
            reward -= total_survival_penalty
            print(f"💀 CRITICAL FAILURE! Lost {captures_lost} goat(s)! Total survival penalty: -{total_survival_penalty}")
        
        # MASSIVE bonus for keeping all goats alive
        if new_captures == old_captures and old_captures < new_state.get('total_goats_placed', 20):
            survival_bonus = 10.0  # Reward for not losing any goats
            reward += survival_bonus
        
        # Board control rewards
        board = new_state['board']
        reward += self._calculate_goat_positional_rewards(board, action, new_state)
        
        # Formation rewards
        reward += self._calculate_formation_rewards(board)
        
        # Tiger mobility restriction rewards
        reward += self._calculate_blocking_rewards(old_state['board'], board)
        
        # ULTRA-AGGRESSIVE SAFETY REWARDS - survival is everything
        safety_reward = self._calculate_ultra_safety_rewards(board, old_state, new_state, action)
        reward += safety_reward
        
        # DANGER DETECTION - massive penalties for risky positions
        danger_penalty = self._calculate_danger_penalties(board, action)
        reward -= danger_penalty
        
        # Phase-specific rewards
        phase = new_state.get('phase', GamePhase.PLACEMENT)
        if phase == GamePhase.PLACEMENT:
            reward += self._calculate_ultra_safe_placement_rewards(board, action)
        
        # Penalty for not being defensive enough
        if danger_penalty == 0:  # No danger detected
            reward += 1.0  # Small bonus for safe play
        else:
            reward -= 5.0   # Extra penalty for risky play
        
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
    
    def _filter_ultra_safe_actions(self, valid_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Filter actions to only include those that are 100% safe - NO GOATS CAN BE CAPTURED."""
        safe_actions = []
        board = np.array(state['board'])
        
        # Find tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        for action in valid_actions:
            if self._is_action_completely_safe_for_all_goats(action, state, tiger_positions):
                safe_actions.append(action)
        
        return safe_actions
    
    def _find_least_dangerous_actions(self, valid_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """When no completely safe moves exist, find the least dangerous ones."""
        tiger_positions = []
        board = np.array(state['board'])
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        # Score actions by danger level (lower = safer)
        action_danger_scores = []
        for action in valid_actions:
            danger_score = self._calculate_action_danger_score(action, state, tiger_positions)
            action_danger_scores.append((action, danger_score))
            
            # Log the most dangerous moves
            if danger_score >= 10000:
                print(f"⚠️ EXTREMELY DANGEROUS move {action}: would expose goats to capture (score: {danger_score})")
        
        # Sort by danger score and return the safest options
        action_danger_scores.sort(key=lambda x: x[1])
        min_danger = action_danger_scores[0][1] if action_danger_scores else 0
        
        # If even the "safest" move has high danger, log a warning
        if min_danger >= 10000:
            print(f"🚨 CRITICAL: Even the safest move has danger score {min_danger} - some goats may be lost!")
        
        # Return all actions with the minimum danger score
        safest_actions = [action for action, score in action_danger_scores if score == min_danger]
        return safest_actions
    
    def _is_action_completely_safe_for_all_goats(self, action: Tuple, state: Dict, tiger_positions: List[Tuple]) -> bool:
        """Check if an action is completely safe - ensures NO GOATS can be captured after this move."""
        # Simulate the board state after this action
        simulated_state = self._simulate_full_board_state(action, state)
        simulated_board = np.array(simulated_state['board'])
        
        # Get all goat positions after the move
        goat_positions = self._get_goat_positions(simulated_board)
        
        # Check if ANY goat can be captured by ANY tiger after this move
        for goat_pos in goat_positions:
            for tiger_pos in tiger_positions:
                if self._can_tiger_capture_at_position(tiger_pos, goat_pos, simulated_board):
                    # This move would allow a goat to be captured - REJECT IT
                    return False
        
        return True
    
    def _calculate_action_danger_score(self, action: Tuple, state: Dict, tiger_positions: List[Tuple]) -> int:
        """Calculate danger score for an action considering ALL goats' safety."""
        # Simulate the full board state after this action
        simulated_state = self._simulate_full_board_state(action, state)
        simulated_board = np.array(simulated_state['board'])
        
        danger_score = 0
        
        # Get all goat positions after the move
        goat_positions = self._get_goat_positions(simulated_board)
        
        # Check danger for ALL goats, not just the moving one
        for goat_pos in goat_positions:
            for tiger_pos in tiger_positions:
                if self._can_tiger_capture_at_position(tiger_pos, goat_pos, simulated_board):
                    danger_score += 10000  # ANY goat in capture danger = MAXIMUM DANGER
                else:
                    # Calculate proximity danger
                    distance = abs(tiger_pos[0] - goat_pos[0]) + abs(tiger_pos[1] - goat_pos[1])
                    if distance == 1:
                        danger_score += 500  # Any goat adjacent to tiger = very dangerous
                    elif distance == 2:
                        danger_score += 100  # Close to tiger = somewhat dangerous
                    elif distance == 3:
                        danger_score += 20   # Near tiger = slightly dangerous
        
        return danger_score
    
    def _can_tiger_capture_at_position(self, tiger_pos: Tuple[int, int], target_pos: Tuple[int, int], board: np.ndarray) -> bool:
        """Check if tiger can capture a goat at target position."""
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
    
    def _find_safe_trapping_moves(self, safe_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Find safe moves that help trap tigers."""
        trapping_actions = []
        board = np.array(state['board'])
        
        for action in safe_actions:
            # Simulate the action and check if it reduces tiger mobility
            temp_board = board.copy()
            if action[0] == 'place':
                temp_board[action[1], action[2]] = PieceType.GOAT.value
            elif action[0] == 'move':
                temp_board[action[1], action[2]] = PieceType.EMPTY.value
                temp_board[action[3], action[4]] = PieceType.GOAT.value
            
            # Check if this reduces tiger mobility
            old_mobility = self._count_tiger_mobility_on_board(board, self._get_tiger_positions(board))
            new_mobility = self._count_tiger_mobility_on_board(temp_board, self._get_tiger_positions(temp_board))
            
            if new_mobility < old_mobility:
                trapping_actions.append(action)
        
        return trapping_actions
    
    def _find_safe_formation_moves(self, safe_actions: List[Tuple], state: Dict) -> List[Tuple]:
        """Find safe moves that build defensive formations."""
        formation_actions = []
        board = np.array(state['board'])
        
        goat_positions = self._get_goat_positions(board)
        
        for action in safe_actions:
            if action[0] == 'place':
                new_pos = (action[1], action[2])
            elif action[0] == 'move':
                new_pos = (action[3], action[4])
            else:
                continue
            
            # Check if this position helps form a defensive line
            adjacent_goats = 0
            for goat_pos in goat_positions:
                distance = abs(new_pos[0] - goat_pos[0]) + abs(new_pos[1] - goat_pos[1])
                if distance == 1:
                    adjacent_goats += 1
            
            if adjacent_goats >= 1:  # Forms part of a defensive formation
                formation_actions.append(action)
        
        return formation_actions
    
    def _get_tiger_positions(self, board: np.ndarray) -> List[Tuple]:
        """Get all tiger positions on the board."""
        positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    positions.append((r, c))
        return positions
    
    def _get_goat_positions(self, board: np.ndarray) -> List[Tuple]:
        """Get all goat positions on the board."""
        positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.GOAT.value:
                    positions.append((r, c))
        return positions
    
    def _simulate_full_board_state(self, action: Tuple, state: Dict) -> Dict:
        """Simulate the complete board state after performing an action."""
        # Create a deep copy of the state
        import copy
        new_state = copy.deepcopy(state)
        new_board = np.array(new_state['board'])
        
        if action[0] == 'place':
            # Place a goat
            r, c = action[1], action[2]
            new_board[r, c] = PieceType.GOAT.value
            new_state['goats_placed'] = new_state.get('goats_placed', 0) + 1
            
        elif action[0] == 'move':
            # Move a goat
            from_r, from_c, to_r, to_c = action[1], action[2], action[3], action[4]
            # Remove goat from old position
            new_board[from_r, from_c] = PieceType.EMPTY.value
            # Place goat in new position
            new_board[to_r, to_c] = PieceType.GOAT.value
        
        new_state['board'] = new_board.tolist()
        return new_state
    
    def _calculate_exposure_penalty(self, old_state: Dict, new_state: Dict, action: Tuple) -> float:
        """Calculate penalty for exposing goats to capture threats."""
        penalty = 0.0
        
        # Simulate the board after this action
        simulated_state = self._simulate_full_board_state(action, old_state)
        simulated_board = np.array(simulated_state['board'])
        
        # Get tiger positions
        tiger_positions = self._get_tiger_positions(simulated_board)
        goat_positions = self._get_goat_positions(simulated_board)
        
        # Count how many goats would be threatened after this move
        threatened_count = 0
        for goat_pos in goat_positions:
            if self._is_goat_threatened(simulated_board, goat_pos, tiger_positions):
                threatened_count += 1
        
        # MASSIVE penalty for each threatened goat
        if threatened_count > 0:
            penalty = threatened_count * 500.0  # Huge penalty for exposing goats
            print(f"⚠️⚠️ DANGEROUS MOVE! {threatened_count} goats would be threatened after action {action}! Penalty: -{penalty}")
        
        return penalty
    
    def _calculate_ultra_safety_rewards(self, board: np.ndarray, old_state: Dict, new_state: Dict, action: Tuple) -> float:
        """Calculate ultra-aggressive safety rewards."""
        reward = 0.0
        
        tiger_positions = self._get_tiger_positions(board)
        goat_positions = self._get_goat_positions(board)
        
        # MASSIVE penalty for any goat in danger
        threatened_goats = 0
        for goat_pos in goat_positions:
            if self._is_goat_threatened(board, goat_pos, tiger_positions):
                threatened_goats += 1
        
        reward -= threatened_goats * 50.0  # Massive penalty for each threatened goat
        
        # HUGE bonus for goats in completely safe positions
        safe_goats = 0
        for goat_pos in goat_positions:
            if not self._is_goat_threatened(board, goat_pos, tiger_positions):
                safe_goats += 1
        
        reward += safe_goats * 5.0  # Reward for each safe goat
        
        return reward
    
    def _calculate_danger_penalties(self, board: np.ndarray, action: Tuple) -> float:
        """Calculate penalties for dangerous moves."""
        penalty = 0.0
        
        if action[0] == 'place':
            target_pos = (action[1], action[2])
        elif action[0] == 'move':
            target_pos = (action[3], action[4])
        else:
            return 0.0
        
        tiger_positions = self._get_tiger_positions(board)
        
        # Check danger level of the target position
        for tiger_pos in tiger_positions:
            distance = abs(tiger_pos[0] - target_pos[0]) + abs(tiger_pos[1] - target_pos[1])
            
            if distance == 1:  # Adjacent to tiger
                penalty += 30.0  # Heavy penalty
            elif distance == 2:  # Close to tiger
                penalty += 10.0  # Medium penalty
            elif distance == 3:  # Near tiger
                penalty += 3.0   # Light penalty
        
        return penalty
    
    def _calculate_ultra_safe_placement_rewards(self, board: np.ndarray, action: Tuple) -> float:
        """Calculate ultra-safe placement rewards."""
        if action[0] != 'place':
            return 0.0
        
        reward = 0.0
        pos = (action[1], action[2])
        
        tiger_positions = self._get_tiger_positions(board)
        
        # MASSIVE bonus for placing far from tigers
        min_distance_to_tiger = min([abs(pos[0] - tp[0]) + abs(pos[1] - tp[1]) 
                                   for tp in tiger_positions] or [999])
        
        if min_distance_to_tiger >= 4:
            reward += 20.0  # HUGE bonus for very far placement
        elif min_distance_to_tiger >= 3:
            reward += 10.0  # Big bonus for far placement
        elif min_distance_to_tiger >= 2:
            reward += 5.0   # Medium bonus for safe placement
        else:
            reward -= 15.0  # Penalty for placing too close to tigers
        
        return reward
    
    def _check_tiger_blocked(self, state: Dict) -> bool:
        """Check if all tigers are blocked (goats win condition)."""
        import numpy as np
        board = np.array(state['board'])
        
        # Find all tiger positions
        tiger_positions = []
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
        
        if not tiger_positions:
            return False
        
        # Check if any tiger can move
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for tr, tc in tiger_positions:
            for dr, dc in directions:
                new_r, new_c = tr + dr, tc + dc
                
                # Can move to empty space
                if (0 <= new_r < 5 and 0 <= new_c < 5 and 
                    board[new_r, new_c] == PieceType.EMPTY.value):
                    return False
                
                # Can capture a goat
                elif (0 <= new_r < 5 and 0 <= new_c < 5 and 
                      board[new_r, new_c] == PieceType.GOAT.value):
                    jump_r, jump_c = new_r + dr, new_c + dc
                    if (0 <= jump_r < 5 and 0 <= jump_c < 5 and 
                        board[jump_r, jump_c] == PieceType.EMPTY.value):
                        return False
        
        # If we get here, no tiger can move - goats win!
        return True 