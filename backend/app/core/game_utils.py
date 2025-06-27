"""
Game utilities for state management and reconstruction.
"""

import numpy as np
from typing import Dict, Any, Optional
from app.core.baghchal_env import BaghchalEnv, Player, GamePhase, PieceType


def reconstruct_game_state(game_env: BaghchalEnv, board_state: Dict[str, Any]) -> BaghchalEnv:
    """
    Reconstruct game environment from saved board state.
    """
    try:
        # Set board
        board_array = np.array(board_state['board'], dtype=int)
        game_env.board = board_array
        
        # Set game phase
        phase_name = board_state['phase'].upper()
        game_env.phase = GamePhase[phase_name]
        
        # Set current player
        player_name = board_state['current_player'].upper()
        game_env.current_player = Player[player_name]
        
        # Set counters
        game_env.goats_placed = board_state['goats_placed']
        game_env.goats_captured = board_state['goats_captured']
        
        # Set game over state
        game_env.game_over = board_state['game_over']
        
        # Set winner
        if board_state['winner']:
            winner_name = board_state['winner'].upper()
            game_env.winner = Player[winner_name]
        else:
            game_env.winner = None
            
        return game_env
        
    except Exception as e:
        print(f"Error reconstructing game state: {e}")
        # Return fresh game if reconstruction fails
        return BaghchalEnv()


def validate_game_state(board_state: Dict[str, Any]) -> bool:
    """
    Validate if board state is consistent and valid.
    """
    try:
        # Check required fields
        required_fields = ['board', 'phase', 'current_player', 'goats_placed', 
                          'goats_captured', 'game_over', 'winner']
        
        for field in required_fields:
            if field not in board_state:
                return False
        
        # Validate board dimensions
        board = board_state['board']
        if len(board) != 5 or any(len(row) != 5 for row in board):
            return False
        
        # Validate piece counts
        tigers = sum(row.count(1) for row in board)
        goats = sum(row.count(2) for row in board)
        
        if tigers != 4:  # Always 4 tigers
            return False
        
        # Validate goats count based on phase
        if board_state['phase'].lower() == 'placement':
            if goats != board_state['goats_placed']:
                return False
        else:  # movement phase
            expected_goats = board_state['goats_placed'] - board_state['goats_captured']
            if goats != expected_goats:
                return False
        
        # Validate ranges
        if not (0 <= board_state['goats_placed'] <= 20):
            return False
        
        if not (0 <= board_state['goats_captured'] <= 20):
            return False
        
        return True
        
    except Exception:
        return False


def get_game_summary(board_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get a summary of the current game state.
    """
    board = board_state['board']
    
    # Count pieces
    tigers = sum(row.count(1) for row in board)
    goats = sum(row.count(2) for row in board)
    empty = sum(row.count(0) for row in board)
    
    # Calculate game progress
    total_goats_placed = board_state['goats_placed']
    goats_captured = board_state['goats_captured']
    
    if board_state['phase'].lower() == 'placement':
        progress = (total_goats_placed / 20) * 100
    else:
        # In movement phase, progress based on captures or blocked tigers
        progress = 50 + (goats_captured / 5) * 50  # Tigers progress towards win
    
    return {
        "pieces": {
            "tigers": tigers,
            "goats": goats,
            "empty": empty
        },
        "progress": {
            "phase": board_state['phase'],
            "current_player": board_state['current_player'],
            "goats_placed": total_goats_placed,
            "goats_captured": goats_captured,
            "progress_percent": progress
        },
        "status": {
            "game_over": board_state['game_over'],
            "winner": board_state['winner']
        }
    }


def calculate_game_rating_change(winner_rating: int, loser_rating: int, 
                               game_mode: str = "pvp") -> tuple[int, int]:
    """
    Calculate rating changes for both players using ELO-like system.
    Returns (winner_change, loser_change)
    """
    K_FACTOR = 32  # Standard K-factor for chess ELO
    
    # Expected scores
    expected_winner = 1 / (1 + 10**((loser_rating - winner_rating) / 400))
    expected_loser = 1 / (1 + 10**((winner_rating - loser_rating) / 400))
    
    # Actual scores (winner = 1, loser = 0)
    winner_change = round(K_FACTOR * (1 - expected_winner))
    loser_change = round(K_FACTOR * (0 - expected_loser))
    
    # Adjust for game mode (AI games have reduced impact)
    if game_mode == "pvai":
        winner_change = round(winner_change * 0.7)
        loser_change = round(loser_change * 0.7)
    
    return winner_change, loser_change


def get_move_notation(action: tuple, board_state: Dict[str, Any]) -> str:
    """
    Convert game action to human-readable notation.
    """
    if action[0] == 'place':
        row, col = action[1], action[2]
        return f"Place at ({row},{col})"
    
    elif action[0] == 'move':
        from_row, from_col, to_row, to_col = action[1], action[2], action[3], action[4]
        
        # Check if it's a capture move
        board = board_state['board']
        piece = board[from_row][from_col]
        
        if piece == 1:  # Tiger
            # Check if move captures a goat
            if abs(to_row - from_row) == 2 or abs(to_col - from_col) == 2:
                return f"Tiger ({from_row},{from_col}) captures to ({to_row},{to_col})"
            else:
                return f"Tiger ({from_row},{from_col}) → ({to_row},{to_col})"
        else:  # Goat
            return f"Goat ({from_row},{from_col}) → ({to_row},{to_col})"
    
    return "Unknown move" 