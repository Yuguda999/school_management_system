"""
Database initialization module for automatic table creation and migration.
"""
import asyncio
import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from app.core.config import settings
from app.core.database import Base, async_engine

logger = logging.getLogger(__name__)


def get_alembic_config() -> Config:
    """Get Alembic configuration."""
    # Get the path to alembic.ini relative to the backend directory
    backend_dir = Path(__file__).parent.parent.parent
    alembic_cfg_path = backend_dir / "alembic.ini"
    
    if not alembic_cfg_path.exists():
        raise FileNotFoundError(f"Alembic config file not found at {alembic_cfg_path}")
    
    alembic_cfg = Config(str(alembic_cfg_path))
    
    # Set the script location relative to the backend directory
    script_location = backend_dir / "alembic"
    alembic_cfg.set_main_option("script_location", str(script_location))
    
    # Set the database URL
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url_sync)
    
    return alembic_cfg


def check_database_connection() -> bool:
    """Check if database connection is working."""
    try:
        sync_engine = create_engine(settings.database_url_sync)
        with sync_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def get_current_revision() -> str | None:
    """Get the current database revision."""
    try:
        sync_engine = create_engine(settings.database_url_sync)
        with sync_engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_rev = context.get_current_revision()
            return current_rev
    except Exception as e:
        logger.warning(f"Could not get current revision: {e}")
        return None


def get_head_revision() -> str | None:
    """Get the head revision from migration scripts."""
    try:
        alembic_cfg = get_alembic_config()
        script_dir = ScriptDirectory.from_config(alembic_cfg)
        head_rev = script_dir.get_current_head()
        return head_rev
    except Exception as e:
        logger.warning(f"Could not get head revision: {e}")
        return None


def create_initial_migration():
    """Create initial migration if no migrations exist."""
    try:
        alembic_cfg = get_alembic_config()
        script_dir = ScriptDirectory.from_config(alembic_cfg)
        
        # Check if any migrations exist
        revisions = list(script_dir.walk_revisions())
        
        if not revisions:
            logger.info("No migrations found. Creating initial migration...")
            command.revision(alembic_cfg, autogenerate=True, message="Initial migration")
            logger.info("Initial migration created successfully")
        else:
            logger.info(f"Found {len(revisions)} existing migrations")
            
    except Exception as e:
        logger.error(f"Failed to create initial migration: {e}")
        raise


def run_migrations():
    """Run database migrations."""
    try:
        alembic_cfg = get_alembic_config()
        
        # Check current and head revisions
        current_rev = get_current_revision()
        head_rev = get_head_revision()
        
        logger.info(f"Current revision: {current_rev}")
        logger.info(f"Head revision: {head_rev}")
        
        if current_rev != head_rev:
            logger.info("Running database migrations...")
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations completed successfully")
        else:
            logger.info("Database is up to date")
            
    except Exception as e:
        logger.error(f"Failed to run migrations: {e}")
        raise


async def create_tables_fallback():
    """Fallback method to create tables directly if migrations fail."""
    try:
        logger.info("Creating tables using SQLAlchemy metadata...")
        
        # Use sync engine for table creation
        sync_engine = create_engine(settings.database_url_sync)
        Base.metadata.create_all(bind=sync_engine)
        
        logger.info("Tables created successfully using fallback method")
        
    except Exception as e:
        logger.error(f"Failed to create tables using fallback method: {e}")
        raise


async def initialize_database():
    """Initialize database with tables and migrations."""
    logger.info("Starting database initialization...")
    
    # Check database connection
    if not check_database_connection():
        raise ConnectionError("Cannot connect to database")
    
    try:
        # Try to create initial migration if needed
        create_initial_migration()
        
        # Run migrations
        run_migrations()
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.warning(f"Migration-based initialization failed: {e}")
        logger.info("Attempting fallback table creation...")
        
        try:
            await create_tables_fallback()
            logger.info("Database initialization completed using fallback method")
        except Exception as fallback_error:
            logger.error(f"Fallback initialization also failed: {fallback_error}")
            raise


async def check_and_initialize_database():
    """Check database state and initialize if needed."""
    try:
        # Use sync engine for all database checks to avoid async/sync conflicts
        sync_engine = create_engine(settings.database_url_sync)

        # Test if we can connect to the database
        with sync_engine.connect() as conn:
            # Try to query a table to see if database is initialized
            try:
                result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"))
                table_count = result.scalar()

                if table_count == 0:
                    logger.info("Database appears to be empty. Initializing...")
                    needs_init = True
                else:
                    logger.info(f"Database appears to be initialized with {table_count} tables")
                    needs_init = False

            except (OperationalError, ProgrammingError) as e:
                logger.info(f"Database structure check failed ({e}). Initializing...")
                needs_init = True

        # Check if migrations need to be run
        current_rev = get_current_revision()
        head_rev = get_head_revision()

        if current_rev != head_rev:
            logger.info("Database needs migration updates...")
            run_migrations()
        elif needs_init:
            await initialize_database()

    except Exception as e:
        logger.error(f"Database initialization check failed: {e}")
        raise


if __name__ == "__main__":
    # Allow running this module directly for testing
    asyncio.run(initialize_database())
