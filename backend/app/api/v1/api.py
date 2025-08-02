from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, games, friends, matchmaking, moves, 
    ai_games, ai_moves, tournaments, reports, feedback, game_websocket, ai, ai_analysis
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(games.router, prefix="/games", tags=["games"])
api_router.include_router(friends.router, prefix="/friends", tags=["friends"])
api_router.include_router(matchmaking.router, prefix="/matchmaking", tags=["matchmaking"])
api_router.include_router(moves.router, prefix="/moves", tags=["moves"])
api_router.include_router(ai_games.router, prefix="/ai-games", tags=["ai-games"])
api_router.include_router(ai_moves.router, prefix="/ai-moves", tags=["ai-moves"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(ai_analysis.router, prefix="/ai_analysis", tags=["ai-analysis"])
api_router.include_router(tournaments.router, prefix="/tournaments", tags=["tournaments"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(game_websocket.router, prefix="/games", tags=["game-websocket"])