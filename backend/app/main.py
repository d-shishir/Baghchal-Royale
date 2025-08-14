from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import asyncio
from datetime import datetime, timedelta, timezone
import contextlib
from sqlalchemy import select

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app import models
from app.models.game import GameStatus

app = FastAPI(
    title="Baghchal Royale API",
    openapi_url=f"/api/v1/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.middleware("http")
async def no_cache_admin_static(request, call_next):
    response = await call_next(request)
    try:
        request_path = request.url.path
        if request_path.startswith("/admin"):
            # Prevent caching of admin static assets to avoid stale scripts/styles
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
    except Exception:
        pass
    return response

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Baghchal Royale API is running"}

# Mount static files for admin panel
# Use admin files from backend/admin directory
backend_root = os.path.dirname(os.path.dirname(__file__))
admin_path = os.path.join(backend_root, "admin")
if os.path.exists(admin_path):
    # Mount all admin files as static files at /admin/static/
    app.mount("/admin/static", StaticFiles(directory=admin_path, html=True), name="admin_static")

@app.get("/admin")
@app.get("/admin/")
async def admin_panel():
    """Serve the admin panel login page"""
    backend_root = os.path.dirname(os.path.dirname(__file__))
    admin_index_path = os.path.join(backend_root, "admin", "index.html")
    if os.path.exists(admin_index_path):
        return FileResponse(admin_index_path)
    else:
        return {"error": "Admin panel not found"}

# Explicit route to serve /admin/index.html
@app.get("/admin/index.html")
async def admin_index_html():
    backend_root = os.path.dirname(os.path.dirname(__file__))
    admin_index_path = os.path.join(backend_root, "admin", "index.html")
    if os.path.exists(admin_index_path):
        return FileResponse(admin_index_path)
    else:
        return {"error": "Admin panel not found"}

@app.get("/admin/dashboard")
@app.get("/admin/dashboard.html")
async def admin_dashboard():
    """Serve the admin dashboard page"""
    backend_root = os.path.dirname(os.path.dirname(__file__))
    dashboard_path = os.path.join(backend_root, "admin", "dashboard.html")
    if os.path.exists(dashboard_path):
        return FileResponse(dashboard_path)
    else:
        return {"error": "Dashboard not found"}

@app.get("/admin/ai_analysis")
@app.get("/admin/ai_analysis.html")
async def admin_ai_analysis():
    """Serve the AI analysis page"""
    backend_root = os.path.dirname(os.path.dirname(__file__))
    ai_analysis_path = os.path.join(backend_root, "admin", "ai_analysis.html")
    if os.path.exists(ai_analysis_path):
        return FileResponse(ai_analysis_path)
    else:
        return {"error": "AI Analysis page not found"}

app.include_router(api_router, prefix="/api/v1") 


# ===== Background task: auto-abandon stale games =====
async def cleanup_stale_games_task():
    """
    Periodically mark games as ABANDONED if they have not finished within 30 minutes.
    Runs every 5 minutes.
    """
    check_interval_seconds = 300  # 5 minutes
    abandon_after = timedelta(minutes=30)
    while True:
        try:
            now = datetime.now(timezone.utc)
            threshold_time = now - abandon_after
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(models.Game).where(
                        models.Game.status == GameStatus.IN_PROGRESS,
                        models.Game.created_at <= threshold_time,
                        models.Game.ended_at.is_(None),
                    )
                )
                stale_games = result.scalars().all()

                if stale_games:
                    for game in stale_games:
                        game.status = GameStatus.ABANDONED
                        game.ended_at = now
                        if game.created_at:
                            game.game_duration = int((now - game.created_at).total_seconds())
                        db.add(game)
                    await db.commit()
        except Exception:
            # Avoid crashing the loop; optionally log here
            pass
        await asyncio.sleep(check_interval_seconds)


@app.on_event("startup")
async def start_cleanup_task():
    # Launch background cleanup task
    app.state._cleanup_task = asyncio.create_task(cleanup_stale_games_task())


@app.on_event("shutdown")
async def stop_cleanup_task():
    task = getattr(app.state, "_cleanup_task", None)
    if task:
        task.cancel()
        with contextlib.suppress(Exception):
            await task