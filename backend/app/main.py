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