"""
Integration tests for Redis persistence with Telegram bot
Following project testing standards with proper isolation and mocking
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
import pickle

from src.services.redis_persistence import RedisPersistence
from src.services.session_service import ValidationSessionService


@pytest.fixture
def mock_redis_client():
    """Create a comprehensive mock Redis client for integration testing."""
    client = AsyncMock()
    client.ping.return_value = True
    client.setex = AsyncMock()
    client.get = AsyncMock()
    client.delete = AsyncMock()
    client.keys = AsyncMock(return_value=[])
    client.close = AsyncMock()
    return client


@pytest.fixture
def redis_persistence(mock_redis_client):
    """Create Redis persistence with mocked client."""
    with patch('redis.asyncio.from_url', return_value=mock_redis_client):
        persistence = RedisPersistence(
            redis_url="redis://localhost:6379",
            key_prefix="test_telegram_bot:"
        )
        yield persistence


@pytest.fixture
def session_service():
    """Create session service for testing."""
    return ValidationSessionService()


class TestRedisIntegration:
    """Integration tests for Redis persistence with bot functionality."""
    
    @pytest.mark.asyncio
    async def test_full_session_lifecycle(self, redis_persistence, session_service, mock_redis_client):
        """Test complete session lifecycle with Redis persistence."""
        # Mock the session service's Redis persistence
        with patch.object(session_service, 'redis_persistence', redis_persistence):
            await redis_persistence.connect()
            
            # Test 1: Create session
            await session_service.create_session(123, 'test_user', 'deposit_123')
            mock_redis_client.setex.assert_called_once()
            
            # Test 2: Retrieve session
            session_data = {
                'user_id': 123,
                'username': 'test_user',
                'deposit_id': 'deposit_123',
                'status': 'active'
            }
            mock_redis_client.get.return_value = pickle.dumps(session_data)
            retrieved_session = await session_service.get_session(123, 'deposit_123')
            assert retrieved_session == session_data
            assert retrieved_session['user_id'] == 123
            assert retrieved_session['status'] == 'active'
            
            # Test 3: Update session
            await session_service.update_session(123, 'deposit_123', {'status': 'processing'})
            assert mock_redis_client.setex.call_count == 2
            
            # Test 4: Cleanup session
            await session_service.cleanup_session(123, 'deposit_123')
            mock_redis_client.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_multiple_user_sessions(self, redis_persistence, session_service, mock_redis_client):
        """Test handling multiple user sessions simultaneously."""
        with patch.object(session_service, 'redis_persistence', redis_persistence):
            await redis_persistence.connect()
            
            # Create sessions for multiple users
            users = [
                (123, 'user1', 'deposit_1'),
                (456, 'user2', 'deposit_2'),
                (789, 'user3', 'deposit_3')
            ]

            for user_id, username, deposit_id in users:
                await session_service.create_session(user_id, username, deposit_id)
            
            # Verify all sessions were stored
            assert mock_redis_client.setex.call_count == 3
            
            # Test retrieving specific user session
            session_data = {
                'user_id': 456,
                'username': 'user2',
                'deposit_id': 'deposit_2',
                'status': 'active'
            }
            mock_redis_client.get.return_value = pickle.dumps(session_data)
            session = await session_service.get_session(456, 'deposit_2')
            assert session['username'] == 'user2'
            assert session['deposit_id'] == 'deposit_2'
    
    @pytest.mark.asyncio
    async def test_session_timeout_handling(self, redis_persistence, session_service, mock_redis_client):
        """Test session timeout and cleanup handling."""
        with patch.object(session_service, 'redis_persistence', redis_persistence):
            await redis_persistence.connect()
            
            # Simulate session timeout (Redis returns None)
            mock_redis_client.get.return_value = None
            
            # Try to get expired session
            session = await session_service.get_session(123, 'deposit_123')
            assert session is None
            
            # Try to cleanup non-existent session
            result = await session_service.cleanup_session(123, 'deposit_123')
            # cleanup_session returns True even if session doesn't exist (it just deletes the key)
            assert result is True
    
    @pytest.mark.asyncio
    async def test_redis_connection_failure_recovery(self, redis_persistence, mock_redis_client):
        """Test Redis connection failure and recovery."""
        # First connection attempt fails
        mock_redis_client.ping.side_effect = Exception("Connection failed")
        
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            with pytest.raises(Exception, match="Connection failed"):
                await redis_persistence.connect()
        
        # Reset mock for recovery test
        mock_redis_client.ping.side_effect = None
        mock_redis_client.ping.return_value = True
        
        # Second connection attempt succeeds
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            await redis_persistence.connect()
            assert redis_persistence.redis_client is not None
    
    @pytest.mark.asyncio
    async def test_data_serialization_edge_cases(self, redis_persistence, mock_redis_client):
        """Test data serialization with edge cases."""
        await redis_persistence.connect()
        
        # Test with None values
        none_data = {'user_id': 123, 'state': None, 'metadata': None}
        await redis_persistence.set_conversation_data(123, none_data)
        
        # Test with empty dict
        empty_data = {}
        await redis_persistence.set_conversation_data(456, empty_data)
        
        # Test with datetime objects
        datetime_data = {
            'user_id': 789,
            'start_time': datetime.now(),
            'end_time': datetime.now() + timedelta(minutes=5)
        }
        await redis_persistence.set_conversation_data(789, datetime_data)
        
        # Verify all calls were made
        assert mock_redis_client.setex.call_count == 3
    
    @pytest.mark.asyncio
    async def test_concurrent_session_operations(self, redis_persistence, session_service, mock_redis_client):
        """Test concurrent session operations."""
        with patch.object(session_service, 'redis_persistence', redis_persistence):
            await redis_persistence.connect()
            
            # Simulate concurrent operations
            async def create_session(user_id, username):
                await session_service.create_session(user_id, username, f'deposit_{user_id}')
            
            # Create multiple sessions concurrently
            tasks = [
                create_session(123, 'user1'),
                create_session(456, 'user2'),
                create_session(789, 'user3')
            ]
            
            await asyncio.gather(*tasks)
            
            # Verify all sessions were created
            assert mock_redis_client.setex.call_count == 3
    
    @pytest.mark.asyncio
    async def test_redis_key_naming_convention(self, redis_persistence, mock_redis_client):
        """Test Redis key naming follows convention."""
        await redis_persistence.connect()
        
        test_data = {'user_id': 123, 'state': 'WAITING_FOR_AUDIO'}
        await redis_persistence.set_conversation_data(123, test_data)
        
        # Verify key format
        call_args = mock_redis_client.setex.call_args
        key = call_args[0][0]
        assert key == "test_telegram_bot:conversation:depot_conversation:123"
        assert key.startswith("test_telegram_bot:")
        assert "conversation:123" in key
    
    @pytest.mark.asyncio
    async def test_redis_timeout_configuration(self, redis_persistence, mock_redis_client):
        """Test Redis timeout configuration."""
        await redis_persistence.connect()
        
        test_data = {'user_id': 123, 'state': 'WAITING_FOR_AUDIO'}
        await redis_persistence.set_conversation_data(123, test_data)
        
        # Verify timeout is set to 5 minutes (300 seconds)
        call_args = mock_redis_client.setex.call_args
        timeout = call_args[0][1]
        assert timeout == 300  # 5 minutes as per story requirements