"""
Test script to verify AI service integration
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.services.ai_service_factory import get_ai_service


async def test_ai_service():
    """Test the AI service integration"""
    print(f"Testing AI service integration...")
    print(f"Current AI provider: {settings.ai_provider}")
    print(f"OpenRouter API key configured: {'Yes' if settings.openrouter_api_key else 'No'}")
    print(f"Gemini API key configured: {'Yes' if settings.gemini_api_key else 'No'}")
    print()
    
    try:
        # Get the AI service
        ai_service = get_ai_service()
        print(f"✓ Successfully initialized AI service")
        print(f"  Service type: {type(ai_service).__name__}")
        print(f"  Model: {ai_service.model}")
        print()
        
        # Test lesson plan generation (just a few chunks)
        print("Testing lesson plan generation (streaming first 5 chunks)...")
        chunk_count = 0
        async for chunk in ai_service.generate_lesson_plan_stream(
            subject="Mathematics",
            grade_level="Grade 5",
            topic="Introduction to Fractions",
            duration=45,
            learning_objectives="Students will understand what fractions are and how to identify numerator and denominator."
        ):
            chunk_count += 1
            print(f"  Chunk {chunk_count}: {chunk[:50]}..." if len(chunk) > 50 else f"  Chunk {chunk_count}: {chunk}")
            if chunk_count >= 5:
                print("  (stopping after 5 chunks for testing)")
                break
        
        print()
        print(f"✓ Successfully generated {chunk_count} chunks")
        print()
        print("=" * 60)
        print("AI SERVICE INTEGRATION TEST PASSED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        print()
        print("=" * 60)
        print("AI SERVICE INTEGRATION TEST FAILED!")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(test_ai_service())

