"""
Game utility functions for Baghchal Royale.
Contains shared game logic and calculations.
"""
import math


XP_FOR_WIN = 100
XP_FOR_LOSS = 25


def get_level_for_xp(xp: int) -> int:
    """Convert XP to level using exponential progression similar to popular games."""
    if xp < 0:
        return 1
    # Formula: Level = floor(sqrt(XP / 100)) + 1
    # This creates: L1=0-99XP, L2=100-399XP, L3=400-899XP, L4=900-1599XP, etc.
    return math.floor(math.sqrt(xp / 100)) + 1


def get_level_for_games_played(games_played: int) -> int:
    """Calculate level based on games played using a standard exponential progression."""
    if games_played < 0:
        return 1
    # Common game progression: Level = floor(sqrt(games_played * 2)) + 1
    # This creates: L1=0-1 games, L2=2-7 games, L3=8-17 games, L4=18-31 games, etc.
    return math.floor(math.sqrt(games_played * 2)) + 1