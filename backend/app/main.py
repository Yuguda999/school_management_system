import logging
import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.core.database_init import check_and_initialize_database
from app.api.v1.api import api_router

# Configure logging - Force DEBUG to capture everything
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    force=True  # Override any existing configuration
)
logger = logging.getLogger(__name__)

# Enable all loggers at DEBUG level for comprehensive logging
logging.getLogger("app").setLevel(logging.DEBUG)
logging.getLogger("uvicorn").setLevel(logging.DEBUG)
logging.getLogger("uvicorn.access").setLevel(logging.DEBUG)
logging.getLogger("uvicorn.error").setLevel(logging.DEBUG)
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)  # INFO for SQL queries
logging.getLogger("sqlalchemy.pool").setLevel(logging.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting up School Management System...")
    logger.info(f"Allowed Origins: {settings.get_allowed_origins_list()}")
    try:
        await check_and_initialize_database()
        logger.info("Database initialization completed")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down School Management System...")

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A comprehensive multitenant school management system API",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan
)

# Add GZip Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.get_allowed_hosts_list()
    )


# Global exception handler to log all unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and log them."""
    import traceback
    error_trace = traceback.format_exc()
    print(f"[GLOBAL_EXCEPTION] {request.method} {request.url}: {type(exc).__name__}: {exc}", flush=True)
    print(f"[TRACEBACK]\n{error_trace}", flush=True)
    logger.exception(f"Unhandled exception for {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Mount static files for uploads
upload_dir = settings.upload_dir
if not os.path.exists(upload_dir):
    os.makedirs(upload_dir, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/api/v1/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.app_version}
