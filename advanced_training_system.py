"""
Advanced Training System for Baghchal AI
Self-play training with strategic evaluation and model saving
"""

import numpy as np
import random
import pickle
import json
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import matplotlib.pyplot as plt
from datetime import datetime
import sys

# Add backend path for imports
sys.path.append(str(Path(__file__).parent / "backend"))

try:
    from backend.app.core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType
    from advanced_baghchal_ai import AdvancedTigerAI, AdvancedGoatAI, TigerStrategy, GoatStrategy
except ImportError as e:
    print(f"Warning: Could not import dependencies: {e}")

class AdvancedTrainingSystem:
    """Advanced training system for Baghchal AI agents."""
    
    def __init__(self):
        self.env = BaghchalEnv()
        self.training_stats = {
            'tiger_wins': 0,
            'goat_wins': 0,
            'games_played': 0,
            'average_game_length': 0,
            'capture_efficiency': 0,
            'defensive_success_rate': 0
        }
        self.game_history = []
        
        print("🎯 Advanced Training System initialized")
    
    def train_agents(self, episodes: int = 1000, save_interval: int = 250):
        """Train agents using self-play with advanced evaluation."""
        print(f"🚀 Starting advanced training for {episodes} episodes...")
        
        # Initialize agents with different strategies
        tiger_agents = [
            AdvancedTigerAI(TigerStrategy.AGGRESSIVE_HUNT, "expert"),
            AdvancedTigerAI(TigerStrategy.CENTER_DOMINANCE, "expert"),
            AdvancedTigerAI(TigerStrategy.OPPORTUNISTIC, "expert")
        ]
        
        goat_agents = [
            AdvancedGoatAI(GoatStrategy.DEFENSIVE_BLOCK, "expert"),
            AdvancedGoatAI(GoatStrategy.CENTER_CONTROL, "expert"),
            AdvancedGoatAI(GoatStrategy.TIGER_CONTAINMENT, "expert")
        ]
        
        episode_results = []
        
        for episode in range(episodes):
            # Randomly select agent strategies for diversity
            tiger_agent = random.choice(tiger_agents)
            goat_agent = random.choice(goat_agents)
            
            # Play a game
            game_result = self._play_training_game(tiger_agent, goat_agent, episode)
            episode_results.append(game_result)
            
            # Update statistics
            self._update_training_stats(game_result)
            
            # Log progress
            if (episode + 1) % 100 == 0:
                self._log_training_progress(episode + 1, episodes)
            
            # Save checkpoint
            if (episode + 1) % save_interval == 0:
                self._save_training_checkpoint(episode + 1, episode_results)
        
        # Final save and analysis
        final_stats = self._analyze_training_results(episode_results)
        self._save_final_models(final_stats)
        
        print("🎉 Training completed successfully!")
        return final_stats
    
    def _play_training_game(self, tiger_agent: AdvancedTigerAI, goat_agent: AdvancedGoatAI, episode: int) -> Dict:
        """Play a single training game between agents."""
        state = self.env.reset()
        moves_played = 0
        captures_made = 0
        game_log = []
        
        while not state['game_over'] and moves_played < 200:  # Prevent infinite games
            current_player = state['current_player']
            
            try:
                if current_player == 'tigers':
                    action = tiger_agent.select_action(self.env, state)
                    agent_type = f"Tiger ({tiger_agent.strategy.value})"
                else:
                    action = goat_agent.select_action(self.env, state)
                    agent_type = f"Goat ({goat_agent.strategy.value})"
                
                if action is None:
                    print(f"⚠️ No valid action for {current_player} at move {moves_played}")
                    break
                
                # Record captures before move
                captures_before = state.get('goats_captured', 0)
                
                # Execute action
                state, reward, done, info = self.env.step(action)
                
                # Track captures
                captures_after = state.get('goats_captured', 0)
                if captures_after > captures_before:
                    captures_made += 1
                
                # Log move
                game_log.append({
                    'move': moves_played,
                    'player': current_player,
                    'agent': agent_type,
                    'action': action,
                    'captures': captures_after,
                    'phase': state.get('phase', 'unknown')
                })
                
                moves_played += 1
                
            except Exception as e:
                print(f"❌ Error in game {episode}, move {moves_played}: {e}")
                break
        
        # Analyze game result
        winner = state.get('winner', 'draw')
        game_result = {
            'episode': episode,
            'winner': winner,
            'moves_played': moves_played,
            'captures_made': captures_made,
            'tiger_strategy': tiger_agent.strategy.value,
            'goat_strategy': goat_agent.strategy.value,
            'game_log': game_log,
            'final_state': {
                'goats_captured': state.get('goats_captured', 0),
                'goats_placed': state.get('goats_placed', 0),
                'phase': state.get('phase', 'unknown')
            }
        }
        
        return game_result
    
    def _update_training_stats(self, game_result: Dict):
        """Update overall training statistics."""
        self.training_stats['games_played'] += 1
        
        if game_result['winner'] == 'tigers':
            self.training_stats['tiger_wins'] += 1
        elif game_result['winner'] == 'goats':
            self.training_stats['goat_wins'] += 1
        
        # Update running averages
        total_games = self.training_stats['games_played']
        current_avg_length = self.training_stats['average_game_length']
        new_length = game_result['moves_played']
        
        self.training_stats['average_game_length'] = (
            (current_avg_length * (total_games - 1) + new_length) / total_games
        )
        
        # Update capture efficiency
        if game_result['winner'] == 'tigers':
            captures = game_result['captures_made']
            self.training_stats['capture_efficiency'] = (
                (self.training_stats['capture_efficiency'] * (self.training_stats['tiger_wins'] - 1) + 
                 captures) / self.training_stats['tiger_wins']
            )
    
    def _log_training_progress(self, episode: int, total_episodes: int):
        """Log training progress to console."""
        stats = self.training_stats
        tiger_win_rate = (stats['tiger_wins'] / stats['games_played']) * 100
        goat_win_rate = (stats['goat_wins'] / stats['games_played']) * 100
        
        print(f"📊 Episode {episode}/{total_episodes}:")
        print(f"   Tiger wins: {stats['tiger_wins']} ({tiger_win_rate:.1f}%)")
        print(f"   Goat wins: {stats['goat_wins']} ({goat_win_rate:.1f}%)")
        print(f"   Avg game length: {stats['average_game_length']:.1f} moves")
        print(f"   Capture efficiency: {stats['capture_efficiency']:.2f}")
    
    def _save_training_checkpoint(self, episode: int, results: List[Dict]):
        """Save training checkpoint."""
        # Create simplified results for JSON serialization
        simplified_results = []
        recent_results = results[-50:] if len(results) > 50 else results
        
        for result in recent_results:
            simplified_result = {
                'episode': result.get('episode', 0),
                'winner': result.get('winner', 'unknown'),
                'moves_played': result.get('moves_played', 0),
                'captures_made': result.get('captures_made', 0),
                'tiger_strategy': result.get('tiger_strategy', 'unknown'),
                'goat_strategy': result.get('goat_strategy', 'unknown')
            }
            simplified_results.append(simplified_result)
        
        checkpoint_data = {
            'episode': episode,
            'timestamp': datetime.now().isoformat(),
            'training_stats': self.training_stats,
            'recent_games': simplified_results
        }
        
        checkpoint_file = f"training_checkpoint_{episode}.json"
        with open(checkpoint_file, 'w') as f:
            json.dump(checkpoint_data, f, indent=2)
        
        print(f"💾 Checkpoint saved: {checkpoint_file}")
    
    def _analyze_training_results(self, results: List[Dict]) -> Dict:
        """Analyze complete training results."""
        print("📈 Analyzing training results...")
        
        # Strategy performance analysis
        strategy_stats = self._analyze_strategy_performance(results)
        
        # Game length analysis
        game_lengths = [r['moves_played'] for r in results]
        
        # Capture analysis
        capture_stats = self._analyze_capture_patterns(results)
        
        # Create visualizations
        self._create_training_visualizations(results, strategy_stats)
        
        final_analysis = {
            'total_games': len(results),
            'overall_stats': self.training_stats,
            'strategy_performance': strategy_stats,
            'capture_analysis': capture_stats,
            'game_length_stats': {
                'min': min(game_lengths),
                'max': max(game_lengths),
                'mean': np.mean(game_lengths),
                'std': np.std(game_lengths)
            }
        }
        
        return final_analysis
    
    def _analyze_strategy_performance(self, results: List[Dict]) -> Dict:
        """Analyze performance of different strategies."""
        strategy_stats = {
            'tiger_strategies': {},
            'goat_strategies': {}
        }
        
        # Tiger strategy analysis
        for strategy in TigerStrategy:
            games = [r for r in results if r['tiger_strategy'] == strategy.value]
            wins = len([r for r in games if r['winner'] == 'tigers'])
            
            strategy_stats['tiger_strategies'][strategy.value] = {
                'games_played': len(games),
                'wins': wins,
                'win_rate': (wins / len(games)) * 100 if games else 0,
                'avg_captures': np.mean([r['captures_made'] for r in games]) if games else 0
            }
        
        # Goat strategy analysis
        for strategy in GoatStrategy:
            games = [r for r in results if r['goat_strategy'] == strategy.value]
            wins = len([r for r in games if r['winner'] == 'goats'])
            
            strategy_stats['goat_strategies'][strategy.value] = {
                'games_played': len(games),
                'wins': wins,
                'win_rate': (wins / len(games)) * 100 if games else 0,
                'avg_game_length': np.mean([r['moves_played'] for r in games]) if games else 0
            }
        
        return strategy_stats
    
    def _analyze_capture_patterns(self, results: List[Dict]) -> Dict:
        """Analyze capture patterns in games."""
        tiger_wins = [r for r in results if r['winner'] == 'tigers']
        
        if not tiger_wins:
            return {'no_tiger_wins': True}
        
        captures_distribution = [r['captures_made'] for r in tiger_wins]
        
        return {
            'avg_captures_to_win': np.mean(captures_distribution),
            'min_captures_to_win': min(captures_distribution),
            'max_captures_to_win': max(captures_distribution),
            'captures_std': np.std(captures_distribution),
            'games_with_5_captures': len([c for c in captures_distribution if c >= 5]),
            'quick_wins': len([r for r in tiger_wins if r['moves_played'] < 50])
        }
    
    def _create_training_visualizations(self, results: List[Dict], strategy_stats: Dict):
        """Create training analysis visualizations."""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
        
        # Win rate over time
        episodes = [r['episode'] for r in results]
        tiger_wins_cumulative = []
        running_tiger_wins = 0
        
        for i, result in enumerate(results):
            if result['winner'] == 'tigers':
                running_tiger_wins += 1
            tiger_wins_cumulative.append((running_tiger_wins / (i + 1)) * 100)
        
        ax1.plot(episodes, tiger_wins_cumulative, label='Tiger Win Rate', color='orange')
        ax1.set_xlabel('Episode')
        ax1.set_ylabel('Win Rate (%)')
        ax1.set_title('Tiger Win Rate Over Time')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Game length distribution
        game_lengths = [r['moves_played'] for r in results]
        ax2.hist(game_lengths, bins=30, alpha=0.7, color='blue', edgecolor='black')
        ax2.set_xlabel('Game Length (moves)')
        ax2.set_ylabel('Frequency')
        ax2.set_title('Game Length Distribution')
        ax2.grid(True, alpha=0.3)
        
        # Strategy performance
        tiger_strategies = list(strategy_stats['tiger_strategies'].keys())
        tiger_win_rates = [strategy_stats['tiger_strategies'][s]['win_rate'] for s in tiger_strategies]
        
        ax3.bar(tiger_strategies, tiger_win_rates, color='orange', alpha=0.7)
        ax3.set_ylabel('Win Rate (%)')
        ax3.set_title('Tiger Strategy Performance')
        ax3.tick_params(axis='x', rotation=45)
        
        # Capture distribution
        tiger_games = [r for r in results if r['winner'] == 'tigers']
        if tiger_games:
            captures = [r['captures_made'] for r in tiger_games]
            ax4.hist(captures, bins=range(1, max(captures) + 2), alpha=0.7, color='red', edgecolor='black')
            ax4.set_xlabel('Captures Made')
            ax4.set_ylabel('Frequency')
            ax4.set_title('Captures in Tiger Wins')
            ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('advanced_training_analysis.png', dpi=300, bbox_inches='tight')
        print("📊 Training analysis saved as 'advanced_training_analysis.png'")
        plt.close()
    
    def _save_final_models(self, analysis: Dict):
        """Save the final trained models."""
        # Create final optimized agents based on best-performing strategies
        best_tiger_strategy = max(
            analysis['strategy_performance']['tiger_strategies'].items(),
            key=lambda x: x[1]['win_rate']
        )[0]
        
        best_goat_strategy = max(
            analysis['strategy_performance']['goat_strategies'].items(),
            key=lambda x: x[1]['win_rate']
        )[0]
        
        # Create and save optimized agents
        final_tiger = AdvancedTigerAI(TigerStrategy(best_tiger_strategy), "expert")
        final_goat = AdvancedGoatAI(GoatStrategy(best_goat_strategy), "expert")
        
        # Save models
        with open('advanced_tiger_ai.pkl', 'wb') as f:
            pickle.dump(final_tiger, f)
        
        with open('advanced_goat_ai.pkl', 'wb') as f:
            pickle.dump(final_goat, f)
        
        # Save analysis results
        with open('training_analysis.json', 'w') as f:
            json.dump(analysis, f, indent=2)
        
        print(f"🎯 Final models saved:")
        print(f"   Best Tiger strategy: {best_tiger_strategy}")
        print(f"   Best Goat strategy: {best_goat_strategy}")
        print(f"   Models: advanced_tiger_ai.pkl, advanced_goat_ai.pkl")
        print(f"   Analysis: training_analysis.json")

def main():
    """Main training function."""
    print("🎮 Advanced Baghchal AI Training System")
    print("=" * 50)
    
    trainer = AdvancedTrainingSystem()
    
    # Run training
    episodes = 2000
    analysis = trainer.train_agents(episodes=episodes, save_interval=500)
    
    # Display final results
    print("\n🏆 FINAL TRAINING RESULTS:")
    print(f"Total games played: {analysis['total_games']}")
    print(f"Tiger win rate: {(analysis['overall_stats']['tiger_wins'] / analysis['total_games']) * 100:.1f}%")
    print(f"Goat win rate: {(analysis['overall_stats']['goat_wins'] / analysis['total_games']) * 100:.1f}%")
    print(f"Average game length: {analysis['game_length_stats']['mean']:.1f} moves")
    
    if analysis['capture_analysis'].get('avg_captures_to_win'):
        print(f"Average captures to win: {analysis['capture_analysis']['avg_captures_to_win']:.1f}")
    
    print("\n🎉 Training completed successfully!")

if __name__ == "__main__":
    main() 