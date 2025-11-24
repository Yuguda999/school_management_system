"""
AI Service Factory for creating AI service instances based on configuration
"""
import logging
from typing import Optional
from app.core.config import settings
from app.services.ai_service_base import AIServiceBase
from app.services.gemini_service import GeminiService
from app.services.openrouter_service import OpenRouterService

logger = logging.getLogger(__name__)

# Singleton instances
_gemini_service: Optional[GeminiService] = None
_openrouter_service: Optional[OpenRouterService] = None


def get_ai_service() -> AIServiceBase:
    """
    Get or create AI service instance based on configuration
    
    Returns:
        AIServiceBase: The configured AI service (Gemini or OpenRouter)
    
    Raises:
        ValueError: If the configured AI provider is not supported
    """
    global _gemini_service, _openrouter_service
    
    provider = settings.ai_provider.lower()
    
    if provider == "gemini":
        if _gemini_service is None:
            logger.info("Initializing Gemini AI service")
            _gemini_service = GeminiService()
        return _gemini_service
    
    elif provider == "openrouter":
        if _openrouter_service is None:
            logger.info("Initializing OpenRouter AI service")
            _openrouter_service = OpenRouterService()
        return _openrouter_service
    
    else:
        raise ValueError(
            f"Unsupported AI provider: {provider}. "
            f"Supported providers: 'gemini', 'openrouter'"
        )


def get_gemini_service() -> GeminiService:
    """
    Get or create Gemini service instance (for backward compatibility)
    
    Returns:
        GeminiService: The Gemini AI service
    """
    global _gemini_service
    if _gemini_service is None:
        logger.info("Initializing Gemini AI service")
        _gemini_service = GeminiService()
    return _gemini_service


def get_openrouter_service() -> OpenRouterService:
    """
    Get or create OpenRouter service instance
    
    Returns:
        OpenRouterService: The OpenRouter AI service
    """
    global _openrouter_service
    if _openrouter_service is None:
        logger.info("Initializing OpenRouter AI service")
        _openrouter_service = OpenRouterService()
    return _openrouter_service

