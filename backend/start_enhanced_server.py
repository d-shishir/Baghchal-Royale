#!/usr/bin/env python3
"""
Enhanced Baghchal Royale API Server Startup Script
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the app directory to Python path
current_dir = Path(__file__).parent
app_dir = current_dir / "app"
sys.path.insert(0, str(app_dir))
sys.path.insert(0, str(current_dir))

def check_ai_models():
    """Check if AI models are available."""
    model_files = [
        "enhanced_tiger_dual.pkl",
        "enhanced_goat_dual.pkl",
        "enhanced_tiger_q_table.pkl", 
        "enhanced_goat_q_table.pkl"
    ]
    
    found_models = []
    for model_file in model_files:
        if os.path.exists(model_file):
            found_models.append(model_file)
        elif os.path.exists(f"../{model_file}"):
            found_models.append(f"../{model_file}")
    
    print("🤖 AI Model Status:")
    if found_models:
        print(f"   ✅ Found {len(found_models)} AI model(s):")
        for model in found_models:
            print(f"      - {model}")
    else:
        print("   ⚠️ No AI models found - will use rule-based AI fallback")
    
    return len(found_models) > 0

def check_database():
    """Check database configuration."""
    print("🗄️  Database Status:")
    
    # Check if database URL is configured
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print(f"   ✅ Database URL configured")
        if "postgresql" in db_url:
            print("   📊 Using PostgreSQL database")
        elif "sqlite" in db_url:
            print("   📁 Using SQLite database")
    else:
        print("   ⚠️ No DATABASE_URL configured - using default SQLite")
    
    return True

def main():
    """Main startup function."""
    print("🚀 Starting Enhanced Baghchal Royale API Server")
    print("=" * 50)
    
    # Check prerequisites
    print("\n🔍 Checking Prerequisites...")
    
    ai_available = check_ai_models()
    db_available = check_database()
    
    print(f"\n📋 System Summary:")
    print(f"   🤖 Enhanced AI: {'✅ Available' if ai_available else '⚠️ Fallback mode'}")
    print(f"   🗄️  Database: {'✅ Ready' if db_available else '❌ Not configured'}")
    
    if not db_available:
        print("\n❌ Database not properly configured!")
        print("   Please set DATABASE_URL environment variable or run migrations")
        return False
    
    print("\n🌐 Starting server...")
    print("   📍 URL: http://localhost:8000")
    print("   📚 API Docs: http://localhost:8000/docs")
    print("   🎮 Simple Game Server: Run simple_game_server.py for testing")
    print("   🧪 API Test: Run test_game_api.py to verify functionality")
    
    try:
        # Import the FastAPI app
        from app.main import app
        
        # Run the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=["app"],
            log_level="info"
        )
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("   Make sure you're in the backend directory and dependencies are installed")
        return False
    except Exception as e:
        print(f"\n❌ Server startup error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Server shutdown by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1) 