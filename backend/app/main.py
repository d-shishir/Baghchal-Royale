from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.api.v1.api import api_router
from app.core.config import settings

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

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Baghchal Royale API is running"}

# Mount static files for admin panel
# Go up from backend/ to project root, then to frontend/admin
project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
admin_path = os.path.join(project_root, "frontend", "admin")
if os.path.exists(admin_path):
    app.mount("/admin/static", StaticFiles(directory=admin_path), name="admin_static")

@app.get("/admin")
@app.get("/admin/")
async def admin_panel():
    """Serve the admin panel login page"""
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    admin_index_path = os.path.join(project_root, "frontend", "admin", "index.html")
    if os.path.exists(admin_index_path):
        return FileResponse(admin_index_path)
    else:
        return {"error": "Admin panel not found"}

@app.get("/admin/dashboard")
@app.get("/admin/dashboard.html")
async def admin_dashboard():
    """Serve the admin dashboard page"""
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    dashboard_path = os.path.join(project_root, "frontend", "admin", "dashboard.html")
    if os.path.exists(dashboard_path):
        return FileResponse(dashboard_path)
    else:
        return {"error": "Dashboard not found"}

@app.get("/admin/ai_analysis")
@app.get("/admin/ai_analysis.html")
async def admin_ai_analysis():
    """Serve the AI analysis page"""
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    ai_analysis_path = os.path.join(project_root, "frontend", "admin", "ai_analysis.html")
    if os.path.exists(ai_analysis_path):
        return FileResponse(ai_analysis_path)
    else:
        return {"error": "AI Analysis page not found"}

app.include_router(api_router, prefix="/api/v1") 