"""
Advanced AI System for Baghchal Game
Integrates trained advanced AI agents with the backend.
"""

import os
import pickle
import numpy as np
import random
import copy
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
        print(f"Always using rule-based agent for {agent_type} to ensure latest logic.")
        if agent_type == 'tiger':
            return AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert")
        else:
            return AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "expert")

    def get_ai_move(self, player_type: Player, env, state: Dict) -> Optional[Tuple]:
        """Get an AI move for the specified player."""
        agent = self.tiger_agent if player_type == Player.TIGER else self.goat_agent
        
        if not agent:
            print(f"❌ AI agent for {player_type.name} not available. Falling back to random move.")
            valid_actions = env.get_valid_actions(player_type)
            if valid_actions:
                action = random.choice(valid_actions)
                print(f"🤖 Random move selected for {player_type.name}: {action}")
                return action
            else:
                print(f"❌ No valid actions available for {player_type.name} in random fallback.")
                return None
        
        try:
            # Ensure board is a numpy array for the AI
            current_state = copy.deepcopy(state)
            if 'board' in current_state and not isinstance(current_state['board'], np.ndarray):
                current_state['board'] = np.array(current_state['board'])
            
            print(f"🔍 AI evaluating move for {player_type.name}...")
            action = agent.select_action(env, current_state)
            if action is None:
                print(f"❌ AI agent for {player_type.name} returned None. Falling back to random move.")
                valid_actions = env.get_valid_actions(player_type)
                if valid_actions:
                    action = random.choice(valid_actions)
                    print(f"🤖 Random move selected for {player_type.name}: {action}")
                    return action
                else:
                    print(f"❌ No valid actions available for {player_type.name} after AI failure.")
                    return None
            else:
                print(f"✅ AI selected move for {player_type.name}: {action}")
                return action
        except Exception as e:
            print(f"❌ AI Error for {player_type.name}: {e}. Falling back to random move.")
            valid_actions = env.get_valid_actions(player_type)
            if valid_actions:
                action = random.choice(valid_actions)
                print(f"🤖 Random move selected for {player_type.name}: {action}")
                return action
            else:
                print(f"❌ No valid actions available for {player_type.name} after exception.")
                return None

# Global AI instance
ai_manager = AIManager()

def get_enhanced_ai_move(player_type: Player, env, state: Dict) -> Optional[Tuple]:
    """Global function to get an AI move from the enhanced AI manager."""
    return ai_manager.get_ai_move(player_type, env, state) 