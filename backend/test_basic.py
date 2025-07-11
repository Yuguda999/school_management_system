#!/usr/bin/env python3
"""
Basic test to verify the FastAPI application starts correctly
"""
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
    from app.core.config import settings
    print("✅ FastAPI application imported successfully")
    print(f"✅ App name: {settings.app_name}")
    print(f"✅ App version: {settings.app_version}")
    print("✅ Basic setup verification passed")
except Exception as e:
    print(f"❌ Error importing application: {e}")
    sys.exit(1)
