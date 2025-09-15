#!/usr/bin/env python3
"""
Enhanced server startup script with automatic database initialization.
This script demonstrates the automatic database setup and migration features.
"""
import os
import sys
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)
    print(f"✅ Loaded environment from: {env_file}")
else:
    print(f"⚠️  No .env file found at: {env_file}")
    print("   Using system environment variables")

import uvicorn
from app.core.config import settings
from app.core.database_init import check_and_initialize_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def print_banner():
    """Print startup banner with information."""
    print("=" * 80)
    print("🏫 SCHOOL MANAGEMENT SYSTEM - AUTOMATIC DATABASE SETUP")
    print("=" * 80)
    print(f"📊 Database URL: {settings.database_url}")
    print(f"🔧 Environment: {settings.environment}")
    print(f"🐛 Debug Mode: {settings.debug}")
    print(f"🌐 Server will start on: http://0.0.0.0:8000")
    print(f"📚 API Documentation: http://localhost:8000/api/v1/docs")
    print("=" * 80)
    print()


def check_environment():
    """Check if all required environment variables are set."""
    logger.info("Checking environment configuration...")
    
    required_vars = [
        "DATABASE_URL",
        "DATABASE_URL_SYNC", 
        "SECRET_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please check your .env file")
        return False
    
    logger.info("✅ Environment configuration is valid")
    return True


async def test_database_initialization():
    """Test the database initialization process."""
    logger.info("Testing database initialization...")
    
    try:
        await check_and_initialize_database()
        logger.info("✅ Database initialization test completed successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Database initialization test failed: {e}")
        return False


def main():
    """Main startup function."""
    print_banner()
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Test database initialization
    logger.info("Running pre-startup database check...")
    try:
        asyncio.run(test_database_initialization())
    except Exception as e:
        logger.error(f"Pre-startup database check failed: {e}")
        sys.exit(1)
    
    logger.info("🚀 Starting School Management System server...")
    logger.info("📝 The server will automatically:")
    logger.info("   • Check database connection")
    logger.info("   • Create tables if they don't exist")
    logger.info("   • Run any pending migrations")
    logger.info("   • Start the FastAPI application")
    print()
    
    # Start the server
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=settings.debug,
            log_level="info" if not settings.debug else "debug",
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server startup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
