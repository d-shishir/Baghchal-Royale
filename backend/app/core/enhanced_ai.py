"""
Advanced AI System for Baghchal Game
Integrates trained advanced AI agents with backend compatibility
"""

import os
import pickle
import numpy as np
import random
from typing import Dict, List, Tuple, Optional, Union
from enum import Enum

try:
    from .baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
except ImportError:
    try:
        from baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
    except ImportError:
        print("Warning: Could not import BaghchalEnv from backend")

# Import our advanced AI system
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

try:
    from advanced_baghchal_ai import (
        AdvancedBaghchalAI, AdvancedTigerAI, AdvancedGoatAI, 
        TigerStrategy, GoatStrategy
    )
    ADVANCED_AI_AVAILABLE = True
    print("🎯 Advanced Baghchal AI System loaded successfully!")
except ImportError as e:
    print(f"Warning: Could not import advanced AI system: {e}")
    ADVANCED_AI_AVAILABLE = False

class AIPlayer:
    """AI Player wrapper that works with the backend."""
    
    def __init__(self, player_type: Player, model_type: str = "advanced", custom_model_path: Optional[str] = None):
        self.player_type = player_type
        self.model_type = model_type
        self.custom_model_path = custom_model_path
        self.ai_agent = None
        self.model_info = {}
        
        # Load the advanced AI agent
        self._load_ai_agent()
        
        print(f"✅ AI Player initialized:")
        print(f"   Type: {player_type.name}")
        print(f"   Model: {model_type}")
        print(f"   Agent: {type(self.ai_agent).__name__}")
    
    def _load_ai_agent(self):
        """Load the appropriate AI agent."""
        if ADVANCED_AI_AVAILABLE:
            if self.player_type == Player.TIGER:
                self.ai_agent = self._load_advanced_tiger()
            else:
                self.ai_agent = self._load_advanced_goat()
        else:
            # Fallback to basic AI
            self.ai_agent = BasicAI(self.player_type)
    
    def _load_advanced_tiger(self):
        """Load advanced tiger AI."""
        # Try to load trained model first
        # Try different possible locations for the pkl file
        possible_paths = [
            "advanced_tiger_ai.pkl",  # Current working directory (backend/)
            os.path.join(os.path.dirname(__file__), "../../../advanced_tiger_ai.pkl"),  # Root directory
            os.path.join(os.path.dirname(__file__), "../../advanced_tiger_ai.pkl")  # Backend directory from core
        ]
        
        model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                model_path = path
                break
        if model_path and os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    trained_agent = pickle.load(f)
                self.model_info = {
                    'type': 'trained_advanced',
                    'strategy': trained_agent.strategy.value,
                    'difficulty': trained_agent.difficulty
                }
                print(f"✅ Loaded trained Tiger AI: {trained_agent.strategy.value} from {model_path}")
                return trained_agent
            except Exception as e:
                print(f"Warning: Could not load trained tiger model: {e}")
        
        # Fallback to new advanced AI
        tiger_ai = AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert")
        self.model_info = {
            'type': 'advanced_rule_based',
            'strategy': tiger_ai.strategy.value,
            'difficulty': tiger_ai.difficulty
        }
        return tiger_ai
    
    def _load_advanced_goat(self):
        """Load advanced goat AI."""
        # Try to load trained model first
        # Try different possible locations for the pkl file
        possible_paths = [
            "advanced_goat_ai.pkl",  # Current working directory (backend/)
            os.path.join(os.path.dirname(__file__), "../../../advanced_goat_ai.pkl"),  # Root directory
            os.path.join(os.path.dirname(__file__), "../../advanced_goat_ai.pkl")  # Backend directory from core
        ]
        
        model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                model_path = path
                break
        if model_path and os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    trained_agent = pickle.load(f)
                self.model_info = {
                    'type': 'trained_advanced',
                    'strategy': trained_agent.strategy.value,
                    'difficulty': trained_agent.difficulty
                }
                print(f"✅ Loaded trained Goat AI: {trained_agent.strategy.value} from {model_path}")
                return trained_agent
            except Exception as e:
                print(f"Warning: Could not load trained goat model: {e}")
        
        # Fallback to new advanced AI
        goat_ai = AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "expert")
        self.model_info = {
            'type': 'advanced_rule_based',
            'strategy': goat_ai.strategy.value,
            'difficulty': goat_ai.difficulty
        }
        return goat_ai
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """Select action using the AI agent."""
        if hasattr(self.ai_agent, 'select_action'):
            try:
                # Ensure board is numpy array for advanced AI
                if 'board' in state and not isinstance(state['board'], np.ndarray):
                    state = state.copy()
                    state['board'] = np.array(state['board'])
                
                print(f"🤖 AI agent {type(self.ai_agent).__name__} calling select_action...")
                action = self.ai_agent.select_action(env, state)
                print(f"🤖 AI agent returned: {action}")
                return action
            except Exception as e:
                print(f"❌ AI select_action failed: {e}")
                import traceback
                print(f"❌ Traceback: {traceback.format_exc()}")
                # Fallback to random move
                valid_actions = env.get_valid_actions(self.player_type)
                return random.choice(valid_actions) if valid_actions else None
        else:
            # Fallback for basic AI
            valid_actions = env.get_valid_actions(self.player_type)
            return random.choice(valid_actions) if valid_actions else None
    
    def get_move_confidence(self) -> float:
        """Get confidence of the AI."""
        return getattr(self.ai_agent, 'confidence', 0.85)
    
    def get_strategy_info(self) -> Dict:
        """Get strategy information."""
        info = {
            'model_type': self.model_type,
            'player_type': self.player_type.name.lower(),
            'confidence': self.get_move_confidence()
        }
        info.update(self.model_info)
        return info
    
    def get_statistics(self) -> Dict:
        """Get AI statistics."""
        return {
            'total_moves': getattr(self, 'total_moves', 0),
            'successful_moves': getattr(self, 'successful_moves', 0),
            'capture_rate': getattr(self, 'capture_rate', 0.0)
        }

class BasicAI:
    """Basic fallback AI for when advanced AI is not available."""
    
    def __init__(self, player_type: Player):
        self.player_type = player_type
        self.confidence = 0.5
    
    def select_action(self, env, state: Dict) -> Optional[Tuple]:
        """Select random valid action."""
        valid_actions = env.get_valid_actions(self.player_type)
        return random.choice(valid_actions) if valid_actions else None

class AIGameManager:
    """Manages AI players for the game."""
    
    def __init__(self):
        self.ai_players = {}
        self.system_initialized = False
        
        try:
            self._initialize_ai_system()
            self.system_initialized = True
            print("✅ AI Game Manager initialized successfully")
        except Exception as e:
            print(f"Warning: AI initialization failed: {e}")
    
    def _initialize_ai_system(self):
        """Initialize the AI system."""
        # Pre-create AI players for both sides
        self.ai_players['tigers'] = AIPlayer(Player.TIGER, "advanced")
        self.ai_players['goats'] = AIPlayer(Player.GOAT, "advanced")
    
    def create_ai_player(self, player_type: Player, difficulty: str = "advanced") -> AIPlayer:
        """Create an AI player."""
        return AIPlayer(player_type, difficulty)
    
    def get_ai_move(self, player_type: Player, env) -> Optional[Tuple]:
        """Get AI move for the specified player type."""
        try:
            # Get current state
            current_state = {
                'board': env.board,
                'current_player': env.current_player,
                'phase': env.phase,
                'goats_placed': env.goats_placed,
                'goats_captured': env.goats_captured
            }
            
            # Get appropriate AI player
            player_key = player_type.name.lower() + 's'
            ai_player = self.ai_players.get(player_key)
            
            if not ai_player:
                print(f"Creating new AI player for {player_type.name}")
                ai_player = self.create_ai_player(player_type)
                self.ai_players[player_key] = ai_player
            
            # Get the move
            action = ai_player.select_action(env, current_state)
            
            if action:
                print(f"🤖 AI ({player_type.name}) selected: {action}")
                return action
            else:
                print(f"⚠️ AI ({player_type.name}) found no valid actions")
                return None
                
        except Exception as e:
            print(f"❌ AI move generation failed: {e}")
            # Fallback to random move
            valid_actions = env.get_valid_actions(player_type)
            return random.choice(valid_actions) if valid_actions else None
    
    def get_system_info(self) -> Dict:
        """Get system information."""
        return {
            'initialized': self.system_initialized,
            'advanced_ai_available': ADVANCED_AI_AVAILABLE,
            'players_loaded': list(self.ai_players.keys()),
            'system_type': 'Advanced Rule-based AI with Trained Models'
        }

# Global AI manager instance
_ai_manager = None

def get_ai_manager() -> AIGameManager:
    """Get or create AI manager instance."""
    global _ai_manager
    if _ai_manager is None:
        print("🎯 AI Game Manager initialized")
        _ai_manager = AIGameManager()
    return _ai_manager

# Compatibility functions for backend integration
def create_enhanced_tiger(model_path: Optional[str] = None) -> AIPlayer:
    """Create enhanced tiger AI player."""
    return AIPlayer(Player.TIGER, "advanced", model_path)

def create_enhanced_goat(model_path: Optional[str] = None) -> AIPlayer:
    """Create enhanced goat AI player."""
    return AIPlayer(Player.GOAT, "advanced", model_path)

def get_ai_system_info() -> Dict:
    """Get AI system information."""
    manager = get_ai_manager()
    return manager.get_system_info()

def get_ai_move(player_type: Union[str, Player], env) -> Optional[Tuple]:
    """Get AI move for player type."""
    if isinstance(player_type, str):
        player_type = Player.TIGER if player_type.lower() == 'tigers' else Player.GOAT
    
    manager = get_ai_manager()
    return manager.get_ai_move(player_type, env)

# Initialize the system when module is loaded
print("🎯 AI Game Manager initialized")
_ai_manager = AIGameManager() 