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

# Using psycopg (psycopg3) driver instead of asyncpg for PgBouncer compatibility
# psycopg handles PgBouncer transaction mode much better than asyncpg
# NullPool ensures we don't do any pooling on SQLAlchemy side (let PgBouncer handle it)

# Async engine for FastAPI
async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    poolclass=NullPool,  # Let PgBouncer handle connection pooling
)

print(f"[database.py] Async engine created with psycopg driver and NullPool", flush=True)

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

