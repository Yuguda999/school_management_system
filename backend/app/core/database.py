from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

# Configure SQLAlchemy logging
# logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
# logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
# logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)

# Build async database URL with statement_cache_size=0 for PgBouncer compatibility
# This MUST be passed via URL for asyncpg to properly disable prepared statements
async_db_url = settings.database_url
if "?" in async_db_url:
    async_db_url += "&prepared_statement_cache_size=0"
else:
    async_db_url += "?prepared_statement_cache_size=0"

print(f"[database.py] Using async DB URL: {async_db_url.split('@')[0]}@****", flush=True)

# Async engine for FastAPI
async_engine = create_async_engine(
    async_db_url,
    echo=False,
    future=True,
    connect_args={
        "statement_cache_size": 0,  # Disable statement cache for PgBouncer
        "prepared_statement_cache_size": 0,  # Also disable prepared statement cache
    },
    poolclass=NullPool,
)
# Sync engine for Alembic migrations
sync_engine = create_engine(
    settings.database_url_sync,
    echo=False  # Disable SQL echo to reduce logs
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Sync session factory for migrations
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
)

# Base class for all models
Base = declarative_base()


# Dependency to get async database session
async def get_db() -> AsyncSession:
    print("[get_db] Creating async session...", flush=True)
    try:
        async with AsyncSessionLocal() as session:
            print("[get_db] Session created successfully", flush=True)
            try:
                yield session
            finally:
                await session.close()
    except Exception as e:
        print(f"[get_db] ERROR creating session: {type(e).__name__}: {e}", flush=True)
        raise


# Dependency to get sync database session (for migrations)
def get_sync_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
