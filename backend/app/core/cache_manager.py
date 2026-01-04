
import functools
import json
import logging
from typing import Optional, Callable, Any
from fastapi import Request
from app.services.redis_service import redis_service
from app.core.config import settings

logger = logging.getLogger(__name__)

def cache_response(expire: int = 300, key_prefix: str = ""):
    """
    Decorator to cache FastAPI route responses in Redis.
    
    Args:
        expire: Expiration time in seconds (default 5 mins)
        key_prefix: Optional prefix for the cache key. 
                    If not provided, uses function name.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # If Redis is not enabled/configured, just run the function
            if not settings.redis_url:
                return await func(*args, **kwargs)

            try:
                # 1. Construct Cache Key
                cacheable_kwargs = {}
                for k, v in kwargs.items():
                    # Filter out standard FastAPI dependencies that we know are objects
                    if k in ['db', 'request', 'response', 'school_context', 'file', 'background_tasks']:
                        continue
                    
                    # Handle User object specifically
                    if k == 'current_user' and hasattr(v, 'id'):
                         cacheable_kwargs['user_id'] = str(v.id)
                         cacheable_kwargs['user_role'] = str(v.role) if hasattr(v, 'role') else 'unknown'
                         continue
                        
                    cacheable_kwargs[k] = str(v)
                
                # Add tenant context (Crucial for multi-tenancy)
                current_school = kwargs.get('current_school') or kwargs.get('school_context')
                if current_school:
                     # Handle both School object and SchoolContext object
                     school_id = getattr(current_school, 'id', None) or getattr(current_school, 'school_id', None)
                     if school_id:
                        cacheable_kwargs['school_id'] = str(school_id)

                # Sort keys for stability
                key_str = json.dumps(cacheable_kwargs, sort_keys=True)
                cache_key = f"cache:{key_prefix or func.__name__}:{key_str}"
                
                # 2. Try Cache Get
                cached_data = await redis_service.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache HIT for {cache_key}")
                    return cached_data

                # 3. Cache Miss - Execute Function
                # logger.debug(f"Cache MISS for {cache_key}")
                result = await func(*args, **kwargs)
                
                # 4. Serialize & Store
                to_cache = result
                # Handle Pydantic models
                if hasattr(result, 'dict'):
                    to_cache = result.dict()
                elif hasattr(result, 'model_dump'): # Pydantic v2
                    to_cache = result.model_dump()
                elif isinstance(result, list):
                    to_cache = [
                        item.dict() if hasattr(item, 'dict') else (item.model_dump() if hasattr(item, 'model_dump') else item)
                        for item in result
                    ]
                
                # Don't cache empty results if it looks like an error or initial state?
                # Actually caching empty lists is fine (it means no data).
                
                await redis_service.set(cache_key, to_cache, expire=expire)
                
                return result

            except Exception as e:
                # Fail open - if caching fails, just run the backend logic
                logger.error(f"CacheManager error: {e}")
                return await func(*args, **kwargs)

        return wrapper
    return decorator

class CacheManager:
    @staticmethod
    async def invalidate_prefix(prefix: str):
        """Invalidate all keys starting with prefix"""
        await redis_service.delete_prefix(f"cache:{prefix}")
