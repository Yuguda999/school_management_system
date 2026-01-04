import json
from typing import Optional, Any
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis_url = settings.redis_url
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        """Establish connection to Redis"""
        if not self.redis:
            self.redis = redis.from_url(
                self.redis_url, 
                encoding="utf-8", 
                decode_responses=True
            )
            logger.info(f"Connected to Redis at {self.redis_url}")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        try:
            if not self.redis:
                await self.connect()
            
            value = await self.redis.get(key) # type: ignore
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 300):
        """Set value in Redis with expiration (default 5 mins)"""
        try:
            if not self.redis:
                await self.connect()
            
            await self.redis.set(key, json.dumps(value), ex=expire) # type: ignore
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")

    async def delete(self, key: str):
        """Delete value from Redis"""
        try:
            if not self.redis:
                await self.connect()
            
            await self.redis.delete(key) # type: ignore
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")

    async def delete_prefix(self, prefix: str):
        """Delete all keys matching prefix"""
        try:
            if not self.redis:
                await self.connect()
            
            # Use scan_iter for safe iteration over keys
            # Note: explicit type ignore because redis types can be tricky
            keys = []
            async for key in self.redis.scan_iter(match=f"{prefix}*"): # type: ignore
                keys.append(key)
                
            if keys:
                await self.redis.delete(*keys) # type: ignore
                logger.info(f"Deleted {len(keys)} keys matching prefix {prefix}")
                
        except Exception as e:
            logger.error(f"Redis DELETE PATTERN error for {prefix}: {e}")

    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close() # type: ignore
            self.redis = None

redis_service = RedisService()
