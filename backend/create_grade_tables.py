#!/usr/bin/env python3
"""
Script to create grade-related tables in the database
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import sync_engine, Base
from app.models.base import TenantBaseModel
from app.models.grade import Exam, Grade, ReportCard

def create_tables():
    """Create all grade-related tables"""
    try:
        print("Creating grade tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=sync_engine)
        
        print("Grade tables created successfully!")
        print("Tables created:")
        print("- exams")
        print("- grades") 
        print("- report_cards")
        
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1)
