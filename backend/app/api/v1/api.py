from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, games, friends, rooms

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(games.router, prefix="/games", tags=["games"])
api_router.include_router(friends.router, prefix="/friends", tags=["friends"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])