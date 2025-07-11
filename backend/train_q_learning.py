#!/usr/bin/env python3
"""
Training Script for Double Q-Learning Baghchal AI
Run this script to train AI agents using self-play
"""

import argparse
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

try:
    from app.ai.q_learning_trainer import QLearningTrainer, TrainingConfig, train_q_learning_agents, quick_train
    from app.core.enhanced_ai import reload_models
    print("✅ Successfully imported Q-learning training system")
except ImportError as e:
    print(f"❌ Failed to import training system: {e}")
    print("Make sure you're running this script from the backend directory")
    sys.exit(1)

def main():
    """Main training function with command-line interface."""
    parser = argparse.ArgumentParser(
        description="Train Double Q-Learning Baghchal AI agents",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Training parameters
    parser.add_argument(
        '--episodes', '-e', type=int, default=5000,
        help='Number of training episodes'
    )
    parser.add_argument(
        '--save-dir', '-s', type=str, default='models/q_learning',
        help='Directory to save trained models'
    )
    parser.add_argument(
        '--save-interval', type=int, default=500,
        help='Save models every N episodes'
    )
    parser.add_argument(
        '--eval-interval', type=int, default=100,
        help='Evaluate agents every N episodes'
    )
    parser.add_argument(
        '--quick', action='store_true',
        help='Quick training mode (1000 episodes) for testing'
    )
    parser.add_argument(
        '--learning-rate', type=float, default=0.15,
        help='Learning rate for Q-learning'
    )
    parser.add_argument(
        '--epsilon-start', type=float, default=0.8,
        help='Initial exploration rate'
    )
    parser.add_argument(
        '--epsilon-min', type=float, default=0.05,
        help='Minimum exploration rate'
    )
    parser.add_argument(
        '--gamma', type=float, default=0.95,
        help='Discount factor for future rewards'
    )
    
    # Training phases
    parser.add_argument(
        '--exploration-episodes', type=int, default=None,
        help='Number of exploration episodes (default: episodes/3)'
    )
    parser.add_argument(
        '--intermediate-episodes', type=int, default=None,
        help='Number of intermediate episodes (default: episodes/3)'
    )
    
    args = parser.parse_args()
    
    print("🎯 Double Q-Learning Training for Baghchal AI")
    print("=" * 50)
    
    if args.quick:
        print("🚀 Running quick training mode...")
        trainer = quick_train()
        print("✅ Quick training completed!")
        return
    
    # Set up training configuration
    config = TrainingConfig(
        episodes=args.episodes,
        save_interval=args.save_interval,
        eval_interval=args.eval_interval,
        exploration_episodes=args.exploration_episodes or args.episodes // 3,
        intermediate_episodes=args.intermediate_episodes or args.episodes // 3,
        exploitation_episodes=args.episodes - (args.exploration_episodes or args.episodes // 3) - (args.intermediate_episodes or args.episodes // 3)
    )
    
    print(f"📊 Training Configuration:")
    print(f"   Episodes: {config.episodes}")
    print(f"   Save Directory: {args.save_dir}")
    print(f"   Save Interval: {config.save_interval}")
    print(f"   Eval Interval: {config.eval_interval}")
    print(f"   Learning Rate: {args.learning_rate}")
    print(f"   Initial Epsilon: {args.epsilon_start}")
    print(f"   Minimum Epsilon: {args.epsilon_min}")
    print(f"   Gamma: {args.gamma}")
    print(f"   Training Phases:")
    print(f"     - Exploration: {config.exploration_episodes} episodes")
    print(f"     - Intermediate: {config.intermediate_episodes} episodes") 
    print(f"     - Exploitation: {config.exploitation_episodes} episodes")
    print()
    
    # Confirm training
    confirm = input("Start training? (y/N): ").strip().lower()
    if confirm not in ['y', 'yes']:
        print("❌ Training cancelled")
        return
    
    # Create trainer and start training
    trainer = QLearningTrainer(config)
    
    try:
        trainer.train(args.save_dir)
        
        # Reload models in the AI manager
        print("🔄 Reloading trained models in AI manager...")
        reload_models()
        
        print("🎉 Training completed successfully!")
        print(f"📁 Models saved to: {args.save_dir}")
        print("\nTraining Summary:")
        stats = trainer.training_stats
        print(f"  Total Episodes: {stats['episode']}")
        print(f"  Tiger Wins: {stats['tiger_wins']} ({stats['tiger_wins']/stats['episode']:.1%})")
        print(f"  Goat Wins: {stats['goat_wins']} ({stats['goat_wins']/stats['episode']:.1%})")
        print(f"  Draws: {stats['draws']} ({stats['draws']/stats['episode']:.1%})")
        print(f"  Average Game Length: {stats['average_game_length']:.1f} moves")
        
    except KeyboardInterrupt:
        print("\n⚠️ Training interrupted by user")
        print("💾 Saving current progress...")
        try:
            save_path = Path(args.save_dir)
            trainer._save_progress(save_path, trainer.training_stats['episode'])
            print("✅ Progress saved successfully")
        except Exception as e:
            print(f"❌ Failed to save progress: {e}")
    
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()

def create_training_configs():
    """Create some preset training configurations."""
    configs = {
        'quick': {
            'episodes': 1000,
            'description': 'Quick training for testing (1000 episodes)'
        },
        'standard': {
            'episodes': 5000,
            'description': 'Standard training (5000 episodes)'
        },
        'extensive': {
            'episodes': 10000,
            'description': 'Extensive training (10000 episodes)'
        },
        'tournament': {
            'episodes': 20000,
            'description': 'Tournament-level training (20000 episodes)'
        }
    }
    
    print("Available training presets:")
    for name, config in configs.items():
        print(f"  {name}: {config['description']}")

def show_training_tips():
    """Show training tips and recommendations."""
    print("💡 Training Tips:")
    print("  - Start with 'quick' mode to test the system")
    print("  - Use 'standard' mode for decent performance")
    print("  - 'extensive' mode for competitive play")
    print("  - Training can be interrupted with Ctrl+C")
    print("  - Models are saved periodically during training")
    print("  - Check the 'models/q_learning' directory for saved models")
    print("  - Training progress plots are generated automatically")
    print()

if __name__ == "__main__":
    # Create models directory if it doesn't exist
    models_dir = Path("models/q_learning")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Show help information
    if len(sys.argv) == 1 or '--help' in sys.argv or '-h' in sys.argv:
        if len(sys.argv) == 1:
            show_training_tips()
            create_training_configs()
            print("\nUse --help for detailed options")
            print("\nExample usage:")
            print("  python train_q_learning.py --quick")
            print("  python train_q_learning.py --episodes 5000")
            print("  python train_q_learning.py --episodes 10000 --save-dir my_models")
            print()
    
    main() 