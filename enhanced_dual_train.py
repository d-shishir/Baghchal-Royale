"""
Enhanced Dual Training System for Baghchal AI
Trains both Tiger and Goat agents simultaneously using self-play and mutual learning.
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import pickle
import json
import time
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import random

# Import game environment and base agent
try:
    from app.core.baghchal_env import BaghchalEnv, Player, GamePhase
except ImportError:
    try:
        from backend.app.core.baghchal_env import BaghchalEnv, Player, GamePhase
    except ImportError:
        from baghchal_env import BaghchalEnv, Player, GamePhase

from enhanced_q_agent import EnhancedTigerQLearningAgent

class EnhancedGoatQLearningAgent:
    """Enhanced Q-Learning agent for Goat player with strategic features."""
    
    def __init__(self, alpha=0.1, gamma=0.95, epsilon=0.3, epsilon_decay=0.9995, 
                 epsilon_min=0.01, use_double_q=True, feature_engineering=True):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.use_double_q = use_double_q
        self.feature_engineering = feature_engineering
        
        # Q-tables for Double Q-Learning
        self.q_table_a = {}
        self.q_table_b = {} if use_double_q else None
        
        # Statistics
        self.episode_count = 0
        self.total_rewards = []
        self.survival_times = []
        self.blocks_per_episode = []
        self.state_visit_counts = defaultdict(int)
        self.action_visit_counts = defaultdict(int)
        
        print(f"Enhanced Goat Q-Learning Agent initialized with Double Q-Learning: {use_double_q}")
    
    def _extract_goat_features(self, state):
        """Extract goat-specific strategic features."""
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
        
        # Survival and tactical features
        features.extend([
            len(goat_positions) / 20.0,  # Survival rate
            len(tiger_positions) / 4.0,   # Tiger count (should be 1.0)
        ])
        
        # Strategic positioning
        center_control = 1 if (2, 2) in goat_positions else 0
        blocking_potential = self._calculate_blocking_potential(goat_positions, tiger_positions, board)
        formation_strength = self._calculate_formation_strength(goat_positions)
        
        features.extend([
            center_control,
            blocking_potential,
            formation_strength
        ])
        
        return np.array(features, dtype=np.float32)
    
    def _calculate_blocking_potential(self, goat_positions, tiger_positions, board):
        """Calculate how well goats can block tigers."""
        if not goat_positions or not tiger_positions:
            return 0.0
        
        blocking_score = 0
        for goat_pos in goat_positions:
            for tiger_pos in tiger_positions:
                # Check if goat is adjacent to tiger
                if abs(goat_pos[0] - tiger_pos[0]) + abs(goat_pos[1] - tiger_pos[1]) == 1:
                    blocking_score += 1
        
        return min(blocking_score / (len(goat_positions) + len(tiger_positions)), 1.0)
    
    def _calculate_formation_strength(self, goat_positions):
        """Calculate strength of goat formation."""
        if len(goat_positions) < 2:
            return 0.0
        
        # Count connected pairs
        pairs = 0
        for i, pos1 in enumerate(goat_positions):
            for pos2 in goat_positions[i+1:]:
                if abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1]) == 1:
                    pairs += 1
        
        return min(pairs / len(goat_positions), 1.0)
    
    def _state_to_hash(self, state):
        """Convert state to hash for Q-table lookup."""
        if self.feature_engineering:
            features = self._extract_goat_features(state)
            discretized = [round(f, 2) for f in features]
            return str(tuple(discretized))
        else:
            board_str = ''.join(str(int(x)) for row in state['board'] for x in row)
            return f"{board_str}_{state['phase'].value}_{state['goats_captured']}_{state['goats_placed']}"
    
    def get_q_value(self, state_hash, action, table='a'):
        """Get Q-value for state-action pair."""
        key = (state_hash, action)
        if table == 'a':
            return self.q_table_a.get(key, 0.0)
        else:
            return self.q_table_b.get(key, 0.0) if self.q_table_b else 0.0
    
    def set_q_value(self, state_hash, action, value, table='a'):
        """Set Q-value for state-action pair."""
        key = (state_hash, action)
        if table == 'a':
            self.q_table_a[key] = value
        elif self.q_table_b:
            self.q_table_b[key] = value
    
    def select_action(self, env, state):
        """Select action using epsilon-greedy with Double Q-Learning."""
        valid_actions = env.get_valid_actions(Player.GOAT)
        if not valid_actions:
            return None
        
        state_hash = self._state_to_hash(state)
        self.state_visit_counts[state_hash] += 1
        
        # Epsilon-greedy exploration
        if np.random.random() < self.epsilon:
            action = random.choice(valid_actions)
        else:
            # Choose action with highest average Q-value
            best_action = None
            best_value = float('-inf')
            
            for action in valid_actions:
                q_a = self.get_q_value(state_hash, action, 'a')
                q_b = self.get_q_value(state_hash, action, 'b') if self.use_double_q else 0
                avg_q = (q_a + q_b) / (2 if self.use_double_q else 1)
                
                if avg_q > best_value:
                    best_value = avg_q
                    best_action = action
            
            action = best_action if best_action else random.choice(valid_actions)
        
        self.action_visit_counts[action] += 1
        return action
    
    def update_q_value(self, state, action, reward, next_state, done, env=None):
        """Update Q-values using Double Q-Learning."""
        state_hash = self._state_to_hash(state)
        next_state_hash = self._state_to_hash(next_state)
        
        # Choose which table to update randomly
        update_table = 'a' if np.random.random() < 0.5 else 'b'
        eval_table = 'b' if update_table == 'a' else 'a'
        
        # Get current Q-value
        current_q = self.get_q_value(state_hash, action, update_table)
        
        # Calculate target value
        if done:
            target_q = reward
        else:
            # Find best action using update table
            if env:
                valid_next_actions = env.get_valid_actions(Player.GOAT)
                if valid_next_actions:
                    best_action = max(valid_next_actions, 
                                    key=lambda a: self.get_q_value(next_state_hash, a, update_table))
                    next_q = self.get_q_value(next_state_hash, best_action, eval_table)
                else:
                    next_q = 0.0
            else:
                next_q = 0.0
            
            target_q = reward + self.gamma * next_q
        
        # Update Q-value
        new_q = current_q + self.alpha * (target_q - current_q)
        self.set_q_value(state_hash, action, new_q, update_table)
    
    def decay_epsilon(self):
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
    
    def start_episode(self):
        """Start new episode."""
        self.episode_count += 1
    
    def end_episode(self, total_reward, survival_time, blocks_made):
        """End episode and update statistics."""
        self.total_rewards.append(total_reward)
        self.survival_times.append(survival_time)
        self.blocks_per_episode.append(blocks_made)
    
    def get_stats(self):
        """Get training statistics."""
        if not self.total_rewards:
            return {
                'episodes': 0,
                'avg_reward': 0,
                'avg_survival': 0,
                'avg_blocks': 0,
                'q_table_a_size': len(self.q_table_a),
                'current_epsilon': self.epsilon
            }
        
        recent_rewards = self.total_rewards[-100:] if len(self.total_rewards) >= 100 else self.total_rewards
        
        return {
            'episodes': self.episode_count,
            'q_table_a_size': len(self.q_table_a),
            'q_table_b_size': len(self.q_table_b) if self.q_table_b else 0,
            'current_epsilon': self.epsilon,
            'avg_reward': np.mean(self.total_rewards),
            'recent_avg_reward': np.mean(recent_rewards),
            'avg_survival': np.mean(self.survival_times),
            'avg_blocks': np.mean(self.blocks_per_episode),
            'max_reward': max(self.total_rewards),
            'unique_states_visited': len(self.state_visit_counts)
        }
    
    def save_q_table(self, filename):
        """Save Q-table and training data."""
        save_data = {
            'q_table_a': self.q_table_a,
            'q_table_b': self.q_table_b,
            'alpha': self.alpha,
            'gamma': self.gamma,
            'epsilon': self.epsilon,
            'episode_count': self.episode_count,
            'total_rewards': self.total_rewards,
            'survival_times': self.survival_times,
            'blocks_per_episode': self.blocks_per_episode,
            'state_visit_counts': dict(self.state_visit_counts),
            'action_visit_counts': dict(self.action_visit_counts),
            'use_double_q': self.use_double_q,
            'feature_engineering': self.feature_engineering
        }
        
        with open(filename, 'wb') as f:
            pickle.dump(save_data, f)
        
        print(f"Goat Q-table saved to {filename}")
        print(f"  - Table A size: {len(self.q_table_a)}")
        if self.q_table_b:
            print(f"  - Table B size: {len(self.q_table_b)}")
        print(f"  - Episodes trained: {self.episode_count}")


class DualAgentTrainer:
    """Trainer for both Tiger and Goat agents using self-play."""
    
    def __init__(self, tiger_agent, goat_agent, max_steps_per_episode=200):
        self.tiger_agent = tiger_agent
        self.goat_agent = goat_agent
        self.max_steps_per_episode = max_steps_per_episode
        
        # Training statistics
        self.episode_rewards_tiger = []
        self.episode_rewards_goat = []
        self.episode_lengths = []
        self.episode_winners = []
        self.tiger_captures = []
        
        print("Dual Agent Trainer initialized for simultaneous Tiger-Goat training")
    
    def train(self, num_episodes=10000, save_interval=1000, log_interval=100,
              tiger_filename="enhanced_tiger_dual.pkl", goat_filename="enhanced_goat_dual.pkl"):
        """Train both agents simultaneously."""
        
        print(f"Starting dual training for {num_episodes} episodes...")
        start_time = time.time()
        
        for episode in range(num_episodes):
            # Run episode
            tiger_reward, goat_reward, winner, captures, steps = self._run_dual_episode()
            
            # Update statistics
            self.episode_rewards_tiger.append(tiger_reward)
            self.episode_rewards_goat.append(goat_reward)
            self.episode_lengths.append(steps)
            self.episode_winners.append(winner)
            self.tiger_captures.append(captures)
            
            # Decay exploration
            self.tiger_agent.decay_epsilon()
            self.goat_agent.decay_epsilon()
            
            # Logging
            if (episode + 1) % log_interval == 0:
                self._print_dual_progress(episode + 1, start_time)
            
            # Save checkpoints
            if (episode + 1) % save_interval == 0:
                self.tiger_agent.save_q_table(f"checkpoint_{episode+1}_{tiger_filename}")
                self.goat_agent.save_q_table(f"checkpoint_{episode+1}_{goat_filename}")
        
        # Final save
        self.tiger_agent.save_q_table(tiger_filename)
        self.goat_agent.save_q_table(goat_filename)
        
        self._print_final_dual_stats(num_episodes, start_time)
        
        return {
            'tiger_rewards': self.episode_rewards_tiger,
            'goat_rewards': self.episode_rewards_goat,
            'winners': self.episode_winners,
            'lengths': self.episode_lengths
        }
    
    def _run_dual_episode(self):
        """Run single episode with both agents learning."""
        env = BaghchalEnv()
        
        self.tiger_agent.start_episode()
        self.goat_agent.start_episode()
        
        tiger_reward = 0
        goat_reward = 0
        steps = 0
        captures = 0
        
        while not env.is_game_over() and steps < self.max_steps_per_episode:
            old_state = env.get_state()
            
            if env.current_player == Player.TIGER:
                # Tiger's turn
                action = self.tiger_agent.select_action(env, old_state)
                if action:
                    new_state, step_reward, done, info = env.step(action)
                    
                    # Calculate tiger reward
                    reward = self._calculate_tiger_reward(old_state, action, new_state)
                    tiger_reward += reward
                    
                    # Update tiger Q-values
                    self.tiger_agent.update_q_value(old_state, action, reward, new_state, env.is_game_over())
                    
                    # Track captures
                    if new_state['goats_captured'] > old_state['goats_captured']:
                        captures += 1
                else:
                    break
                    
            else:  # Player.GOAT
                # Goat's turn
                action = self.goat_agent.select_action(env, old_state)
                if action:
                    new_state, step_reward, done, info = env.step(action)
                    
                    # Calculate goat reward
                    reward = self._calculate_goat_reward(old_state, action, new_state)
                    goat_reward += reward
                    
                    # Update goat Q-values
                    self.goat_agent.update_q_value(old_state, action, reward, new_state, env.is_game_over(), env)
                else:
                    break
            
            steps += 1
        
        # Determine winner
        final_state = env.get_state()
        if final_state['goats_captured'] >= 5:
            winner = "TIGER"
        else:
            winner = "GOAT"  # Simplified for now
        
        # End episodes
        self.tiger_agent.end_episode(tiger_reward, captures)
        self.goat_agent.end_episode(goat_reward, steps, 0)
        
        return tiger_reward, goat_reward, winner, captures, steps
    
    def _calculate_tiger_reward(self, old_state, action, new_state):
        """Calculate reward for tiger action."""
        reward = 0
        
        # Major reward for captures
        if new_state['goats_captured'] > old_state['goats_captured']:
            reward += 100
        
        # Position rewards
        if len(action) >= 3:  # Movement action
            to_row, to_col = action[1], action[2]
            if (to_row, to_col) == (2, 2):  # Center
                reward += 5
            elif to_row in [0, 4] and to_col in [0, 4]:  # Corners
                reward += 3
        
        # Win condition
        if new_state['goats_captured'] >= 5:
            reward += 500
        
        # Small time penalty
        reward -= 0.1
        
        return reward
    
    def _calculate_goat_reward(self, old_state, action, new_state):
        """Calculate reward for goat action."""
        reward = 0
        
        # Survival is key
        if new_state['goats_captured'] == old_state['goats_captured']:
            reward += 1  # Base survival reward
        else:
            reward -= 50  # Penalty for capture
        
        # Position rewards
        if len(action) >= 3:  # Placement or movement
            to_row, to_col = action[1], action[2]
            if (to_row, to_col) == (2, 2):  # Center control
                reward += 8
            elif to_row in [1, 3] and to_col in [1, 3]:  # Strategic positions
                reward += 3
        
        # Encourage quick decisions
        reward += 0.05
        
        return reward
    
    def _print_dual_progress(self, episode, start_time):
        """Print training progress for both agents."""
        elapsed = time.time() - start_time
        
        # Recent performance
        recent_tiger_rewards = self.episode_rewards_tiger[-100:] if len(self.episode_rewards_tiger) >= 100 else self.episode_rewards_tiger
        recent_goat_rewards = self.episode_rewards_goat[-100:] if len(self.episode_rewards_goat) >= 100 else self.episode_rewards_goat
        
        tiger_win_rate = sum(1 for w in self.episode_winners[-100:] if w == "TIGER") / min(len(self.episode_winners), 100)
        goat_win_rate = sum(1 for w in self.episode_winners[-100:] if w == "GOAT") / min(len(self.episode_winners), 100)
        
        tiger_stats = self.tiger_agent.get_stats()
        goat_stats = self.goat_agent.get_stats()
        
        print(f"\n=== Episode {episode} | Time: {elapsed:.1f}s ===")
        print(f"TIGER - Reward: {np.mean(recent_tiger_rewards):.2f} | Win Rate: {tiger_win_rate:.2%} | ε: {tiger_stats['current_epsilon']:.3f} | Q-Size: {tiger_stats['q_table_a_size']}")
        print(f"GOAT  - Reward: {np.mean(recent_goat_rewards):.2f} | Win Rate: {goat_win_rate:.2%} | ε: {goat_stats['current_epsilon']:.3f} | Q-Size: {goat_stats['q_table_a_size']}")
    
    def _print_final_dual_stats(self, num_episodes, start_time):
        """Print final training statistics."""
        elapsed = time.time() - start_time
        
        tiger_wins = sum(1 for w in self.episode_winners if w == "TIGER")
        goat_wins = sum(1 for w in self.episode_winners if w == "GOAT")
        
        tiger_stats = self.tiger_agent.get_stats()
        goat_stats = self.goat_agent.get_stats()
        
        print(f"\n{'='*60}")
        print(f"DUAL TRAINING COMPLETED - {num_episodes} episodes in {elapsed:.1f}s")
        print(f"{'='*60}")
        print(f"TIGER AGENT:")
        print(f"  - Win Rate: {tiger_wins/num_episodes:.2%} ({tiger_wins} wins)")
        print(f"  - Avg Reward: {tiger_stats['avg_reward']:.2f}")
        print(f"  - Q-Table Size: {tiger_stats['q_table_a_size']}")
        print(f"  - Avg Captures: {np.mean(self.tiger_captures):.2f}")
        
        print(f"\nGOAT AGENT:")
        print(f"  - Win Rate: {goat_wins/num_episodes:.2%} ({goat_wins} wins)")
        print(f"  - Avg Reward: {goat_stats['avg_reward']:.2f}")
        print(f"  - Q-Table Size: {goat_stats['q_table_a_size']}")


def main():
    """Main dual training function."""
    print("=== Enhanced Dual Baghchal AI Training ===")
    print("Training both Tiger and Goat agents simultaneously using self-play")
    
    # Create enhanced agents
    print("\nInitializing Tiger Agent...")
    tiger_agent = EnhancedTigerQLearningAgent(
        alpha=0.1,
        gamma=0.95,
        epsilon=0.3,
        epsilon_decay=0.9995,
        epsilon_min=0.01,
        use_double_q=True,
        use_replay=False,
        feature_engineering=True
    )
    
    print("\nInitializing Goat Agent...")
    goat_agent = EnhancedGoatQLearningAgent(
        alpha=0.1,
        gamma=0.95,
        epsilon=0.3,
        epsilon_decay=0.9995,
        epsilon_min=0.01,
        use_double_q=True,
        feature_engineering=True
    )
    
    # Create dual trainer
    trainer = DualAgentTrainer(
        tiger_agent=tiger_agent,
        goat_agent=goat_agent,
        max_steps_per_episode=200
    )
    
    # Training parameters
    num_episodes = 10000
    save_interval = 1000
    log_interval = 100
    
    print(f"\nStarting dual training with {num_episodes} episodes...")
    print(f"Checkpoints every {save_interval} episodes")
    print(f"Progress logs every {log_interval} episodes")
    
    # Run training
    training_history = trainer.train(
        num_episodes=num_episodes,
        save_interval=save_interval,
        log_interval=log_interval,
        tiger_filename="enhanced_tiger_dual.pkl",
        goat_filename="enhanced_goat_dual.pkl"
    )
    
    print("\n=== Dual Training Completed Successfully! ===")
    print("✅ Both Tiger and Goat agents trained with enhanced Q-Learning")
    print("✅ Models saved as 'enhanced_tiger_dual.pkl' and 'enhanced_goat_dual.pkl'")
    print("✅ Self-play training ensures balanced competitive learning")
    
    return training_history


if __name__ == "__main__":
    main() 