from .base import CRUDBase
from .user import user
from .game import game
from .friendship import friendship
from .room import room

__all__ = ["CRUDBase", "user", "game", "friendship", "room"]

# For a new basic set of CRUD operations you could add them here...
# from .item import item 