"""
Enhanced AI System for Baghchal Game
Supports both Tiger and Goat trained AI agents with Q-Learning
"""

import numpy as np
import pickle
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union
from enum import Enum
import random

# Add current directory to path for imports
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))
sys.path.append(str(current_dir.parent.parent.parent))

try:
    from .baghchal_env import BaghchalEnv, Player, GamePhase
except ImportError:
    try:
        from baghchal_env import BaghchalEnv, Player, GamePhase
    except ImportError:
        print("Warning: Could not import BaghchalEnv")

class AIPlayer:
    """Enhanced AI Player that can play as either Tiger or Goat using trained Q-Learning models."""
    
    def __init__(self, player_type: Player, model_type: str = "enhanced", 
                 custom_model_path: Optional[str] = None):
        self.player_type = player_type
        self.model_type = model_type
        self.q_table_a = {}
        self.q_table_b = {}
        self.use_double_q = True
        self.feature_engineering = True
        self.confidence = 0.0
        self.strategy_description = ""
        
        # Load appropriate model
        self._load_model(custom_model_path)
        
        print(f"✅ {player_type.name} AI Player initialized:")
        print(f"   - Model: {self.strategy_description}")
        print(f"   - Q-Table A size: {len(self.q_table_a):,}")
        print(f"   - Q-Table B size: {len(self.q_table_b):,}")
    
    def _load_model(self, custom_path: Optional[str] = None):
        """Load the appropriate trained model for this player type."""
        model_files = []
        
        if custom_path:
            model_files.append(custom_path)
        
        # Get the project root directory (go up from backend/app/core to project root)
        project_root = Path(__file__).parent.parent.parent.parent
        backend_dir = Path(__file__).parent.parent.parent
        
        # Default model files based on player type - check multiple locations
        if self.player_type == Player.TIGER:
            model_files.extend([
                str(project_root / "enhanced_tiger_dual.pkl"),      # Project root
                str(backend_dir / "enhanced_tiger_dual.pkl"),       # Backend directory
                str(Path(__file__).parent / "enhanced_tiger_dual.pkl"),  # Same as this file
                "../enhanced_tiger_dual.pkl",                      # Relative fallback
                "../../enhanced_tiger_dual.pkl",                   # Relative fallback
                "../../../enhanced_tiger_dual.pkl",                # Relative fallback
                "enhanced_tiger_q_table.pkl",                      # Old format fallback
                "../enhanced_tiger_q_table.pkl",
                "../../enhanced_tiger_q_table.pkl"
            ])
        else:  # Player.GOAT
            model_files.extend([
                str(project_root / "enhanced_goat_dual.pkl"),       # Project root
                str(backend_dir / "enhanced_goat_dual.pkl"),        # Backend directory
                str(Path(__file__).parent / "enhanced_goat_dual.pkl"),   # Same as this file
                "../enhanced_goat_dual.pkl",                       # Relative fallback
                "../../enhanced_goat_dual.pkl",                    # Relative fallback
                "../../../enhanced_goat_dual.pkl",                 # Relative fallback
                "enhanced_goat_q_table.pkl",                       # Old format fallback
                "../enhanced_goat_q_table.pkl",
                "../../enhanced_goat_q_table.pkl"
            ])
        
        # Try to load models in order of preference
        for model_file in model_files:
            if self._try_load_model(model_file):
                return
        
        # Fallback to rule-based strategy
        print(f"⚠️  No trained model found for {self.player_type.name}, using rule-based AI")
        self._create_fallback_strategy()
    
    def _try_load_model(self, filename: str) -> bool:
        """Try to load a specific model file."""
        try:
            if not os.path.exists(filename):
                return False
                
            with open(filename, 'rb') as f:
                model_data = pickle.load(f)
            
            # Load Q-tables
            self.q_table_a = model_data.get('q_table_a', {})
            self.q_table_b = model_data.get('q_table_b', {})
            
            # Load training metadata
            episodes = model_data.get('episode_count', 0)
            avg_reward = model_data.get('avg_reward', 0)
            
            # Determine model quality
            if len(self.q_table_a) > 3000:
                quality = "Expert"
                self.confidence = 0.95
            elif len(self.q_table_a) > 1000:
                quality = "Advanced"  
                self.confidence = 0.80
            else:
                quality = "Intermediate"
                self.confidence = 0.65
                
            self.strategy_description = f"{quality} Q-Learning ({episodes:,} episodes trained)"
            
            print(f"✅ Loaded {self.player_type.name} model from {filename}")
            print(f"   - Training episodes: {episodes:,}")
            print(f"   - Model quality: {quality}")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to load {filename}: {e}")
            return False
    
    def _create_fallback_strategy(self):
        """Create fallback rule-based strategy when no trained model available."""
        if self.player_type == Player.TIGER:
            self.strategy_description = "Rule-based Aggressive Hunter"
            self.confidence = 0.60
        else:
            self.strategy_description = "Rule-based Defensive Survivor"
            self.confidence = 0.55
        
        # Empty Q-tables will trigger rule-based behavior
        self.q_table_a = {}
        self.q_table_b = {}
    
    def _extract_features(self, state: Dict) -> np.ndarray:
        """Extract features from game state (same as training)."""
        if not self.feature_engineering:
            return self._simple_state_hash(state)
        
        board = state['board']
        phase = state['phase']
        goats_captured = state['goats_captured']
        goats_placed = state['goats_placed']
        
        features = []
        
        # Basic game state
        features.extend([
            1.0 if phase == GamePhase.PLACEMENT else 0.0,
            1.0 if phase == GamePhase.MOVEMENT else 0.0,
            goats_captured / 5.0,
            goats_placed / 20.0
        ])
        
        # Find pieces
        tiger_positions = []
        goat_positions = []
        
        for row in range(5):
            for col in range(5):
                if board[row, col] == 1:  # Tiger
                    tiger_positions.append((row, col))
                elif board[row, col] == 2:  # Goat
                    goat_positions.append((row, col))
        
        # Strategic features
        features.extend([
            len(goat_positions) / 20.0,
            len(tiger_positions) / 4.0,
        ])
        
        if self.player_type == Player.TIGER:
            # Tiger-specific features
            center_control = 1 if (2, 2) in tiger_positions else 0
            capture_potential = self._calculate_tiger_capture_potential(tiger_positions, goat_positions, board)
            mobility = self._calculate_tiger_mobility(tiger_positions, board)
        else:
            # Goat-specific features  
            center_control = 1 if (2, 2) in goat_positions else 0
            capture_potential = self._calculate_goat_blocking_potential(goat_positions, tiger_positions, board)
            mobility = self._calculate_goat_formation_strength(goat_positions)
        
        features.extend([center_control, capture_potential, mobility])
        
        return np.array(features, dtype=np.float32)
    
    def _calculate_tiger_capture_potential(self, tiger_positions, goat_positions, board):
        """Calculate tiger's capture potential."""
        if not tiger_positions or not goat_positions:
            return 0.0
        
        capture_opportunities = 0
        for tiger_pos in tiger_positions:
            for goat_pos in goat_positions:
                if self._can_tiger_capture(tiger_pos, goat_pos, board):
                    capture_opportunities += 1
        
        return min(capture_opportunities / len(goat_positions), 1.0)
    
    def _calculate_tiger_mobility(self, tiger_positions, board):
        """Calculate tiger mobility score."""
        if not tiger_positions:
            return 0.0
        
        total_moves = 0
        for tiger_pos in tiger_positions:
            moves = self._count_available_moves(tiger_pos, board)
            total_moves += moves
        
        return min(total_moves / (len(tiger_positions) * 8), 1.0)
    
    def _calculate_goat_blocking_potential(self, goat_positions, tiger_positions, board):
        """Calculate goat's blocking potential."""
        if not goat_positions or not tiger_positions:
            return 0.0
        
        blocking_score = 0
        for goat_pos in goat_positions:
            for tiger_pos in tiger_positions:
                if abs(goat_pos[0] - tiger_pos[0]) + abs(goat_pos[1] - tiger_pos[1]) == 1:
                    blocking_score += 1
        
        return min(blocking_score / (len(goat_positions) + len(tiger_positions)), 1.0)
    
    def _calculate_goat_formation_strength(self, goat_positions):
        """Calculate goat formation strength."""
        if len(goat_positions) < 2:
            return 0.0
        
        pairs = 0
        for i, pos1 in enumerate(goat_positions):
            for pos2 in goat_positions[i+1:]:
                if abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1]) == 1:
                    pairs += 1
        
        return min(pairs / len(goat_positions), 1.0)
    
    def _can_tiger_capture(self, tiger_pos, goat_pos, board):
        """Check if tiger can capture a specific goat."""
        tr, tc = tiger_pos
        gr, gc = goat_pos
        
        # Check if goat is adjacent
        if abs(tr - gr) + abs(tc - gc) != 1:
            return False
        
        # Check if there's space behind goat for capture
        dr, dc = gr - tr, gc - tc
        behind_r, behind_c = gr + dr, gc + dc
        
        if 0 <= behind_r < 5 and 0 <= behind_c < 5:
            return board[behind_r, behind_c] == 0
        
        return False
    
    def _count_available_moves(self, position, board):
        """Count available moves from a position."""
        row, col = position
        moves = 0
        
        # Check all 8 directions
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0:
                    continue
                new_r, new_c = row + dr, col + dc
                if 0 <= new_r < 5 and 0 <= new_c < 5:
                    if board[new_r, new_c] == 0:
                        moves += 1
        
        return moves
    
    def _state_to_hash(self, state: Dict) -> str:
        """Convert state to hash for Q-table lookup."""
        if self.feature_engineering:
            features = self._extract_features(state)
            discretized = [round(f, 2) for f in features]
            return str(tuple(discretized))
        else:
            board_str = ''.join(str(int(x)) for row in state['board'] for x in row)
            phase_value = state['phase'].value if hasattr(state['phase'], 'value') else str(state['phase'])
            return f"{board_str}_{phase_value}_{state['goats_captured']}_{state['goats_placed']}"
    
    def get_q_value(self, state_hash: str, action: Tuple, table: str = 'a') -> float:
        """Get Q-value for state-action pair."""
        key = (state_hash, action)
        if table == 'a':
            return self.q_table_a.get(key, 0.0)
        else:
            return self.q_table_b.get(key, 0.0)
    
    def select_action(self, env: BaghchalEnv, state: Dict) -> Optional[Tuple]:
        """Select best action using trained Q-values or fallback strategy."""
        valid_actions = env.get_valid_actions(self.player_type)
        if not valid_actions:
            print(f"⚠️  No valid actions available for {self.player_type.name}")
            return None
        
        print(f"🤖 {self.player_type.name} AI considering {len(valid_actions)} actions: {valid_actions[:3]}...")
        
        # If we have trained Q-tables, use them
        if len(self.q_table_a) > 0:
            action = self._select_q_learning_action(state, valid_actions)
        else:
            # Fallback to rule-based strategy
            action = self._select_rule_based_action(env, state, valid_actions)
        
        print(f"🎯 {self.player_type.name} AI selected action: {action}")
        return action
    
    def _select_q_learning_action(self, state: Dict, valid_actions: List[Tuple]) -> Tuple:
        """Select action using Q-learning."""
        state_hash = self._state_to_hash(state)
        
        best_action = None
        best_value = float('-inf')
        
        # Add exploration component
        epsilon = 0.1  # Small exploration rate for trained models
        if random.random() < epsilon:
            action = random.choice(valid_actions)
            print(f"🔄 {self.player_type.name} AI exploring with random action: {action}")
            return action
        
        for action in valid_actions:
            q_a = self.get_q_value(state_hash, action, 'a')
            q_b = self.get_q_value(state_hash, action, 'b') if self.use_double_q else 0
            avg_q = (q_a + q_b) / (2 if self.use_double_q else 1)
            
            if avg_q > best_value:
                best_value = avg_q
                best_action = action
        
        # Update confidence based on Q-value certainty
        if best_value > 0:
            self.confidence = min(0.95, self.confidence + 0.05)
        
        if best_action is None:
            best_action = random.choice(valid_actions)
            print(f"⚠️  {self.player_type.name} AI falling back to random action")
        
        return best_action
    
    def _select_rule_based_action(self, env: BaghchalEnv, state: Dict, valid_actions: List[Tuple]) -> Tuple:
        """Fallback rule-based action selection."""
        if self.player_type == Player.TIGER:
            return self._tiger_rule_based(env, state, valid_actions)
        else:
            return self._goat_rule_based(env, state, valid_actions)
    
    def _tiger_rule_based(self, env: BaghchalEnv, state: Dict, valid_actions: List[Tuple]) -> Tuple:
        """Rule-based tiger strategy."""
        # Prioritize captures
        capture_actions = []
        movement_actions = []
        
        for action in valid_actions:
            if len(action) == 5 and action[0] == 'move':  # Movement action
                if self._is_capture_move(action, state):
                    capture_actions.append(action)
                else:
                    movement_actions.append(action)
        
        if capture_actions:
            action = random.choice(capture_actions)
            print(f"🔥 Tiger choosing capture move: {action}")
            return action
        elif movement_actions:
            # Prefer moves toward center or toward goats
            action = self._choose_strategic_tiger_move(movement_actions, state)
            print(f"🎯 Tiger choosing strategic move: {action}")
            return action
        else:
            action = random.choice(valid_actions)
            print(f"🎲 Tiger choosing random action: {action}")
            return action
    
    def _goat_rule_based(self, env: BaghchalEnv, state: Dict, valid_actions: List[Tuple]) -> Tuple:
        """Rule-based goat strategy."""
        # Prioritize safe positions and blocking
        safe_actions = []
        blocking_actions = []
        
        for action in valid_actions:
            if self._is_safe_goat_move(action, state):
                safe_actions.append(action)
            if self._is_blocking_move(action, state):
                blocking_actions.append(action)
        
        if blocking_actions:
            action = random.choice(blocking_actions)
            print(f"🛡️  Goat choosing blocking move: {action}")
            return action
        elif safe_actions:
            action = random.choice(safe_actions)
            print(f"🛡️  Goat choosing safe move: {action}")
            return action
        else:
            action = random.choice(valid_actions)
            print(f"🎲 Goat choosing random action: {action}")
            return action
    
    def _is_capture_move(self, action: Tuple, state: Dict) -> bool:
        """Check if action results in capture."""
        # Simplified capture detection
        if len(action) != 5:
            return False
        
        from_r, from_c, to_r, to_c = action[1], action[2], action[3], action[4]
        return abs(to_r - from_r) == 2 or abs(to_c - from_c) == 2
    
    def _choose_strategic_tiger_move(self, actions: List[Tuple], state: Dict) -> Tuple:
        """Choose strategic tiger move."""
        # Prefer moves toward center
        center_moves = []
        for action in actions:
            if len(action) >= 5:
                to_r, to_c = action[3], action[4]
                if abs(to_r - 2) + abs(to_c - 2) <= 1:  # Close to center
                    center_moves.append(action)
        
        return random.choice(center_moves) if center_moves else random.choice(actions)
    
    def _is_safe_goat_move(self, action: Tuple, state: Dict) -> bool:
        """Check if goat move is safe."""
        # Simplified safety check
        if len(action) >= 3:
            to_r, to_c = action[1], action[2]
            # Avoid corners where tigers start
            if (to_r, to_c) in [(0, 0), (0, 4), (4, 0), (4, 4)]:
                return False
        return True
    
    def _is_blocking_move(self, action: Tuple, state: Dict) -> bool:
        """Check if move blocks tiger."""
        # Simplified blocking detection
        return False  # Would need more complex logic
    
    def get_move_confidence(self) -> float:
        """Get confidence level of the last move."""
        return self.confidence
    
    def get_strategy_info(self) -> Dict:
        """Get information about the AI strategy."""
        return {
            'player_type': self.player_type.name,
            'strategy': self.strategy_description,
            'confidence': self.confidence,
            'q_table_size': len(self.q_table_a),
            'double_q_learning': self.use_double_q,
            'feature_engineering': self.feature_engineering
        }
    
    def get_statistics(self) -> Dict:
        """Get AI player statistics for status reporting."""
        return {
            'model_type': self.model_type,
            'strategy': self.strategy_description,
            'confidence': self.confidence,
            'q_table_a_states': len(self.q_table_a),
            'q_table_b_states': len(self.q_table_b),
            'uses_double_q': self.use_double_q,
            'feature_engineering': self.feature_engineering,
            'player_type': self.player_type.name
        }


class AIGameManager:
    """Manages AI players and game coordination."""
    
    def __init__(self):
        self.tiger_ai = None
        self.goat_ai = None
        self.game_stats = {
            'games_played': 0,
            'tiger_wins': 0,
            'goat_wins': 0,
            'avg_game_length': 0
        }
        
        print("🎯 AI Game Manager initialized")
    
    def create_ai_player(self, player_type: Player, difficulty: str = "enhanced") -> AIPlayer:
        """Create an AI player with specified difficulty."""
        ai_player = AIPlayer(player_type, difficulty)
        
        if player_type == Player.TIGER:
            self.tiger_ai = ai_player
        else:
            self.goat_ai = ai_player
        
        return ai_player
    
    def get_ai_move(self, player_type: Player, env: BaghchalEnv) -> Optional[Tuple]:
        """Get AI move for specified player."""
        ai_player = self.tiger_ai if player_type == Player.TIGER else self.goat_ai
        
        if not ai_player:
            ai_player = self.create_ai_player(player_type)
        
        state = env.get_state()
        action = ai_player.select_action(env, state)
        
        return action
    
    def get_system_info(self) -> Dict:
        """Get comprehensive AI system information."""
        info = {
            'system_version': 'Enhanced AI System v3.0.0',
            'dual_training': True,
            'capabilities': [
                'Tiger Q-Learning Agent',
                'Goat Q-Learning Agent', 
                'Dual Self-Play Training',
                'Strategic Feature Engineering',
                'Double Q-Learning',
                'Rule-based Fallbacks'
            ]
        }
        
        if self.tiger_ai:
            info['tiger_ai'] = self.tiger_ai.get_strategy_info()
        if self.goat_ai:
            info['goat_ai'] = self.goat_ai.get_strategy_info()
            
        info['game_stats'] = self.game_stats.copy()
        
        return info


# Global AI manager instance
ai_manager = AIGameManager()

# Backward compatibility functions
def create_enhanced_tiger(model_path: Optional[str] = None) -> AIPlayer:
    """Create enhanced tiger AI (backward compatibility)."""
    return ai_manager.create_ai_player(Player.TIGER, "enhanced")

def create_enhanced_goat(model_path: Optional[str] = None) -> AIPlayer:
    """Create enhanced goat AI."""
    return ai_manager.create_ai_player(Player.GOAT, "enhanced")

def get_ai_system_info() -> Dict:
    """Get AI system information."""
    return ai_manager.get_system_info()


# Export main classes and functions
__all__ = [
    'AIPlayer',
    'AIGameManager', 
    'ai_manager',
    'create_enhanced_tiger',
    'create_enhanced_goat',
    'get_ai_system_info'
] 