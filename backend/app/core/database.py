from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

# Configure SQLAlchemy logging
# Configure SQLAlchemy logging
# logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
# logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
# logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)

# Async engine for FastAPI
async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    connect_args={"statement_cache_size": 0},  # Required for Supabase Transaction Pooler (PgBouncer)
    pool_pre_ping=True,
    pool_recycle=300,  # Recycle connections every 5 minutes
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
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Dependency to get sync database session (for migrations)
def get_sync_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
