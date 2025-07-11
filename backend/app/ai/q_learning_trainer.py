"""
Double Q-Learning Training System for Baghchal AI
Self-play training with experience collection and progress monitoring
"""

import numpy as np
import random
import time
import json
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple, Optional
from pathlib import Path
from dataclasses import dataclass
import pandas as pd
from collections import deque, defaultdict

from .double_q_learning import QLearningConfig
from .q_learning_agents import DoubleQLearningTigerAI, DoubleQLearningGoatAI

try:
    from ..core.baghchal_env import BaghchalEnv, Player, GamePhase
except ImportError:
    print("Warning: Could not import BaghchalEnv - using mock implementation")
    from enum import Enum
    class Player(Enum):
        TIGER = 1
        GOAT = 2
    class GamePhase(Enum):
        PLACEMENT = 1
        MOVEMENT = 2

@dataclass
class TrainingConfig:
    """Configuration for training parameters."""
    episodes: int = 5000
    save_interval: int = 500
    eval_interval: int = 100
    eval_games: int = 50
    max_moves_per_game: int = 200
    learning_rate_decay: float = 0.9999
    epsilon_decay_interval: int = 1000
    
    # Training phases
    exploration_episodes: int = 1000  # High epsilon phase
    intermediate_episodes: int = 2000  # Medium epsilon phase
    exploitation_episodes: int = 2000  # Low epsilon phase

class QLearningTrainer:
    """Manages training of double Q-learning agents through self-play."""
    
    def __init__(self, config: TrainingConfig = None):
        self.config = config or TrainingConfig()
        self.env = BaghchalEnv()
        
        # Initialize agents with different learning configurations for training phases
        self.tiger_agent = None
        self.goat_agent = None
        
        # Training statistics
        self.training_stats = {
            'episode': 0,
            'tiger_wins': 0,
            'goat_wins': 0,
            'draws': 0,
            'average_game_length': 0,
            'total_rewards': {'tiger': [], 'goat': []},
            'win_rates': {'tiger': [], 'goat': []},
            'learning_progress': [],
            'epsilon_history': {'tiger': [], 'goat': []},
            'q_value_stats': {'tiger': [], 'goat': []}
        }
        
        # Game history for analysis
        self.game_history = deque(maxlen=1000)
        
        print("🎯 Double Q-Learning Training System initialized")
    
    def train(self, save_dir: str = "models/q_learning"):
        """Main training loop with adaptive learning phases."""
        print(f"🚀 Starting Double Q-Learning training for {self.config.episodes} episodes")
        
        # Create save directory
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize agents for training
        self._initialize_training_agents()
        
        start_time = time.time()
        episode_rewards = {'tiger': 0, 'goat': 0}
        
        for episode in range(1, self.config.episodes + 1):
            self.training_stats['episode'] = episode
            
            # Adjust learning parameters based on training phase
            self._adjust_learning_parameters(episode)
            
            # Play one training game
            game_result = self._play_training_game(episode)
            
            # Update statistics
            self._update_training_stats(game_result, episode)
            
            # Periodic evaluation and saving
            if episode % self.config.eval_interval == 0:
                self._evaluate_agents(episode)
            
            if episode % self.config.save_interval == 0:
                self._save_progress(save_path, episode)
            
            # Progress reporting
            if episode % 100 == 0:
                elapsed_time = time.time() - start_time
                self._print_progress(episode, elapsed_time)
        
        # Final save and evaluation
        self._save_final_models(save_path)
        self._generate_training_report(save_path)
        
        print(f"🏁 Training completed! Models saved to {save_path}")
    
    def _initialize_training_agents(self):
        """Initialize agents with training-optimized configurations."""
        # Higher exploration initially
        tiger_config = QLearningConfig(
            alpha=0.15,
            gamma=0.95,
            epsilon=0.8,  # High initial exploration
            epsilon_decay=0.9995,
            epsilon_min=0.05
        )
        
        goat_config = QLearningConfig(
            alpha=0.15,
            gamma=0.95,
            epsilon=0.8,  # High initial exploration
            epsilon_decay=0.9995,
            epsilon_min=0.05
        )
        
        self.tiger_agent = DoubleQLearningTigerAI(tiger_config)
        self.goat_agent = DoubleQLearningGoatAI(goat_config)
        
        print("🤖 Training agents initialized with high exploration rates")
    
    def _adjust_learning_parameters(self, episode: int):
        """Adjust learning parameters based on training phase."""
        if episode == self.config.exploration_episodes:
            # Transition to intermediate phase
            self.tiger_agent.config.epsilon = 0.4
            self.goat_agent.config.epsilon = 0.4
            print(f"📈 Episode {episode}: Transitioning to intermediate exploration phase")
        
        elif episode == self.config.exploration_episodes + self.config.intermediate_episodes:
            # Transition to exploitation phase
            self.tiger_agent.config.epsilon = 0.1
            self.goat_agent.config.epsilon = 0.1
            print(f"📈 Episode {episode}: Transitioning to exploitation phase")
        
        # Decay learning rate gradually
        if episode % 1000 == 0:
            self.tiger_agent.config.alpha *= self.config.learning_rate_decay
            self.goat_agent.config.alpha *= self.config.learning_rate_decay
    
    def _play_training_game(self, episode: int) -> Dict:
        """Play a single training game between the agents."""
        state = self.env.reset()
        moves_played = 0
        game_log = []
        
        # Store initial state for both agents
        tiger_episode_reward = 0
        goat_episode_reward = 0
        
        # Experience tracking
        tiger_experience = []
        goat_experience = []
        
        while not state['game_over'] and moves_played < self.config.max_moves_per_game:
            current_player = state['current_player']
            
            # Select agent and get action
            if current_player == Player.TIGER:
                agent = self.tiger_agent
                action = agent.select_action(self.env, state)
            else:
                agent = self.goat_agent
                action = agent.select_action(self.env, state)
            
            if action is None:
                print(f"⚠️ No valid action for {current_player} at move {moves_played}")
                break
            
            # Store current state for learning
            old_state = state.copy()
            
            # Execute action
            new_state, step_reward, done, info = self.env.step(action)
            
            # Calculate agent-specific rewards
            if current_player == Player.TIGER:
                reward = self.tiger_agent.calculate_reward(old_state, new_state, action)
                tiger_episode_reward += reward
                tiger_experience.append((old_state, action, reward, new_state, done))
            else:
                reward = self.goat_agent.calculate_reward(old_state, new_state, action)
                goat_episode_reward += reward
                goat_experience.append((old_state, action, reward, new_state, done))
            
            # Log move
            game_log.append({
                'move': moves_played,
                'player': current_player.name,
                'action': action,
                'reward': reward,
                'state_hash': agent.state_encoder.encode_state(old_state, current_player)
            })
            
            state = new_state
            moves_played += 1
        
        # Update Q-values for both agents using their experiences
        self._update_agents_from_experience(tiger_experience, goat_experience)
        
        # Determine winner
        winner = state.get('winner', 'DRAW')
        
        return {
            'episode': episode,
            'winner': winner,
            'moves': moves_played,
            'tiger_reward': tiger_episode_reward,
            'goat_reward': goat_episode_reward,
            'game_log': game_log,
            'final_state': state
        }
    
    def _update_agents_from_experience(self, tiger_experience: List, goat_experience: List):
        """Update Q-values for both agents from their collected experience."""
        # Update tiger agent
        for old_state, action, reward, new_state, done in tiger_experience:
            self.tiger_agent.update_q_values(old_state, action, reward, new_state, done)
        
        # Update goat agent
        for old_state, action, reward, new_state, done in goat_experience:
            self.goat_agent.update_q_values(old_state, action, reward, new_state, done)
    
    def _update_training_stats(self, game_result: Dict, episode: int):
        """Update training statistics with game result."""
        winner = game_result['winner']
        
        # Update win counts
        if winner == 'TIGER':
            self.training_stats['tiger_wins'] += 1
        elif winner == 'GOAT':
            self.training_stats['goat_wins'] += 1
        else:
            self.training_stats['draws'] += 1
        
        # Update average game length
        total_games = episode
        current_avg = self.training_stats['average_game_length']
        new_avg = (current_avg * (total_games - 1) + game_result['moves']) / total_games
        self.training_stats['average_game_length'] = new_avg
        
        # Store rewards
        self.training_stats['total_rewards']['tiger'].append(game_result['tiger_reward'])
        self.training_stats['total_rewards']['goat'].append(game_result['goat_reward'])
        
        # Store epsilon values
        self.training_stats['epsilon_history']['tiger'].append(self.tiger_agent.config.epsilon)
        self.training_stats['epsilon_history']['goat'].append(self.goat_agent.config.epsilon)
        
        # Store game in history
        self.game_history.append(game_result)
    
    def _evaluate_agents(self, episode: int):
        """Evaluate current agent performance."""
        print(f"📊 Evaluating agents at episode {episode}...")
        
        # Calculate recent win rates (last 100 games)
        recent_games = list(self.game_history)[-100:]
        if len(recent_games) >= 10:
            tiger_wins = sum(1 for game in recent_games if game['winner'] == 'TIGER')
            goat_wins = sum(1 for game in recent_games if game['winner'] == 'GOAT')
            total_recent = len(recent_games)
            
            tiger_win_rate = tiger_wins / total_recent
            goat_win_rate = goat_wins / total_recent
            
            self.training_stats['win_rates']['tiger'].append(tiger_win_rate)
            self.training_stats['win_rates']['goat'].append(goat_win_rate)
            
            print(f"📈 Recent win rates - Tiger: {tiger_win_rate:.2%}, Goat: {goat_win_rate:.2%}")
        
        # Sample Q-value statistics
        self._sample_q_value_stats()
    
    def _sample_q_value_stats(self):
        """Sample and store Q-value statistics for analysis."""
        # Sample some states and calculate average Q-values
        sample_states = []
        for _ in range(10):
            # Generate a random game state for sampling
            temp_env = BaghchalEnv()
            temp_state = temp_env.reset()
            
            # Play a few random moves to get diverse states
            for _ in range(random.randint(5, 15)):
                if temp_state['game_over']:
                    break
                valid_actions = temp_env.get_valid_actions(temp_state['current_player'])
                if valid_actions:
                    action = random.choice(valid_actions)
                    temp_state, _, _, _ = temp_env.step(action)
            
            if not temp_state['game_over']:
                sample_states.append(temp_state)
        
        # Calculate average Q-values for sample states
        tiger_q_values = []
        goat_q_values = []
        
        for state in sample_states:
            # Tiger Q-values
            tiger_actions = self.env.get_valid_actions(Player.TIGER)
            if tiger_actions:
                for action in tiger_actions[:3]:  # Sample first 3 actions
                    q_val = self.tiger_agent.get_q_value(state, action)
                    tiger_q_values.append(q_val)
            
            # Goat Q-values
            goat_actions = self.env.get_valid_actions(Player.GOAT)
            if goat_actions:
                for action in goat_actions[:3]:  # Sample first 3 actions
                    q_val = self.goat_agent.get_q_value(state, action)
                    goat_q_values.append(q_val)
        
        # Store statistics
        if tiger_q_values:
            self.training_stats['q_value_stats']['tiger'].append({
                'mean': np.mean(tiger_q_values),
                'std': np.std(tiger_q_values),
                'max': np.max(tiger_q_values),
                'min': np.min(tiger_q_values)
            })
        
        if goat_q_values:
            self.training_stats['q_value_stats']['goat'].append({
                'mean': np.mean(goat_q_values),
                'std': np.std(goat_q_values),
                'max': np.max(goat_q_values),
                'min': np.min(goat_q_values)
            })
    
    def _save_progress(self, save_path: Path, episode: int):
        """Save training progress and intermediate models."""
        # Save agent models
        tiger_path = save_path / f"tiger_episode_{episode}.pkl"
        goat_path = save_path / f"goat_episode_{episode}.pkl"
        
        self.tiger_agent.save_model(str(tiger_path))
        self.goat_agent.save_model(str(goat_path))
        
        # Save training statistics
        stats_path = save_path / f"training_stats_{episode}.json"
        with open(stats_path, 'w') as f:
            # Convert numpy arrays to lists for JSON serialization
            stats_copy = self._serialize_stats_for_json(self.training_stats)
            json.dump(stats_copy, f, indent=2)
        
        print(f"💾 Progress saved at episode {episode}")
    
    def _serialize_stats_for_json(self, stats: Dict) -> Dict:
        """Convert numpy arrays and complex objects to JSON-serializable format."""
        serialized = {}
        for key, value in stats.items():
            if isinstance(value, (list, tuple)):
                serialized[key] = [float(x) if isinstance(x, (np.integer, np.floating)) else x for x in value]
            elif isinstance(value, dict):
                serialized[key] = self._serialize_stats_for_json(value)
            elif isinstance(value, (np.integer, np.floating)):
                serialized[key] = float(value)
            else:
                serialized[key] = value
        return serialized
    
    def _save_final_models(self, save_path: Path):
        """Save final trained models."""
        # Save final models with standard names
        tiger_final_path = save_path / "enhanced_tiger_dual.pkl"
        goat_final_path = save_path / "enhanced_goat_dual.pkl"
        
        self.tiger_agent.save_model(str(tiger_final_path))
        self.goat_agent.save_model(str(goat_final_path))
        
        # Save final training statistics
        final_stats_path = save_path / "final_training_stats.json"
        with open(final_stats_path, 'w') as f:
            stats_copy = self._serialize_stats_for_json(self.training_stats)
            json.dump(stats_copy, f, indent=2)
        
        print(f"🏆 Final models saved: {tiger_final_path}, {goat_final_path}")
    
    def _print_progress(self, episode: int, elapsed_time: float):
        """Print training progress."""
        tiger_wins = self.training_stats['tiger_wins']
        goat_wins = self.training_stats['goat_wins']
        draws = self.training_stats['draws']
        avg_length = self.training_stats['average_game_length']
        
        tiger_win_rate = tiger_wins / episode
        goat_win_rate = goat_wins / episode
        
        print(f"📊 Episode {episode}/{self.config.episodes}")
        print(f"   ⏱️  Time: {elapsed_time:.1f}s")
        print(f"   🐅 Tiger wins: {tiger_wins} ({tiger_win_rate:.2%})")
        print(f"   🐐 Goat wins: {goat_wins} ({goat_win_rate:.2%})")
        print(f"   🤝 Draws: {draws}")
        print(f"   📏 Avg game length: {avg_length:.1f} moves")
        print(f"   🎲 Tiger ε: {self.tiger_agent.config.epsilon:.3f}")
        print(f"   🎲 Goat ε: {self.goat_agent.config.epsilon:.3f}")
        print()
    
    def _generate_training_report(self, save_path: Path):
        """Generate comprehensive training report with visualizations."""
        print("📈 Generating training report...")
        
        # Create plots
        self._plot_training_progress(save_path)
        self._plot_win_rates(save_path)
        self._plot_q_value_evolution(save_path)
        self._plot_epsilon_decay(save_path)
        
        # Generate text report
        report_path = save_path / "training_report.txt"
        with open(report_path, 'w') as f:
            f.write("=== DOUBLE Q-LEARNING TRAINING REPORT ===\n\n")
            f.write(f"Total Episodes: {self.config.episodes}\n")
            f.write(f"Tiger Wins: {self.training_stats['tiger_wins']}\n")
            f.write(f"Goat Wins: {self.training_stats['goat_wins']}\n")
            f.write(f"Draws: {self.training_stats['draws']}\n")
            f.write(f"Average Game Length: {self.training_stats['average_game_length']:.2f} moves\n")
            f.write(f"Final Tiger Win Rate: {self.training_stats['tiger_wins']/self.config.episodes:.2%}\n")
            f.write(f"Final Goat Win Rate: {self.training_stats['goat_wins']/self.config.episodes:.2%}\n")
            f.write(f"\nFinal Epsilon Values:\n")
            f.write(f"Tiger: {self.tiger_agent.config.epsilon:.4f}\n")
            f.write(f"Goat: {self.goat_agent.config.epsilon:.4f}\n")
        
        print(f"📋 Training report saved to {report_path}")
    
    def _plot_training_progress(self, save_path: Path):
        """Plot overall training progress."""
        episodes = list(range(1, len(self.training_stats['total_rewards']['tiger']) + 1))
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        
        # Reward evolution
        window_size = 100
        tiger_rewards = self.training_stats['total_rewards']['tiger']
        goat_rewards = self.training_stats['total_rewards']['goat']
        
        if len(tiger_rewards) >= window_size:
            tiger_smooth = pd.Series(tiger_rewards).rolling(window_size).mean()
            goat_smooth = pd.Series(goat_rewards).rolling(window_size).mean()
            
            ax1.plot(episodes, tiger_smooth, label='Tiger', color='orange', alpha=0.7)
            ax1.plot(episodes, goat_smooth, label='Goat', color='blue', alpha=0.7)
            ax1.set_title('Average Reward (100-episode window)')
            ax1.set_xlabel('Episode')
            ax1.set_ylabel('Reward')
            ax1.legend()
            ax1.grid(True, alpha=0.3)
        
        # Cumulative wins
        tiger_cumulative = np.cumsum([1 if game['winner'] == 'TIGER' else 0 for game in self.game_history])
        goat_cumulative = np.cumsum([1 if game['winner'] == 'GOAT' else 0 for game in self.game_history])
        
        ax2.plot(range(1, len(tiger_cumulative) + 1), tiger_cumulative, label='Tiger', color='orange')
        ax2.plot(range(1, len(goat_cumulative) + 1), goat_cumulative, label='Goat', color='blue')
        ax2.set_title('Cumulative Wins')
        ax2.set_xlabel('Episode')
        ax2.set_ylabel('Wins')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Game length evolution
        game_lengths = [game['moves'] for game in self.game_history]
        if len(game_lengths) >= window_size:
            length_smooth = pd.Series(game_lengths).rolling(window_size).mean()
            ax3.plot(range(1, len(length_smooth) + 1), length_smooth, color='green', alpha=0.7)
            ax3.set_title('Average Game Length (100-episode window)')
            ax3.set_xlabel('Episode')
            ax3.set_ylabel('Moves')
            ax3.grid(True, alpha=0.3)
        
        # Win rate over time
        if self.training_stats['win_rates']['tiger']:
            eval_episodes = range(self.config.eval_interval, 
                                len(self.training_stats['win_rates']['tiger']) * self.config.eval_interval + 1, 
                                self.config.eval_interval)
            ax4.plot(eval_episodes, self.training_stats['win_rates']['tiger'], 
                    label='Tiger', color='orange', marker='o')
            ax4.plot(eval_episodes, self.training_stats['win_rates']['goat'], 
                    label='Goat', color='blue', marker='s')
            ax4.set_title('Win Rate (last 100 games)')
            ax4.set_xlabel('Episode')
            ax4.set_ylabel('Win Rate')
            ax4.legend()
            ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(save_path / 'training_progress.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def _plot_win_rates(self, save_path: Path):
        """Plot detailed win rate analysis."""
        if not self.training_stats['win_rates']['tiger']:
            return
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        eval_episodes = range(self.config.eval_interval, 
                            len(self.training_stats['win_rates']['tiger']) * self.config.eval_interval + 1, 
                            self.config.eval_interval)
        
        ax.plot(eval_episodes, self.training_stats['win_rates']['tiger'], 
               label='Tiger Win Rate', color='orange', linewidth=2, marker='o')
        ax.plot(eval_episodes, self.training_stats['win_rates']['goat'], 
               label='Goat Win Rate', color='blue', linewidth=2, marker='s')
        
        # Add horizontal line at 50%
        ax.axhline(y=0.5, color='gray', linestyle='--', alpha=0.5, label='50% baseline')
        
        ax.set_title('Win Rate Evolution During Training')
        ax.set_xlabel('Episode')
        ax.set_ylabel('Win Rate')
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_ylim(0, 1)
        
        plt.tight_layout()
        plt.savefig(save_path / 'win_rates.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def _plot_q_value_evolution(self, save_path: Path):
        """Plot Q-value statistics evolution."""
        if not self.training_stats['q_value_stats']['tiger']:
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        eval_episodes = range(self.config.eval_interval, 
                            len(self.training_stats['q_value_stats']['tiger']) * self.config.eval_interval + 1, 
                            self.config.eval_interval)
        
        # Tiger Q-values
        tiger_means = [stat['mean'] for stat in self.training_stats['q_value_stats']['tiger']]
        tiger_stds = [stat['std'] for stat in self.training_stats['q_value_stats']['tiger']]
        
        ax1.plot(eval_episodes, tiger_means, label='Mean Q-value', color='orange', linewidth=2)
        ax1.fill_between(eval_episodes, 
                        np.array(tiger_means) - np.array(tiger_stds),
                        np.array(tiger_means) + np.array(tiger_stds),
                        alpha=0.3, color='orange')
        ax1.set_title('Tiger Q-value Evolution')
        ax1.set_xlabel('Episode')
        ax1.set_ylabel('Q-value')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Goat Q-values
        goat_means = [stat['mean'] for stat in self.training_stats['q_value_stats']['goat']]
        goat_stds = [stat['std'] for stat in self.training_stats['q_value_stats']['goat']]
        
        ax2.plot(eval_episodes, goat_means, label='Mean Q-value', color='blue', linewidth=2)
        ax2.fill_between(eval_episodes, 
                        np.array(goat_means) - np.array(goat_stds),
                        np.array(goat_means) + np.array(goat_stds),
                        alpha=0.3, color='blue')
        ax2.set_title('Goat Q-value Evolution')
        ax2.set_xlabel('Episode')
        ax2.set_ylabel('Q-value')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(save_path / 'q_value_evolution.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def _plot_epsilon_decay(self, save_path: Path):
        """Plot epsilon decay over training."""
        fig, ax = plt.subplots(figsize=(10, 6))
        
        episodes = range(1, len(self.training_stats['epsilon_history']['tiger']) + 1)
        
        ax.plot(episodes, self.training_stats['epsilon_history']['tiger'], 
               label='Tiger ε', color='orange', linewidth=2)
        ax.plot(episodes, self.training_stats['epsilon_history']['goat'], 
               label='Goat ε', color='blue', linewidth=2)
        
        # Mark training phases
        ax.axvline(x=self.config.exploration_episodes, color='red', linestyle='--', 
                  alpha=0.7, label='End Exploration Phase')
        ax.axvline(x=self.config.exploration_episodes + self.config.intermediate_episodes, 
                  color='green', linestyle='--', alpha=0.7, label='End Intermediate Phase')
        
        ax.set_title('Epsilon Decay During Training')
        ax.set_xlabel('Episode')
        ax.set_ylabel('Epsilon (Exploration Rate)')
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_ylim(0, 1)
        
        plt.tight_layout()
        plt.savefig(save_path / 'epsilon_decay.png', dpi=300, bbox_inches='tight')
        plt.close()

# Convenience functions for easy training
def train_q_learning_agents(episodes: int = 5000, save_dir: str = "models/q_learning"):
    """Train double Q-learning agents with default configuration."""
    config = TrainingConfig(episodes=episodes)
    trainer = QLearningTrainer(config)
    trainer.train(save_dir)
    return trainer

def quick_train(episodes: int = 1000):
    """Quick training for testing purposes."""
    config = TrainingConfig(
        episodes=episodes,
        save_interval=200,
        eval_interval=50,
        exploration_episodes=episodes // 3,
        intermediate_episodes=episodes // 3,
        exploitation_episodes=episodes // 3
    )
    trainer = QLearningTrainer(config)
    trainer.train()
    return trainer 