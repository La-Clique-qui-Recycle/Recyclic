"""
Tests for Redis persistence service
Following project testing standards with proper isolation and mocking
"""

import pytest
import asyncio
import pickle
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta

from src.services.redis_persistence import RedisPersistence
from src.services.session_service import ValidationSessionService


@pytest.fixture
def redis_persistence():
    """Create Redis persistence instance for testing."""
    return RedisPersistence(
        redis_url="redis://localhost:6379",
        key_prefix="test_telegram_bot:"
    )


@pytest.fixture
def session_service():
    """Create session service instance for testing."""
    return ValidationSessionService()


@pytest.fixture
def mock_redis_client():
    """Create a mock Redis client for testing."""
    client = AsyncMock()
    client.ping.return_value = True
    client.setex = AsyncMock()
    client.get = AsyncMock()
    client.delete = AsyncMock()
    client.keys = AsyncMock(return_value=[])
    client.close = AsyncMock()
    return client


class TestRedisPersistence:
    """Test class for Redis persistence functionality."""
    
    @pytest.mark.asyncio
    async def test_redis_connection_success(self, redis_persistence, mock_redis_client):
        """Test successful Redis connection and disconnection."""
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            # Test connection
            await redis_persistence.connect()
            assert redis_persistence.redis_client is not None
            mock_redis_client.ping.assert_called_once()
            
            # Test disconnection
            await redis_persistence.disconnect()
            mock_redis_client.close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_redis_connection_failure(self, redis_persistence):
        """Test Redis connection failure handling."""
        mock_redis_client = AsyncMock()
        mock_redis_client.ping.side_effect = Exception("Connection failed")
        
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            with pytest.raises(Exception, match="Connection failed"):
                await redis_persistence.connect()
    
    @pytest.mark.asyncio
    async def test_set_conversation_data(self, redis_persistence, mock_redis_client):
        """Test setting conversation data in Redis."""
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            await redis_persistence.connect()
            
            test_data = {"user_id": 123, "state": "WAITING_FOR_AUDIO"}
            await redis_persistence.set_conversation_data(123, test_data)
            
            # Verify setex was called with correct parameters
            mock_redis_client.setex.assert_called_once()
            call_args = mock_redis_client.setex.call_args
            assert "test_telegram_bot:conversation:depot_conversation:123" in call_args[0]
            assert call_args[0][1] == 300  # 5 minutes timeout
    
    @pytest.mark.asyncio
    async def test_get_conversation_data_success(self, redis_persistence, mock_redis_client):
        """Test successful retrieval of conversation data."""
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            await redis_persistence.connect()
            
            test_data = {"user_id": 123, "state": "WAITING_FOR_AUDIO"}
            mock_redis_client.get.return_value = pickle.dumps(test_data)
            
            result = await redis_persistence.get_conversation_data(123)
            assert result == test_data
            mock_redis_client.get.assert_called_once_with("test_telegram_bot:conversation:depot_conversation:123")
    
    @pytest.mark.asyncio
    async def test_get_conversation_data_not_found(self, redis_persistence, mock_redis_client):
        """Test retrieval when conversation data doesn't exist."""
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            await redis_persistence.connect()
            
            mock_redis_client.get.return_value = None
            
            result = await redis_persistence.get_conversation_data(123)
            assert result is None
    
    @pytest.mark.asyncio
    async def test_delete_conversation_data(self, redis_persistence, mock_redis_client):
        """Test deletion of conversation data."""
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            await redis_persistence.connect()
            
            await redis_persistence.delete_conversation_data(123)
            mock_redis_client.delete.assert_called_once_with("test_telegram_bot:conversation:depot_conversation:123")
    
    @pytest.mark.asyncio
    async def test_serialization_complex_data(self, redis_persistence, mock_redis_client):
        """Test serialization and deserialization of complex data structures."""
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            await redis_persistence.connect()
            
            # Test complex data structure
            complex_data = {
                'user_id': 123,
                'state': 'WAITING_FOR_AUDIO',
                'metadata': {
                    'deposit_id': 'dep_123',
                    'timestamp': datetime.now(),
                    'nested': {'value': 42}
                }
            }
            
            # Test serialization
            await redis_persistence.set_conversation_data(123, complex_data)
            
            # Test deserialization
            mock_redis_client.get.return_value = pickle.dumps(complex_data)
            result = await redis_persistence.get_conversation_data(123)
            assert result == complex_data
            assert result['metadata']['nested']['value'] == 42


class TestValidationSessionService:
    """Test class for validation session service functionality."""
    
    @pytest.mark.asyncio
    async def test_create_session(self, session_service):
        """Test creating a validation session."""
        with patch.object(session_service, 'redis_persistence') as mock_persistence:
            mock_persistence.connect = AsyncMock()
            mock_persistence.redis_client = AsyncMock()
            mock_persistence.redis_client.setex = AsyncMock()

            result = await session_service.create_session(123, 'test_user', 'deposit_123')
            
            # Verify the session data structure
            assert result['user_id'] == 123
            assert result['username'] == 'test_user'
            assert result['deposit_id'] == 'deposit_123'
            assert result['status'] == 'active'
            assert 'start_time' in result
            
            # Verify setex was called
            mock_persistence.redis_client.setex.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_session_success(self, session_service):
        """Test successful session retrieval."""
        with patch.object(session_service, 'redis_persistence') as mock_persistence:
            mock_persistence.connect = AsyncMock()
            session_data = {
                'user_id': 123,
                'username': 'test_user',
                'start_time': datetime.now().isoformat(),
                'status': 'active',
                'deposit_id': 'deposit_123'
            }
            mock_persistence.redis_client = AsyncMock()
            mock_persistence.redis_client.get = AsyncMock(return_value=pickle.dumps(session_data))

            result = await session_service.get_session(123, 'deposit_123')
            assert result == session_data
            mock_persistence.redis_client.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_session_not_found(self, session_service):
        """Test session retrieval when session doesn't exist."""
        with patch.object(session_service, 'redis_persistence') as mock_persistence:
            mock_persistence.connect = AsyncMock()
            mock_persistence.redis_client = AsyncMock()
            mock_persistence.redis_client.get = AsyncMock(return_value=None)
            
            result = await session_service.get_session(123, 'deposit_123')
            assert result is None
    
    @pytest.mark.asyncio
    async def test_cleanup_session(self, session_service):
        """Test session cleanup."""
        with patch.object(session_service, 'redis_persistence') as mock_persistence:       
            mock_persistence.connect = AsyncMock()
            mock_persistence.redis_client = AsyncMock()
            mock_persistence.redis_client.delete = AsyncMock()

            result = await session_service.cleanup_session(123, "deposit_123")
            assert result is True
            mock_persistence.redis_client.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_active_sessions(self, session_service):
        """Test getting user active sessions."""
        with patch.object(session_service, 'redis_persistence') as mock_persistence:       
            mock_persistence.connect = AsyncMock()
            mock_persistence.redis_client = AsyncMock()
            
            # Create an async generator for scan_iter
            async def mock_scan_iter(match):
                keys = [
                    b"validation_session:user:123:deposit:dep_1",
                    b"validation_session:user:123:deposit:dep_2"
                ]
                for key in keys:
                    yield key
            
            mock_persistence.redis_client.scan_iter = mock_scan_iter
            mock_persistence._get_data = AsyncMock(side_effect=[
                {'user_id': 123, 'username': 'user1', 'deposit_id': 'dep_1', 'status': 'active'},
                {'user_id': 123, 'username': 'user1', 'deposit_id': 'dep_2', 'status': 'active'}
            ])

            result = await session_service.get_user_active_sessions(123)
            assert result is not None
            assert len(result) == 2
            assert result[0]['user_id'] == 123
    
    @pytest.mark.asyncio
    async def test_session_timeout_cleanup(self, session_service):
        """Test session timeout cleanup."""
        with patch.object(session_service, 'redis_persistence') as mock_persistence:       
            mock_persistence.connect = AsyncMock()
            mock_persistence.redis_client = AsyncMock()
            mock_persistence.redis_client.delete = AsyncMock()

            result = await session_service.cleanup_session(123, "deposit_123")
            assert result is True  # Session cleaned up
            mock_persistence.redis_client.delete.assert_called_once()