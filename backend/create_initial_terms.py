#!/usr/bin/env python3
"""
Script to create initial terms for development/testing
"""

import asyncio
import sys
import os
from datetime import date

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.academic import Term, TermType
from app.models.school import School
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def create_initial_terms():
    """Create initial terms for all schools that don't have any terms"""
    
    async for db in get_db():
        try:
            # Get all schools
            result = await db.execute(select(School).where(School.is_active == True))
            schools = result.scalars().all()
            
            if not schools:
                print("No schools found. Please create a school first.")
                return
            
            for school in schools:
                print(f"\nProcessing school: {school.name}")
                
                # Check if school already has terms
                existing_terms_result = await db.execute(
                    select(Term).where(
                        Term.school_id == school.id,
                        Term.is_deleted == False
                    )
                )
                existing_terms = existing_terms_result.scalars().all()
                
                if existing_terms:
                    print(f"  School already has {len(existing_terms)} terms. Skipping...")
                    continue
                
                # Create initial terms for 2024/2025 academic session
                terms_to_create = [
                    {
                        "name": "First Term",
                        "type": TermType.FIRST_TERM,
                        "academic_session": "2024/2025",
                        "start_date": date(2024, 9, 1),
                        "end_date": date(2024, 12, 15),
                        "is_current": True,  # Set first term as current
                        "is_active": True
                    },
                    {
                        "name": "Second Term",
                        "type": TermType.SECOND_TERM,
                        "academic_session": "2024/2025",
                        "start_date": date(2025, 1, 8),
                        "end_date": date(2025, 4, 4),
                        "is_current": False,
                        "is_active": True
                    },
                    {
                        "name": "Third Term",
                        "type": TermType.THIRD_TERM,
                        "academic_session": "2024/2025",
                        "start_date": date(2025, 4, 22),
                        "end_date": date(2025, 7, 18),
                        "is_current": False,
                        "is_active": True
                    }
                ]
                
                created_terms = []
                for term_data in terms_to_create:
                    term = Term(
                        **term_data,
                        school_id=school.id
                    )
                    db.add(term)
                    created_terms.append(term)
                
                await db.commit()
                
                # Refresh to get IDs
                for term in created_terms:
                    await db.refresh(term)
                
                print(f"  ✓ Created {len(created_terms)} terms:")
                for term in created_terms:
                    status = " (CURRENT)" if term.is_current else ""
                    print(f"    - {term.name} ({term.academic_session}){status}")
                
                # Update school's current session and term
                school.current_session = "2024/2025"
                school.current_term = "First Term"
                await db.commit()
                
                print(f"  ✓ Updated school current session and term")
            
            print(f"\n✅ Initial terms creation completed!")
            
        except Exception as e:
            print(f"❌ Error creating initial terms: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()

async def main():
    """Main function"""
    print("🏫 Creating Initial Terms for Development")
    print("=" * 50)
    print("This script will create initial academic terms for all schools")
    print("that don't already have terms configured.")
    print()
    
    try:
        await create_initial_terms()
        print("\n🎉 Success! You can now use the term management features.")
        print("\nNext steps:")
        print("1. Start the backend server: uvicorn app.main:app --reload")
        print("2. Start the frontend: npm run dev")
        print("3. Login and navigate to Settings > Academic Terms")
        
    except Exception as e:
        print(f"\n❌ Failed to create initial terms: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
