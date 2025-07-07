from .user import user
from .friendship import friendship
from .game import game
from .move import move
from .ai_game import ai_game
from .ai_move import ai_move
from .rating_history import rating_history
from .tournament import tournament
from .tournament_entry import tournament_entry
from .tournament_match import tournament_match
from .report import report
from .feedback import feedback

__all__ = [
    "user",
    "friendship",
    "game",
    "move",
    "ai_game",
    "ai_move",
    "rating_history",
    "tournament",
    "tournament_entry",
    "tournament_match",
    "report",
    "feedback",
]

# For a new basic set of CRUD operations you could add them here...
# from .item import item 