import asyncio
import logging
from sqlalchemy import text
from app.core.database import async_engine
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reset_database():
    """
    Drop all tables in the database to allow a fresh migration start.
    """
    logger.info(f"Connecting to database: {settings.database_url}")
    
    async with async_engine.begin() as conn:
        logger.info("Dropping all tables...")
        # Disable foreign key checks to allow dropping tables in any order
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        
    logger.info("Database reset successfully!")

if __name__ == "__main__":
    # Confirm with user
    print("WARNING: This will DELETE ALL DATA in the database.")
    print(f"Target Database: {settings.database_url}")
    confirm = input("Type 'yes' to confirm: ")
    
    if confirm.lower() == 'yes':
        asyncio.run(reset_database())
    else:
        print("Operation cancelled.")
