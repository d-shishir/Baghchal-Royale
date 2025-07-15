"""
Double Q-Learning Implementation for Baghchal AI
Advanced reinforcement learning with overestimation bias reduction
"""

import numpy as np
import random
import pickle
import json
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
from dataclasses import dataclass
from collections import defaultdict, deque
import hashlib

try:
    from ..core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
except ImportError:
    print("Warning: Could not import BaghchalEnv - using fallback definitions")
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

@dataclass
class QLearningConfig:
    """Configuration for Q-Learning parameters."""
    alpha: float = 0.1          # Learning rate
    gamma: float = 0.95         # Discount factor
    epsilon: float = 0.1        # Exploration rate
    epsilon_decay: float = 0.995 # Epsilon decay rate
    epsilon_min: float = 0.01   # Minimum epsilon
    memory_size: int = 10000    # Experience replay buffer size

class StateEncoder:
    """Encodes game states into feature vectors for Q-learning."""
    
    def __init__(self):
        self.feature_size = 25  # Will be expanded with strategic features
    
    def encode_state(self, state: Dict, player: Player) -> str:
        """
        Encode game state into a hashable string key.
        Uses strategic features rather than raw board state.
        """
        board = state['board']
        phase = state.get('phase', GamePhase.PLACEMENT)
        goats_placed = state.get('goats_placed', 0)
        goats_captured = state.get('goats_captured', 0)
        
        # Extract strategic features
        features = self._extract_features(board, phase, goats_placed, goats_captured, player)
        
        # Create a hash-friendly string representation
        feature_str = ",".join([f"{f:.3f}" for f in features])
        return hashlib.md5(feature_str.encode()).hexdigest()
    
    def _extract_features(self, board: np.ndarray, phase: GamePhase, 
                         goats_placed: int, goats_captured: int, player: Player) -> List[float]:
        """Extract strategic features from game state."""
        features = []
        
        # Basic game state features
        features.append(float(phase.value))  # Phase indicator
        features.append(goats_placed / 20.0)  # Normalized goats placed
        features.append(goats_captured / 5.0)  # Normalized goats captured
        
        # Board position features
        tiger_positions = []
        goat_positions = []
        empty_positions = []
        
        for r in range(5):
            for c in range(5):
                if board[r, c] == PieceType.TIGER.value:
                    tiger_positions.append((r, c))
                elif board[r, c] == PieceType.GOAT.value:
                    goat_positions.append((r, c))
                else:
                    empty_positions.append((r, c))
        
        # Piece count features
        features.append(len(tiger_positions) / 4.0)  # Normalized tiger count
        features.append(len(goat_positions) / 20.0)  # Normalized goat count
        
        # Strategic position features
        features.extend(self._calculate_positional_features(tiger_positions, goat_positions))
        
        # Mobility features
        features.extend(self._calculate_mobility_features(board, tiger_positions, goat_positions))
        
        # Formation features
        features.extend(self._calculate_formation_features(goat_positions))
        
        # Threat features
        features.extend(self._calculate_threat_features(board, tiger_positions, goat_positions))
        
        return features
    
    def _calculate_positional_features(self, tiger_positions: List[Tuple], 
                                     goat_positions: List[Tuple]) -> List[float]:
        """Calculate positional advantage features."""
        features = []
        
        # Center control (position (2,2) is center)
        center = (2, 2)
        tigers_in_center = sum(1 for pos in tiger_positions if pos == center)
        goats_in_center = sum(1 for pos in goat_positions if pos == center)
        features.append(tigers_in_center)
        features.append(goats_in_center)
        
        # Corner control
        corners = [(0, 0), (0, 4), (4, 0), (4, 4)]
        tigers_in_corners = sum(1 for pos in tiger_positions if pos in corners)
        goats_in_corners = sum(1 for pos in goat_positions if pos in corners)
        features.append(tigers_in_corners / 4.0)
        features.append(goats_in_corners / 4.0)
        
        # Average distance between tigers and goats
        if tiger_positions and goat_positions:
            total_distance = 0
            count = 0
            for t_pos in tiger_positions:
                for g_pos in goat_positions:
                    distance = abs(t_pos[0] - g_pos[0]) + abs(t_pos[1] - g_pos[1])
                    total_distance += distance
                    count += 1
            avg_distance = total_distance / count if count > 0 else 0
            features.append(avg_distance / 8.0)  # Normalize by max possible distance
        else:
            features.append(0.5)  # Neutral value when no pieces of one type
        
        return features
    
    def _calculate_mobility_features(self, board: np.ndarray, tiger_positions: List[Tuple], 
                                   goat_positions: List[Tuple]) -> List[float]:
        """Calculate mobility-related features."""
        features = []
        
        # Tiger mobility
        tiger_moves = self._count_tiger_moves(board, tiger_positions)
        features.append(tiger_moves / 32.0)  # Normalize by approximate max moves
        
        # Goat mobility
        goat_moves = self._count_goat_moves(board, goat_positions)
        features.append(goat_moves / 80.0)  # Normalize by approximate max moves
        
        return features
    
    def _count_tiger_moves(self, board: np.ndarray, tiger_positions: List[Tuple]) -> int:
        """Count total possible moves for all tigers."""
        total_moves = 0
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
                        total_moves += 1
        
        return total_moves
    
    def _count_goat_moves(self, board: np.ndarray, goat_positions: List[Tuple]) -> int:
        """Count total possible moves for all goats."""
        total_moves = 0
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for gr, gc in goat_positions:
            for dr, dc in directions:
                new_r, new_c = gr + dr, gc + dc
                
                if (0 <= new_r < 5 and 0 <= new_c < 5 and 
                    board[new_r, new_c] == PieceType.EMPTY.value):
                    total_moves += 1
        
        return total_moves
    
    def _calculate_formation_features(self, goat_positions: List[Tuple]) -> List[float]:
        """Calculate goat formation strength features."""
        features = []
        
        if len(goat_positions) < 2:
            features.extend([0.0, 0.0])
            return features
        
        # Connected components (groups of adjacent goats)
        adjacency_count = 0
        for i, pos1 in enumerate(goat_positions):
            for j, pos2 in enumerate(goat_positions):
                if i >= j:
                    continue
                distance = abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])
                if distance == 1:  # Adjacent
                    adjacency_count += 1
        
        # Normalize by maximum possible adjacencies
        max_adjacencies = len(goat_positions) * (len(goat_positions) - 1) // 2
        features.append(adjacency_count / max(max_adjacencies, 1))
        
        # Line formations (3+ goats in a row)
        line_formations = self._count_line_formations(goat_positions)
        features.append(line_formations / 5.0)  # Normalize by reasonable max
        
        return features
    
    def _count_line_formations(self, goat_positions: List[Tuple]) -> int:
        """Count linear formations of 3+ goats."""
        if len(goat_positions) < 3:
            return 0
        
        formations = 0
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]  # horizontal, vertical, diagonals
        
        for direction in directions:
            # Check each possible starting position
            for start_pos in goat_positions:
                line_length = 1
                current_pos = start_pos
                
                # Count consecutive goats in this direction
                while True:
                    next_pos = (current_pos[0] + direction[0], current_pos[1] + direction[1])
                    if next_pos in goat_positions:
                        line_length += 1
                        current_pos = next_pos
                    else:
                        break
                
                if line_length >= 3:
                    formations += 1
        
        return formations
    
    def _calculate_threat_features(self, board: np.ndarray, tiger_positions: List[Tuple], 
                                 goat_positions: List[Tuple]) -> List[float]:
        """Calculate threat-related features."""
        features = []
        
        # Goats under immediate threat
        threatened_goats = 0
        for goat_pos in goat_positions:
            if self._is_goat_threatened(board, goat_pos, tiger_positions):
                threatened_goats += 1
        
        features.append(threatened_goats / max(len(goat_positions), 1))
        
        # Tigers with capture opportunities
        tigers_with_captures = 0
        for tiger_pos in tiger_positions:
            if self._tiger_has_capture_opportunity(board, tiger_pos):
                tigers_with_captures += 1
        
        features.append(tigers_with_captures / max(len(tiger_positions), 1))
        
        return features
    
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
    
    def _tiger_has_capture_opportunity(self, board: np.ndarray, tiger_pos: Tuple[int, int]) -> bool:
        """Check if a tiger has any capture opportunities."""
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for dr, dc in directions:
            adjacent_r, adjacent_c = tiger_pos[0] + dr, tiger_pos[1] + dc
            
            # Check if there's a goat adjacent
            if (0 <= adjacent_r < 5 and 0 <= adjacent_c < 5 and 
                board[adjacent_r, adjacent_c] == PieceType.GOAT.value):
                
                # Check if tiger can jump over it
                land_r, land_c = adjacent_r + dr, adjacent_c + dc
                if (0 <= land_r < 5 and 0 <= land_c < 5 and 
                    board[land_r, land_c] == PieceType.EMPTY.value):
                    return True
        
        return False

class DoubleQLearningAgent:
    """Base double Q-learning agent for Baghchal."""
    
    def __init__(self, player: Player, config: QLearningConfig = None):
        self.player = player
        self.config = config or QLearningConfig()
        
        # Two Q-tables for double Q-learning
        self.q_table_a = defaultdict(lambda: defaultdict(float))
        self.q_table_b = defaultdict(lambda: defaultdict(float))
        
        # Experience replay
        self.memory = deque(maxlen=self.config.memory_size)
        
        # State encoder
        self.state_encoder = StateEncoder()
        
        # Training statistics
        self.training_stats = {
            'episodes': 0,
            'wins': 0,
            'losses': 0,
            'average_reward': 0,
            'epsilon_history': []
        }
        
        print(f"🤖 Double Q-Learning {player.name} Agent initialized")
    
    def select_action(self, env: BaghchalEnv, state: Dict) -> Optional[Tuple]:
        """Select action using epsilon-greedy policy with double Q-learning."""
        valid_actions = env.get_valid_actions(self.player)
        if not valid_actions:
            return None
        
        state_key = self.state_encoder.encode_state(state, self.player)
        
        # Epsilon-greedy action selection
        if random.random() < self.config.epsilon:
            # Exploration: random action
            action = random.choice(valid_actions)
            print(f"🎲 {self.player.name} exploring: {action}")
        else:
            # Exploitation: best action according to Q-values
            action = self._get_best_action(state_key, valid_actions)
            print(f"🎯 {self.player.name} exploiting: {action}")
        
        return action
    
    def _get_best_action(self, state_key: str, valid_actions: List[Tuple]) -> Tuple:
        """Get best action using average of both Q-tables."""
        best_action = None
        best_value = float('-inf')
        
        for action in valid_actions:
            action_key = str(action)
            # Average Q-values from both tables
            q_value = (self.q_table_a[state_key][action_key] + 
                      self.q_table_b[state_key][action_key]) / 2.0
            
            if q_value > best_value:
                best_value = q_value
                best_action = action
        
        return best_action or random.choice(valid_actions)
    
    def update_q_values(self, state: Dict, action: Tuple, reward: float, 
                       next_state: Dict, done: bool):
        """Update Q-values using double Q-learning algorithm."""
        state_key = self.state_encoder.encode_state(state, self.player)
        next_state_key = self.state_encoder.encode_state(next_state, self.player)
        action_key = str(action)
        
        # Store experience in memory
        self.memory.append((state_key, action_key, reward, next_state_key, done))
        
        # Double Q-learning update
        if random.random() < 0.5:
            # Update Q_A using Q_B for next state value
            self._update_q_table_a(state_key, action_key, reward, next_state_key, done)
        else:
            # Update Q_B using Q_A for next state value
            self._update_q_table_b(state_key, action_key, reward, next_state_key, done)
        
        # Decay epsilon
        if self.config.epsilon > self.config.epsilon_min:
            self.config.epsilon *= self.config.epsilon_decay
    
    def _update_q_table_a(self, state_key: str, action_key: str, reward: float, 
                         next_state_key: str, done: bool):
        """Update Q-table A using Q-table B for bootstrapping."""
        if done:
            target = reward
        else:
            # Find best action according to Q_A
            best_next_action = self._get_best_action_from_table(next_state_key, self.q_table_a)
            if best_next_action:
                # Use Q_B value for that action
                target = reward + self.config.gamma * self.q_table_b[next_state_key][str(best_next_action)]
            else:
                target = reward
        
        # Update Q_A
        current_q = self.q_table_a[state_key][action_key]
        self.q_table_a[state_key][action_key] += self.config.alpha * (target - current_q)
    
    def _update_q_table_b(self, state_key: str, action_key: str, reward: float, 
                         next_state_key: str, done: bool):
        """Update Q-table B using Q-table A for bootstrapping."""
        if done:
            target = reward
        else:
            # Find best action according to Q_B
            best_next_action = self._get_best_action_from_table(next_state_key, self.q_table_b)
            if best_next_action:
                # Use Q_A value for that action
                target = reward + self.config.gamma * self.q_table_a[next_state_key][str(best_next_action)]
            else:
                target = reward
        
        # Update Q_B
        current_q = self.q_table_b[state_key][action_key]
        self.q_table_b[state_key][action_key] += self.config.alpha * (target - current_q)
    
    def _get_best_action_from_table(self, state_key: str, q_table: Dict) -> Optional[Tuple]:
        """Get best action from a specific Q-table."""
        if state_key not in q_table or not q_table[state_key]:
            return None
        
        best_action_key = max(q_table[state_key], key=q_table[state_key].get)
        try:
            # Convert string back to tuple
            return eval(best_action_key)
        except:
            return None
    
    def calculate_reward(self, old_state: Dict, new_state: Dict, action: Tuple) -> float:
        """Calculate reward for the given state transition."""
        # Base reward structure - to be overridden by specific agents
        reward = 0.0
        
        # Game outcome rewards
        if new_state.get('game_over', False):
            winner = new_state.get('winner')
            if winner == self.player.name:
                reward += 100.0  # Win bonus
            else:
                reward -= 100.0  # Loss penalty
        
        # Small step penalty to encourage shorter games
        reward -= 0.1
        
        return reward
    
    def save_model(self, filepath: str):
        """Save the trained Q-tables and configuration."""
        model_data = {
            'player': self.player.name,
            'q_table_a': dict(self.q_table_a),
            'q_table_b': dict(self.q_table_b),
            'config': {
                'alpha': self.config.alpha,
                'gamma': self.config.gamma,
                'epsilon': self.config.epsilon,
                'epsilon_decay': self.config.epsilon_decay,
                'epsilon_min': self.config.epsilon_min
            },
            'training_stats': self.training_stats
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"💾 Saved {self.player.name} Q-learning model to {filepath}")
    
    def load_model(self, filepath: str) -> bool:
        """Load trained Q-tables and configuration."""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            # Convert back to defaultdicts
            self.q_table_a = defaultdict(lambda: defaultdict(float))
            self.q_table_b = defaultdict(lambda: defaultdict(float))
            
            for state_key, actions in model_data['q_table_a'].items():
                for action_key, value in actions.items():
                    self.q_table_a[state_key][action_key] = value
            
            for state_key, actions in model_data['q_table_b'].items():
                for action_key, value in actions.items():
                    self.q_table_b[state_key][action_key] = value
            
            # Load configuration
            config_data = model_data['config']
            self.config.alpha = config_data['alpha']
            self.config.gamma = config_data['gamma']
            self.config.epsilon = config_data['epsilon']
            self.config.epsilon_decay = config_data['epsilon_decay']
            self.config.epsilon_min = config_data['epsilon_min']
            
            # Load stats
            self.training_stats = model_data.get('training_stats', self.training_stats)
            
            print(f"📖 Loaded {self.player.name} Q-learning model from {filepath}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to load model from {filepath}: {e}")
            return False
    
    def get_q_value(self, state: Dict, action: Tuple) -> float:
        """Get Q-value for state-action pair (average of both tables)."""
        state_key = self.state_encoder.encode_state(state, self.player)
        action_key = str(action)
        
        q_a = self.q_table_a[state_key][action_key]
        q_b = self.q_table_b[state_key][action_key]
        
        return (q_a + q_b) / 2.0
    
    def get_training_stats(self) -> Dict:
        """Get training statistics."""
        return self.training_stats.copy()
    
    def _simulate_action(self, state: Dict, action: Tuple) -> Dict:
        """Simulate an action and return the resulting state."""
        import copy
        import numpy as np
        
        # Create a deep copy of the state
        new_state = copy.deepcopy(state)
        board = np.array(new_state['board'])
        
        if action[0] == 'place':
            # Place a goat
            row, col = action[1], action[2]
            if 0 <= row < 5 and 0 <= col < 5 and board[row, col] == PieceType.EMPTY.value:
                board[row, col] = PieceType.GOAT.value
                new_state['goats_placed'] = new_state.get('goats_placed', 0) + 1
                
                # Check if all goats are placed
                if new_state['goats_placed'] >= 20:
                    new_state['phase'] = GamePhase.MOVEMENT
        
        elif action[0] == 'move':
            # Move a piece
            from_row, from_col, to_row, to_col = action[1], action[2], action[3], action[4]
            
            if (0 <= from_row < 5 and 0 <= from_col < 5 and 
                0 <= to_row < 5 and 0 <= to_col < 5):
                
                piece_type = board[from_row, from_col]
                
                # Check if it's a capture move for tigers
                if (piece_type == PieceType.TIGER.value and 
                    abs(to_row - from_row) == 2 or abs(to_col - from_col) == 2):
                    
                    # This is a capture move
                    mid_row = (from_row + to_row) // 2
                    mid_col = (from_col + to_col) // 2
                    
                    if board[mid_row, mid_col] == PieceType.GOAT.value:
                        # Capture the goat
                        board[mid_row, mid_col] = PieceType.EMPTY.value
                        new_state['goats_captured'] = new_state.get('goats_captured', 0) + 1
                
                # Move the piece
                board[to_row, to_col] = piece_type
                board[from_row, from_col] = PieceType.EMPTY.value
        
        new_state['board'] = board.tolist()
        
        # Check for game over conditions
        goats_captured = new_state.get('goats_captured', 0)
        if goats_captured >= 5:
            new_state['game_over'] = True
            new_state['winner'] = 'TIGER'
        else:
            # Check if tigers are blocked
            tiger_positions = []
            for r in range(5):
                for c in range(5):
                    if board[r, c] == PieceType.TIGER.value:
                        tiger_positions.append((r, c))
            
            if tiger_positions and self._check_if_tigers_blocked(board, tiger_positions):
                new_state['game_over'] = True
                new_state['winner'] = 'GOAT'
        
        return new_state
    
    def _check_if_tigers_blocked(self, board: np.ndarray, tiger_positions: list) -> bool:
        """Check if all tigers are blocked."""
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
        
        return True 