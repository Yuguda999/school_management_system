from sqlalchemy import create_engine, event
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

print(f"[database.py] Using DB URL scheme: {settings.database_url.split('://')[0]}", flush=True)

# Determine if using Supabase (needs special PgBouncer settings)
is_supabase = "supabase.com" in settings.database_url or "pooler.supabase.com" in settings.database_url

# For Supabase with asyncpg: disable prepared statement caching for PgBouncer compatibility
# For other PostgreSQL: use default settings
if is_supabase:
    # asyncpg connect_args for PgBouncer transaction pooling mode
    async_connect_args = {
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    }
    print(f"[database.py] Supabase detected - disabling prepared statement cache", flush=True)
else:
    async_connect_args = {}

# Async engine for FastAPI
# NullPool ensures we don't do any pooling on SQLAlchemy side (let PgBouncer handle it)
async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    poolclass=NullPool,
    connect_args=async_connect_args,
)

print(f"[database.py] Async engine created with NullPool", flush=True)

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

