"""
Advanced AI System for Baghchal Game
Integrates trained double Q-learning agents with fallback to rule-based agents.
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
    from ..ai.q_learning_agents import DoubleQLearningTigerAI, DoubleQLearningGoatAI
    from ..ai.double_q_learning import QLearningConfig
    ADVANCED_AI_AVAILABLE = True
    print("🎯 Advanced Baghchal AI System loaded successfully!")
except ImportError as e:
    print(f"Warning: Could not import advanced AI system: {e}")
    ADVANCED_AI_AVAILABLE = False

class AIManager:
    """Manages loading and interacting with AI agents with Q-learning priority."""
    
    def __init__(self):
        self.q_learning_tiger = None
        self.q_learning_goat = None
        self.rule_based_tiger = None
        self.rule_based_goat = None
        
        # Try to load Q-learning models first
        self._load_q_learning_agents()
        
        # Always have rule-based agents as fallback
        self._load_rule_based_agents()
        
        print("🤖 AI Manager initialized with Q-learning and rule-based agents")
    
    def _load_q_learning_agents(self):
        """Load trained Q-learning agents if available."""
        models_dir = Path("models/q_learning")
        tiger_model_path = models_dir / "enhanced_tiger_dual.pkl"
        goat_model_path = models_dir / "enhanced_goat_dual.pkl"
        
        # Load Tiger Q-learning agent
        if tiger_model_path.exists():
            try:
                # Create agent with evaluation configuration (low epsilon)
                eval_config = QLearningConfig(
                    alpha=0.1,  # Standard learning rate for gameplay
                    gamma=0.95,
                    epsilon=0.05,  # Very low exploration for strong play
                    epsilon_decay=1.0,  # No decay during gameplay
                    epsilon_min=0.05
                )
                
                self.q_learning_tiger = DoubleQLearningTigerAI(eval_config)
                if self.q_learning_tiger.load_model(str(tiger_model_path)):
                    print(f"✅ Loaded Q-learning Tiger model from {tiger_model_path}")
                else:
                    self.q_learning_tiger = None
            except Exception as e:
                print(f"❌ Failed to load Q-learning Tiger model: {e}")
                self.q_learning_tiger = None
        else:
            print(f"📁 No Q-learning Tiger model found at {tiger_model_path}")
        
        # Load Goat Q-learning agent
        if goat_model_path.exists():
            try:
                eval_config = QLearningConfig(
                    alpha=0.1,  # Standard learning rate for gameplay
                    gamma=0.95,
                    epsilon=0.05,  # Very low exploration for strong play
                    epsilon_decay=1.0,  # No decay during gameplay
                    epsilon_min=0.05
                )
                
                self.q_learning_goat = DoubleQLearningGoatAI(eval_config)
                if self.q_learning_goat.load_model(str(goat_model_path)):
                    print(f"✅ Loaded Q-learning Goat model from {goat_model_path}")
                else:
                    self.q_learning_goat = None
            except Exception as e:
                print(f"❌ Failed to load Q-learning Goat model: {e}")
                self.q_learning_goat = None
        else:
            print(f"📁 No Q-learning Goat model found at {goat_model_path}")
    
    def _load_rule_based_agents(self):
        """Load rule-based agents as fallback."""
        try:
            self.rule_based_tiger = AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert")
            self.rule_based_goat = AdvancedGoatAI(GoatStrategy.ADVANCED_TRAPPING, "expert")
            print("✅ Rule-based agents loaded as fallback")
        except Exception as e:
            print(f"❌ Failed to load rule-based agents: {e}")
            self.rule_based_tiger = None
            self.rule_based_goat = None

    def get_ai_move(self, player_type: Player, env, state: Dict) -> Optional[Tuple]:
        """Get an AI move for the specified player, prioritizing Q-learning agents."""
        
        # Try Q-learning agents first
        if player_type == Player.TIGER and self.q_learning_tiger:
            try:
                print(f"🧠 Using Q-learning Tiger AI")
                return self._get_q_learning_move(self.q_learning_tiger, env, state)
            except Exception as e:
                print(f"❌ Q-learning Tiger failed: {e}, falling back to rule-based")
        
        elif player_type == Player.GOAT and self.q_learning_goat:
            try:
                print(f"🧠 Using Q-learning Goat AI")
                return self._get_q_learning_move(self.q_learning_goat, env, state)
            except Exception as e:
                print(f"❌ Q-learning Goat failed: {e}, falling back to rule-based")
        
        # Fallback to rule-based agents
        agent = self.rule_based_tiger if player_type == Player.TIGER else self.rule_based_goat
        
        if not agent:
            print(f"❌ No AI agent available for {player_type.name}. Using random move.")
            return self._get_random_move(env, player_type)
        
        try:
            print(f"🎯 Using rule-based {player_type.name} AI")
            return self._get_rule_based_move(agent, env, state)
        except Exception as e:
            print(f"❌ Rule-based {player_type.name} failed: {e}, using random move")
            return self._get_random_move(env, player_type)
    
    def _get_q_learning_move(self, agent, env, state: Dict) -> Optional[Tuple]:
        """Get move from Q-learning agent."""
        # Ensure board is a numpy array
        current_state = copy.deepcopy(state)
        if 'board' in current_state and not isinstance(current_state['board'], np.ndarray):
            current_state['board'] = np.array(current_state['board'])
        
        print(f"🔍 Q-learning agent evaluating move...")
        action = agent.select_action(env, current_state)
        
        if action is None:
            print(f"❌ Q-learning agent returned None")
            return None
        
        # Get Q-value for logging
        q_value = agent.get_q_value(current_state, action)
        print(f"✅ Q-learning selected move: {action} (Q-value: {q_value:.3f})")
        
        return action
    
    def _get_rule_based_move(self, agent, env, state: Dict) -> Optional[Tuple]:
        """Get move from rule-based agent."""
        # Ensure board is a numpy array
        current_state = copy.deepcopy(state)
        if 'board' in current_state and not isinstance(current_state['board'], np.ndarray):
            current_state['board'] = np.array(current_state['board'])
        
        print(f"🔍 Rule-based agent evaluating move...")
        action = agent.select_action(env, current_state)
        
        if action is None:
            print(f"❌ Rule-based agent returned None")
            return None
        
        print(f"✅ Rule-based selected move: {action}")
        return action
    
    def _get_random_move(self, env, player_type: Player) -> Optional[Tuple]:
        """Get random move as last resort."""
        valid_actions = env.get_valid_actions(player_type)
        if valid_actions:
            action = random.choice(valid_actions)
            print(f"🎲 Random move selected for {player_type.name}: {action}")
            return action
        else:
            print(f"❌ No valid actions available for {player_type.name}")
            return None
    
    def get_ai_status(self) -> Dict:
        """Get status of available AI agents."""
        return {
            'q_learning_available': {
                'tiger': self.q_learning_tiger is not None,
                'goat': self.q_learning_goat is not None
            },
            'rule_based_available': {
                'tiger': self.rule_based_tiger is not None,
                'goat': self.rule_based_goat is not None
            },
            'q_learning_stats': {
                'tiger': self.q_learning_tiger.get_training_stats() if self.q_learning_tiger else None,
                'goat': self.q_learning_goat.get_training_stats() if self.q_learning_goat else None
            }
        }
    
    def reload_q_learning_models(self):
        """Reload Q-learning models (useful after training)."""
        print("🔄 Reloading Q-learning models...")
        self._load_q_learning_agents()
    
    def get_move_confidence(self, player_type: Player, env, state: Dict, action: Tuple) -> float:
        """Get confidence score for a move (only available for Q-learning agents)."""
        agent = self.q_learning_tiger if player_type == Player.TIGER else self.q_learning_goat
        
        if not agent:
            return 0.5  # Neutral confidence for rule-based agents
        
        try:
            # Ensure board is numpy array
            current_state = copy.deepcopy(state)
            if 'board' in current_state and not isinstance(current_state['board'], np.ndarray):
                current_state['board'] = np.array(current_state['board'])
            
            # Get Q-value for the action
            q_value = agent.get_q_value(current_state, action)
            
            # Get Q-values for all valid actions
            valid_actions = env.get_valid_actions(player_type)
            if not valid_actions:
                return 0.5
            
            q_values = [agent.get_q_value(current_state, a) for a in valid_actions]
            
            if not q_values:
                return 0.5
            
            max_q = max(q_values)
            min_q = min(q_values)
            
            # Normalize confidence based on Q-value relative to other actions
            if max_q == min_q:
                return 0.5  # All actions equally valued
            
            # Confidence is how close this action's Q-value is to the maximum
            confidence = (q_value - min_q) / (max_q - min_q)
            return max(0.0, min(1.0, confidence))
            
        except Exception as e:
            print(f"❌ Error calculating move confidence: {e}")
            return 0.5

# Global AI instance
ai_manager = AIManager()

def get_enhanced_ai_move(player_type: Player, env, state: Dict) -> Optional[Tuple]:
    """Global function to get an AI move from the enhanced AI manager."""
    return ai_manager.get_ai_move(player_type, env, state)

def get_ai_status() -> Dict:
    """Get status of available AI systems."""
    return ai_manager.get_ai_status()

def reload_models():
    """Reload Q-learning models."""
    ai_manager.reload_q_learning_models()

def get_move_confidence(player_type: Player, env, state: Dict, action: Tuple) -> float:
    """Get confidence score for a move."""
    return ai_manager.get_move_confidence(player_type, env, state, action) 