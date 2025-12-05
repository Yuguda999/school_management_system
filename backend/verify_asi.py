import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.asi_service import ASIService
from app.core.config import settings

async def verify_asi_connection():
    print("Verifying ASI Cloud Connection...")
    
    # Check if API key is set
    if not settings.asi_api_key:
        print("ERROR: ASI_API_KEY is not set in environment or config.")
        print("Please set SMS_ASI_API_KEY environment variable.")
        return

    try:
        service = ASIService()
        print(f"Service initialized with model: {service.model}")
        
        print("\nTesting Lesson Plan Generation (Stream)...")
        print("-" * 50)
        
        prompt_chunks = []
        async for chunk in service.generate_lesson_plan_stream(
            subject="History",
            grade_level="Grade 10",
            topic="The Industrial Revolution",
            duration=60,
            learning_objectives="Understand the key causes and effects of the Industrial Revolution."
        ):
            print(chunk, end="", flush=True)
            prompt_chunks.append(chunk)
            
        if not prompt_chunks:
            print("\nERROR: No content generated.")
        else:
            print("\n\nSUCCESS: Lesson plan generated successfully.")

    except Exception as e:
        print(f"\nERROR: Verification failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify_asi_connection())
