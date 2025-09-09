import redis
from .config import settings

# Create Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis():
    """Get Redis client instance"""
    return redis_client
