"""
Test script to verify AI service initialization (without making API calls)
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.services.ai_service_factory import get_ai_service


def test_service_initialization():
    """Test that the AI service can be initialized"""
    print("=" * 60)
    print("AI SERVICE INITIALIZATION TEST")
    print("=" * 60)
    print()
    print(f"Current AI provider: {settings.ai_provider}")
    print(f"OpenRouter API key configured: {'Yes' if settings.openrouter_api_key else 'No'}")
    print(f"Gemini API key configured: {'Yes' if settings.gemini_api_key else 'No'}")
    print()
    
    try:
        # Get the AI service
        ai_service = get_ai_service()
        print(f"✅ Successfully initialized AI service")
        print(f"   Service type: {type(ai_service).__name__}")
        print(f"   Model: {ai_service.model}")
        print()
        
        # Test that all required methods exist
        methods = [
            'generate_lesson_plan_stream',
            'generate_assignment_stream',
            'generate_rubric_stream',
            'upload_file'
        ]
        
        print("Checking required methods:")
        for method in methods:
            if hasattr(ai_service, method):
                print(f"   ✅ {method}")
            else:
                print(f"   ❌ {method} - MISSING!")
                raise Exception(f"Method {method} not found")
        
        print()
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print()
        print("The AI service is properly configured and ready to use.")
        print()
        if settings.ai_provider == "openrouter":
            print("⚠️  NOTE: To use OpenRouter, you need to add credits to your account.")
            print("   Visit: https://openrouter.ai/credits")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
        print("=" * 60)
        print("❌ TEST FAILED!")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    test_service_initialization()

