"""
Session Service for Telegram Bot Validation Sessions
Manages validation sessions using Redis for persistence and scalability.
"""

import asyncio
import logging
import pickle
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import json

from .redis_persistence import RedisPersistence
from ..config import settings

logger = logging.getLogger(__name__)

class ValidationSessionService:
    """
    Service for managing validation sessions using Redis.
    
    This service replaces the in-memory session storage with Redis-based
    persistence, allowing sessions to survive bot restarts and scale across
    multiple bot instances.
    """
    
    def __init__(self):
        """Initialize the session service."""
        self.redis_persistence = RedisPersistence(
            redis_url=settings.REDIS_URL,
            key_prefix="validation_session:"
        )
        self._connected = False
    
    async def connect(self):
        """Connect to Redis."""
        if not self._connected:
            await self.redis_persistence.connect()
            self._connected = True
            logger.info("Validation session service connected to Redis")
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self._connected:
            await self.redis_persistence.disconnect()
            self._connected = False
            logger.info("Validation session service disconnected from Redis")
    
    async def create_session(self, user_id: int, username: str, deposit_id: str) -> Dict[str, Any]:
        """
        Create a new validation session.
        
        Args:
            user_id: Telegram user ID
            username: Telegram username
            deposit_id: ID of the deposit being validated
            
        Returns:
            Session data dictionary
        """
        await self.connect()
        
        session_data = {
            'user_id': user_id,
            'username': username,
            'deposit_id': deposit_id,
            'start_time': datetime.now().isoformat(),
            'status': 'active',
            'timeout_task_id': None
        }
        
        # Store session in Redis using the correct method
        key = self._get_session_key(user_id, deposit_id)
        await self.redis_persistence.redis_client.setex(key, 300, pickle.dumps(session_data))
        
        logger.info(f"Created validation session for user {username} ({user_id}) with deposit {deposit_id}")
        return session_data
    
    async def get_session(self, user_id: int, deposit_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an active validation session.
        
        Args:
            user_id: Telegram user ID
            deposit_id: ID of the deposit being validated
            
        Returns:
            Session data dictionary or None if not found
        """
        await self.connect()
        
        key = self._get_session_key(user_id, deposit_id)
        data = await self.redis_persistence.redis_client.get(key)
        if data:
            session_data = pickle.loads(data)
        else:
            session_data = None
        
        if session_data and session_data.get('status') == 'active':
            return session_data
        
        return None
    
    async def update_session(self, user_id: int, deposit_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update an existing validation session.
        
        Args:
            user_id: Telegram user ID
            deposit_id: ID of the deposit being validated
            updates: Dictionary of fields to update
            
        Returns:
            True if session was updated, False otherwise
        """
        await self.connect()
        
        session_data = await self.get_session(user_id, deposit_id)
        if not session_data:
            return False
        
        # Update session data
        session_data.update(updates)
        session_data['last_updated'] = datetime.now().isoformat()
        
        # Store updated session in Redis
        key = self._get_session_key(user_id, deposit_id)
        await self.redis_persistence.redis_client.setex(key, 300, pickle.dumps(session_data))
        
        logger.info(f"Updated validation session for user {user_id} with deposit {deposit_id}")
        return True
    
    async def complete_session(self, user_id: int, deposit_id: str, final_status: str = 'completed') -> bool:
        """
        Mark a validation session as completed.
        
        Args:
            user_id: Telegram user ID
            deposit_id: ID of the deposit being validated
            final_status: Final status of the session
            
        Returns:
            True if session was completed, False otherwise
        """
        await self.connect()
        
        session_data = await self.get_session(user_id, deposit_id)
        if not session_data:
            return False
        
        # Update session status
        session_data['status'] = final_status
        session_data['completed_at'] = datetime.now().isoformat()
        
        # Store updated session in Redis
        key = self._get_session_key(user_id, deposit_id)
        await self.redis_persistence.redis_client.setex(key, 300, pickle.dumps(session_data))
        
        logger.info(f"Completed validation session for user {user_id} with deposit {deposit_id}")
        return True
    
    async def cancel_session(self, user_id: int, deposit_id: str) -> bool:
        """
        Cancel an active validation session.
        
        Args:
            user_id: Telegram user ID
            deposit_id: ID of the deposit being validated
            
        Returns:
            True if session was cancelled, False otherwise
        """
        await self.connect()
        
        session_data = await self.get_session(user_id, deposit_id)
        if not session_data:
            return False
        
        # Update session status
        session_data['status'] = 'cancelled'
        session_data['cancelled_at'] = datetime.now().isoformat()
        
        # Store updated session in Redis
        key = self._get_session_key(user_id, deposit_id)
        await self.redis_persistence.redis_client.setex(key, 300, pickle.dumps(session_data))
        
        logger.info(f"Cancelled validation session for user {user_id} with deposit {deposit_id}")
        return True
    
    async def cleanup_session(self, user_id: int, deposit_id: str) -> bool:
        """
        Remove a validation session from Redis.
        
        Args:
            user_id: Telegram user ID
            deposit_id: ID of the deposit being validated
            
        Returns:
            True if session was cleaned up, False otherwise
        """
        await self.connect()
        
        key = self._get_session_key(user_id, deposit_id)
        if self.redis_persistence.redis_client:
            await self.redis_persistence.redis_client.delete(key)
            logger.info(f"Cleaned up validation session for user {user_id} with deposit {deposit_id}")
            return True
        else:
            logger.warning("Redis client not connected. Cannot clean up session.")
            return False
    
    async def get_user_active_sessions(self, user_id: int) -> list[Dict[str, Any]]:
        """
        Get all active validation sessions for a user.
        
        Args:
            user_id: Telegram user ID
            
        Returns:
            List of active session data dictionaries
        """
        await self.connect()
        
        if not self.redis_persistence.redis_client:
            logger.warning("Redis client not connected. Cannot get active sessions.")
            return []
        
        # Get all session keys for this user
        pattern = f"validation_session:user:{user_id}:deposit:*"
        try:
            keys = []
            async for key in self.redis_persistence.redis_client.scan_iter(match=pattern):
                keys.append(key)
            
            active_sessions = []
            for key in keys:
                session_data = await self.redis_persistence._get_data(key)
                if session_data and session_data.get('status') == 'active':
                    active_sessions.append(session_data)
            
            return active_sessions
            
        except Exception as e:
            logger.error(f"Error getting active sessions for user {user_id}: {e}")
            return []
    
    async def cleanup_expired_sessions(self) -> int:
        """
        Clean up expired validation sessions.
        
        Returns:
            Number of sessions cleaned up
        """
        await self.connect()
        
        try:
            # Get all session keys
            pattern = "validation_session:callback_data:session_*"
            keys = await self.redis_persistence.redis_client.keys(pattern)
            
            cleaned = 0
            current_time = datetime.now()
            
            for key in keys:
                key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                
                # Get session data
                session_data = await self.redis_persistence.redis_client.get(key)
                if session_data:
                    try:
                        data = json.loads(session_data.decode('utf-8'))
                        start_time = datetime.fromisoformat(data.get('start_time', ''))
                        
                        # Check if session is older than 1 hour
                        if current_time - start_time > timedelta(hours=1):
                            await self.redis_persistence.redis_client.delete(key)
                            cleaned += 1
                            
                    except (json.JSONDecodeError, ValueError) as e:
                        logger.warning(f"Error parsing session data for key {key_str}: {e}")
                        # Delete corrupted session data
                        await self.redis_persistence.redis_client.delete(key)
                        cleaned += 1
            
            if cleaned > 0:
                logger.info(f"Cleaned up {cleaned} expired validation sessions")
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            return 0
    
    def _get_session_key(self, user_id: int, deposit_id: str) -> str:
        """Helper to generate a unique key for a session."""
        return f"{self.redis_persistence.key_prefix}user:{user_id}:deposit:{deposit_id}"

# Global session service instance
session_service = ValidationSessionService()
