"""
Test script for the updated assignment generator with number_of_questions parameter
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service_factory import get_ai_service
from app.core.config import settings


async def test_assignment_generator():
    """Test the assignment generator with the new number_of_questions parameter"""
    
    print("=" * 60)
    print("Testing Assignment Generator with Number of Questions")
    print("=" * 60)
    print()
    
    # Get AI service
    print(f"Current AI provider: {settings.ai_provider}")
    print(f"OpenRouter API key configured: {'Yes' if settings.openrouter_api_key else 'No'}")
    print(f"Gemini API key configured: {'Yes' if settings.gemini_api_key else 'No'}")
    print()
    
    try:
        ai_service = get_ai_service()
        print(f"✓ Successfully initialized AI service")
        print(f"  Service type: {type(ai_service).__name__}")
        print(f"  Model: {ai_service.model}")
        print()
    except Exception as e:
        print(f"✗ Failed to initialize AI service: {str(e)}")
        return
    
    # Test parameters
    test_cases = [
        {
            "name": "Math Quiz with 5 Questions",
            "params": {
                "subject": "Mathematics",
                "grade_level": "Grade 8",
                "topic": "Linear Equations",
                "assignment_type": "Quiz",
                "difficulty_level": "Medium",
                "duration": "20 minutes",
                "learning_objectives": "Students will be able to solve linear equations with one variable",
                "number_of_questions": 5
            }
        },
        {
            "name": "Science Worksheet with 10 Problems",
            "params": {
                "subject": "Science",
                "grade_level": "Grade 7",
                "topic": "Photosynthesis",
                "assignment_type": "Worksheet",
                "difficulty_level": "Easy",
                "duration": "30 minutes",
                "learning_objectives": "Understand the process of photosynthesis",
                "number_of_questions": 10
            }
        }
    ]
    
    # Test each case
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'=' * 60}")
        print(f"Test Case {i}: {test_case['name']}")
        print(f"{'=' * 60}")
        print()
        
        params = test_case['params']
        print(f"Parameters:")
        print(f"  Subject: {params['subject']}")
        print(f"  Grade Level: {params['grade_level']}")
        print(f"  Topic: {params['topic']}")
        print(f"  Assignment Type: {params['assignment_type']}")
        print(f"  Number of Questions: {params['number_of_questions']}")
        print()
        
        print("Generating assignment (showing first 10 chunks)...")
        print("-" * 60)
        
        try:
            chunk_count = 0
            async for chunk in ai_service.generate_assignment_stream(**params):
                if chunk_count < 10:
                    print(chunk, end='', flush=True)
                chunk_count += 1
            
            print()
            print("-" * 60)
            print(f"✓ Successfully generated assignment ({chunk_count} chunks total)")
            print()
            
        except Exception as e:
            print()
            print("-" * 60)
            print(f"✗ Error: {str(e)}")
            print()
    
    print("=" * 60)
    print("Assignment Generator Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_assignment_generator())

