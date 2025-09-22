"""
Redis Persistence Service for Telegram Bot Sessions
Implements custom persistence backend for ConversationHandler using Redis.
"""

import json
import logging
import pickle
from typing import Any, Dict, Optional, Set
import redis.asyncio as redis
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

class RedisPersistence:
    """
    Custom Redis persistence backend for python-telegram-bot ConversationHandler.
    
    This class provides a Redis-based persistence layer that can survive bot restarts
    and allows conversations to resume from where they left off.
    """
    
    def __init__(self, redis_url: str, key_prefix: str = "telegram_bot:"):
        """
        Initialize Redis persistence.
        
        Args:
            redis_url: Redis connection URL
            key_prefix: Prefix for all Redis keys
        """
        self.redis_url = redis_url
        self.key_prefix = key_prefix
        self.redis_client: Optional[redis.Redis] = None
        
        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds
        
        # Key patterns for different data types
        self.conversation_key = f"{key_prefix}conversation:"
        self.user_data_key = f"{key_prefix}user_data:"
        self.chat_data_key = f"{key_prefix}chat_data:"
        self.bot_data_key = f"{key_prefix}bot_data"
        self.callback_data_key = f"{key_prefix}callback_data:"
    
    async def _retry_operation(self, operation, *args, **kwargs):
        """
        Retry Redis operation with exponential backoff.
        
        Args:
            operation: Async function to retry
            *args: Arguments for the operation
            **kwargs: Keyword arguments for the operation
            
        Returns:
            Result of the operation or None if all retries failed
        """
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return await operation(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2 ** attempt)
                    logger.warning(f"Redis operation failed (attempt {attempt + 1}/{self.max_retries}): {e}. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Redis operation failed after {self.max_retries} attempts: {e}")
        
        return None
        
    async def connect(self):
        """Establish Redis connection."""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=False,  # We need binary data for pickle
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            await self.redis_client.ping()
            logger.info("Redis persistence connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis persistence disconnected")
    
    async def get_conversation(self, name: str, key: tuple) -> Optional[Any]:
        """
        Get conversation state from Redis.
        
        Args:
            name: Conversation handler name
            key: Conversation key (user_id, chat_id)
            
        Returns:
            Conversation state or None if not found
        """
        if not self.redis_client:
            return None
            
        try:
            redis_key = f"{self.conversation_key}{name}:{key[0]}:{key[1]}"
            data = await self.redis_client.get(redis_key)
            
            if data:
                return pickle.loads(data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting conversation {name}:{key}: {e}")
            return None
    
    async def get_conversation_data(self, user_id: int) -> Optional[Any]:
        """Get conversation data for a user."""
        if not self.redis_client:
            logger.warning("Redis client not connected, cannot get conversation data")
            return None
            
        async def _get_data():
            redis_key = f"{self.conversation_key}depot_conversation:{user_id}"
            data = await self.redis_client.get(redis_key)
            
            if data:
                return pickle.loads(data)
            return None
            
        result = await self._retry_operation(_get_data)
        if result is None and self.redis_client:
            logger.warning(f"Failed to get conversation data for user {user_id} after all retries")
        return result
    
    async def update_conversation(self, name: str, key: tuple, state: Any) -> None:
        """
        Update conversation state in Redis.
        
        Args:
            name: Conversation handler name
            key: Conversation key (user_id, chat_id)
            state: New conversation state
        """
        if not self.redis_client:
            return
            
        try:
            redis_key = f"{self.conversation_key}{name}:{key[0]}:{key[1]}"
            data = pickle.dumps(state)
            
            # Store with 1 hour expiration (sessions should not last longer)
            await self.redis_client.setex(redis_key, 3600, data)
            
        except Exception as e:
            logger.error(f"Error updating conversation {name}:{key}: {e}")
    
    async def set_conversation_data(self, user_id: int, data: Any) -> None:
        """Set conversation data for a user."""
        if not self.redis_client:
            logger.warning("Redis client not connected, cannot set conversation data")
            return
            
        async def _set_data():
            redis_key = f"{self.conversation_key}depot_conversation:{user_id}"
            serialized_data = pickle.dumps(data)
            # Store with 5 minutes expiration (as per story requirements)
            await self.redis_client.setex(redis_key, 300, serialized_data)
            logger.debug(f"Successfully set conversation data for user {user_id}")
            
        result = await self._retry_operation(_set_data)
        if result is None:
            logger.error(f"Failed to set conversation data for user {user_id} after all retries")
    
    async def drop_conversation(self, name: str, key: tuple) -> None:
        """
        Remove conversation state from Redis.
        
        Args:
            name: Conversation handler name
            key: Conversation key (user_id, chat_id)
        """
        if not self.redis_client:
            return
            
        try:
            redis_key = f"{self.conversation_key}{name}:{key[0]}:{key[1]}"
            await self.redis_client.delete(redis_key)
            
        except Exception as e:
            logger.error(f"Error dropping conversation {name}:{key}: {e}")
    
    async def delete_conversation_data(self, user_id: int) -> None:
        """Delete conversation data for a user."""
        if not self.redis_client:
            logger.warning("Redis client not connected, cannot delete conversation data")
            return
            
        async def _delete_data():
            redis_key = f"{self.conversation_key}depot_conversation:{user_id}"
            await self.redis_client.delete(redis_key)
            logger.debug(f"Successfully deleted conversation data for user {user_id}")
            
        result = await self._retry_operation(_delete_data)
        if result is None:
            logger.error(f"Failed to delete conversation data for user {user_id} after all retries")
    
    async def get_user_data(self, user_id: int) -> Dict[str, Any]:
        """Get user data from Redis."""
        if not self.redis_client:
            return {}
            
        try:
            redis_key = f"{self.user_data_key}{user_id}"
            data = await self.redis_client.get(redis_key)
            
            if data:
                return pickle.loads(data)
            return {}
            
        except Exception as e:
            logger.error(f"Error getting user data for {user_id}: {e}")
            return {}
    
    async def update_user_data(self, user_id: int, data: Dict[str, Any]) -> None:
        """Update user data in Redis."""
        if not self.redis_client:
            return
            
        try:
            redis_key = f"{self.user_data_key}{user_id}"
            serialized_data = pickle.dumps(data)
            
            # Store with 24 hours expiration
            await self.redis_client.setex(redis_key, 86400, serialized_data)
            
        except Exception as e:
            logger.error(f"Error updating user data for {user_id}: {e}")
    
    async def get_chat_data(self, chat_id: int) -> Dict[str, Any]:
        """Get chat data from Redis."""
        if not self.redis_client:
            return {}
            
        try:
            redis_key = f"{self.chat_data_key}{chat_id}"
            data = await self.redis_client.get(redis_key)
            
            if data:
                return pickle.loads(data)
            return {}
            
        except Exception as e:
            logger.error(f"Error getting chat data for {chat_id}: {e}")
            return {}
    
    async def update_chat_data(self, chat_id: int, data: Dict[str, Any]) -> None:
        """Update chat data in Redis."""
        if not self.redis_client:
            return
            
        try:
            redis_key = f"{self.chat_data_key}{chat_id}"
            serialized_data = pickle.dumps(data)
            
            # Store with 24 hours expiration
            await self.redis_client.setex(redis_key, 86400, serialized_data)
            
        except Exception as e:
            logger.error(f"Error updating chat data for {chat_id}: {e}")
    
    async def get_bot_data(self) -> Dict[str, Any]:
        """Get bot data from Redis."""
        if not self.redis_client:
            return {}
            
        try:
            data = await self.redis_client.get(self.bot_data_key)
            
            if data:
                return pickle.loads(data)
            return {}
            
        except Exception as e:
            logger.error(f"Error getting bot data: {e}")
            return {}
    
    async def update_bot_data(self, data: Dict[str, Any]) -> None:
        """Update bot data in Redis."""
        if not self.redis_client:
            return
            
        try:
            serialized_data = pickle.dumps(data)
            
            # Store with 24 hours expiration
            await self.redis_client.setex(self.bot_data_key, 86400, serialized_data)
            
        except Exception as e:
            logger.error(f"Error updating bot data: {e}")
    
    async def get_callback_data(self, callback_data: str) -> Optional[Dict[str, Any]]:
        """
        Get callback data from Redis.
        
        Args:
            callback_data: Callback data string
            
        Returns:
            Callback data dictionary or None if not found
        """
        if not self.redis_client:
            return None
            
        try:
            redis_key = f"{self.callback_data_key}{callback_data}"
            data = await self.redis_client.get(redis_key)
            
            if data:
                return pickle.loads(data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting callback data for {callback_data}: {e}")
            return None
    
    async def update_callback_data(self, callback_data: str, data: Dict[str, Any]) -> None:
        """
        Update callback data in Redis.
        
        Args:
            callback_data: Callback data string
            data: Data to store
        """
        if not self.redis_client:
            return
            
        try:
            redis_key = f"{self.callback_data_key}{callback_data}"
            serialized_data = pickle.dumps(data)
            
            # Store with 1 hour expiration (validation sessions should not last longer)
            await self.redis_client.setex(redis_key, 3600, serialized_data)
            
        except Exception as e:
            logger.error(f"Error updating callback data for {callback_data}: {e}")
    
    async def drop_callback_data(self, callback_data: str) -> None:
        """
        Remove callback data from Redis.
        
        Args:
            callback_data: Callback data string
        """
        if not self.redis_client:
            return
            
        try:
            redis_key = f"{self.callback_data_key}{callback_data}"
            await self.redis_client.delete(redis_key)
            
        except Exception as e:
            logger.error(f"Error dropping callback data for {callback_data}: {e}")
    
    async def get_all_conversations(self, name: str) -> Set[tuple]:
        """
        Get all conversation keys for a given conversation handler.
        
        Args:
            name: Conversation handler name
            
        Returns:
            Set of conversation keys
        """
        if not self.redis_client:
            return set()
            
        try:
            pattern = f"{self.conversation_key}{name}:*"
            keys = await self.redis_client.keys(pattern)
            
            conversations = set()
            for key in keys:
                # Extract user_id and chat_id from key
                key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                parts = key_str.split(':')
                if len(parts) >= 4:
                    user_id = int(parts[2])
                    chat_id = int(parts[3])
                    conversations.add((user_id, chat_id))
            
            return conversations
            
        except Exception as e:
            logger.error(f"Error getting all conversations for {name}: {e}")
            return set()
    
    async def cleanup_expired_sessions(self) -> int:
        """
        Clean up expired sessions from Redis.
        
        Returns:
            Number of sessions cleaned up
        """
        if not self.redis_client:
            return 0
            
        try:
            # Get all conversation keys
            pattern = f"{self.conversation_key}*"
            keys = await self.redis_client.keys(pattern)
            
            cleaned = 0
            for key in keys:
                ttl = await self.redis_client.ttl(key)
                if ttl == -1:  # No expiration set, set one
                    await self.redis_client.expire(key, 3600)
                elif ttl == -2:  # Key doesn't exist
                    cleaned += 1
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            return 0
