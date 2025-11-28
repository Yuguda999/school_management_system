"""
Script to check and fix the studentstatus enum in the database
"""
import asyncio
import asyncpg


async def check_and_fix_enum():
    # Connect to database
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='zero',
        password='26692669',
        database='school_management_db'
    )
    
    try:
        # Check current enum values
        result = await conn.fetch(
            "SELECT enumlabel FROM pg_enum WHERE enumtypid = "
            "(SELECT oid FROM pg_type WHERE typname = 'studentstatus') "
            "ORDER BY enumsortorder"
        )
        current_values = [row['enumlabel'] for row in result]
        print(f"Current studentstatus enum values: {current_values}")
        
        # Check if 'INACTIVE' (uppercase) exists
        if 'INACTIVE' not in current_values:
            print("'INACTIVE' (uppercase) not found. Adding it now...")
            try:
                await conn.execute(
                    "ALTER TYPE studentstatus ADD VALUE 'INACTIVE'"
                )
                print("✓ Successfully added 'INACTIVE' to studentstatus enum")
                
                # Verify it was added
                result = await conn.fetch(
                    "SELECT enumlabel FROM pg_enum WHERE enumtypid = "
                    "(SELECT oid FROM pg_type WHERE typname = 'studentstatus') "
                    "ORDER BY enumsortorder"
                )
                current_values = [row['enumlabel'] for row in result]
                print(f"Updated studentstatus enum values: {current_values}")
            except Exception as e:
                print(f"✗ Error adding 'INACTIVE': {e}")
        else:
            print("✓ 'INACTIVE' already exists in the enum")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(check_and_fix_enum())
