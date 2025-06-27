from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.game import Game
from app.schemas.game import GameCreate, GameUpdate


class CRUDGame(CRUDBase[Game, GameCreate, GameUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: GameCreate, owner_id: UUID
    ) -> Game:
        """Create a new game with an owner."""
        obj_in_data = obj_in.dict()
        obj_in_data["player1_id"] = owner_id
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Game]:
        """Get games where user is either player1 or player2."""
        return (
            db.query(self.model)
            .filter(
                (self.model.player1_id == owner_id) | 
                (self.model.player2_id == owner_id)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_games_by_user(
        self, db: Session, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Game]:
        """Get active games for a user."""
        return (
            db.query(self.model)
            .filter(
                ((self.model.player1_id == user_id) | 
                 (self.model.player2_id == user_id)) &
                (self.model.status == "active")
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_ai_games_by_user(
        self, db: Session, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Game]:
        """Get AI games for a user."""
        return (
            db.query(self.model)
            .filter(
                (self.model.player1_id == user_id) &
                (self.model.game_mode == "pvai")
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_game_state(
        self, 
        db: Session, 
        *, 
        game_id: UUID, 
        board_state: Dict[str, Any],
        current_player: str,
        game_phase: str,
        goats_placed: int,
        goats_captured: int,
        status: Optional[str] = None,
        winner_id: Optional[UUID] = None
    ) -> Game:
        """Update game state efficiently."""
        game = self.get(db=db, id=game_id)
        if game:
            game.board_state = board_state
            game.current_player = current_player
            game.game_phase = game_phase
            game.goats_placed = goats_placed
            game.goats_captured = goats_captured
            
            if status:
                game.status = status
            if winner_id:
                game.winner_id = winner_id
                
            db.commit()
            db.refresh(game)
        return game

    def get_games_by_status(
        self, db: Session, *, status: str, skip: int = 0, limit: int = 100
    ) -> List[Game]:
        """Get games by status."""
        return (
            db.query(self.model)
            .filter(self.model.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_user_stats(self, db: Session, *, user_id: UUID) -> Dict[str, Any]:
        """Get comprehensive game statistics for a user."""
        # Total games
        total_games = db.query(self.model).filter(
            (self.model.player1_id == user_id) | 
            (self.model.player2_id == user_id)
        ).count()
        
        # Games won
        games_won = db.query(self.model).filter(
            self.model.winner_id == user_id
        ).count()
        
        # Games as tigers
        tiger_games = db.query(self.model).filter(
            ((self.model.player1_id == user_id) & (self.model.player1_side == "tigers")) |
            ((self.model.player2_id == user_id) & (self.model.player1_side == "goats"))  # player2 is tigers
        ).count()
        
        # Tiger wins
        tiger_wins = db.query(self.model).filter(
            (self.model.winner_id == user_id) &
            (((self.model.player1_id == user_id) & (self.model.player1_side == "tigers")) |
             ((self.model.player2_id == user_id) & (self.model.player1_side == "goats")))
        ).count()
        
        # Games as goats
        goat_games = db.query(self.model).filter(
            ((self.model.player1_id == user_id) & (self.model.player1_side == "goats")) |
            ((self.model.player2_id == user_id) & (self.model.player1_side == "tigers"))  # player2 is goats
        ).count()
        
        # Goat wins
        goat_wins = db.query(self.model).filter(
            (self.model.winner_id == user_id) &
            (((self.model.player1_id == user_id) & (self.model.player1_side == "goats")) |
             ((self.model.player2_id == user_id) & (self.model.player1_side == "tigers")))
        ).count()
        
        return {
            "total_games": total_games,
            "games_won": games_won,
            "tiger_games": tiger_games,
            "tiger_wins": tiger_wins,
            "goat_games": goat_games,
            "goat_wins": goat_wins,
            "win_rate": (games_won / total_games * 100) if total_games > 0 else 0
        }

game = CRUDGame(Game) 