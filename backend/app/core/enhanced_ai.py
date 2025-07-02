"""
Advanced AI System for Baghchal Game
Integrates trained advanced AI agents with the backend.
"""

import os
import pickle
import numpy as np
import random
from typing import Dict, Optional, Tuple
from pathlib import Path

try:
    from .baghchal_env import Player
    from ..ai.agents import AdvancedTigerAI, AdvancedGoatAI, TigerStrategy, GoatStrategy
    ADVANCED_AI_AVAILABLE = True
    print("🎯 Advanced Baghchal AI System loaded successfully!")
except ImportError as e:
    print(f"Warning: Could not import advanced AI system: {e}")
    ADVANCED_AI_AVAILABLE = False

class AIManager:
    """Manages loading and interacting with AI agents."""
    
    def __init__(self):
        self.tiger_agent = self._load_agent('tiger')
        self.goat_agent = self._load_agent('goat')

    def _load_agent(self, agent_type: str) -> Optional[object]:
        """Loads a specified AI agent from a .pkl file."""
        if not ADVANCED_AI_AVAILABLE:
            print(f"Cannot load {agent_type} agent, advanced AI module not available.")
            return None

        model_name = f"advanced_{agent_type}_ai.pkl"
        # The models are in a predictable location: backend/app/ai/models/
        model_path = Path(__file__).parent.parent / "ai" / "models" / model_name

        if not model_path.exists():
            print(f"Warning: Model file not found at {model_path}. Using default rule-based agent.")
            if agent_type == 'tiger':
                return AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert")
            else:
                return AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "expert")
        
        try:
            with open(model_path, 'rb') as f:
                agent = pickle.load(f)
            print(f"✅ Loaded trained {agent_type.capitalize()} AI from {model_path}")
            return agent
        except Exception as e:
            print(f"Warning: Could not load trained {agent_type} model from {model_path}: {e}. Using default.")
            if agent_type == 'tiger':
                return AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert")
            else:
                return AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "expert")

    def get_ai_move(self, player_type: Player, env, state: Dict) -> Optional[Tuple]:
        """Get an AI move for the specified player."""
        agent = self.tiger_agent if player_type == Player.TIGER else self.goat_agent
        
        if not agent:
            print(f"❌ AI agent for {player_type.name} not available.")
            return None
        
        try:
            # Ensure board is a numpy array for the AI
            if 'board' in state and not isinstance(state['board'], np.ndarray):
                state = state.copy()
                state['board'] = np.array(state['board'])
            
            action = agent.select_action(env, state)
            print(f"🤖 AI ({player_type.name}) selected: {action}")
            return action
        except Exception as e:
            print(f"❌ AI select_action failed: {e}. Falling back to random move.")
            valid_actions = env.get_valid_actions(player_type)
            return random.choice(valid_actions) if valid_actions else None

# Singleton instance of the AI Manager
_ai_manager = AIManager()

def get_enhanced_ai_move(player: Player, env, state: Dict) -> Optional[Tuple]:
    """Public function to get a move from the AI manager."""
    return _ai_manager.get_ai_move(player, env, state) 