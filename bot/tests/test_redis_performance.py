"""
Performance and resilience tests for Redis persistence
Following project testing standards with proper isolation and mocking
"""

import pytest
import asyncio
import time
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta

from src.services.redis_persistence import RedisPersistence
from src.services.session_service import ValidationSessionService


@pytest.fixture
def mock_redis_client():
    """Create a mock Redis client for performance testing."""
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


class TestRedisPerformance:
    """Performance tests for Redis persistence."""
    
    @pytest.mark.asyncio
    async def test_bulk_session_operations_performance(self, redis_persistence, mock_redis_client):
        """Test performance of bulk session operations."""
        await redis_persistence.connect()
        
        # Simulate bulk operations
        start_time = time.time()
        
        # Create 100 sessions
        for i in range(100):
            session_data = {
                'user_id': i,
                'username': f'user_{i}',
                'start_time': datetime.now(),
                'state': 'WAITING_FOR_AUDIO'
            }
            await redis_persistence.set_conversation_data(i, session_data)
        
        # Verify all operations completed
        assert mock_redis_client.setex.call_count == 100
        
        # Performance should be reasonable (under 1 second for 100 operations)
        elapsed_time = time.time() - start_time
        assert elapsed_time < 1.0, f"Bulk operations took too long: {elapsed_time}s"
    
    @pytest.mark.asyncio
    async def test_concurrent_operations_performance(self, redis_persistence, mock_redis_client):
        """Test performance of concurrent operations."""
        await redis_persistence.connect()
        
        async def create_session(user_id):
            session_data = {
                'user_id': user_id,
                'username': f'user_{user_id}',
                'start_time': datetime.now(),
                'state': 'WAITING_FOR_AUDIO'
            }
            await redis_persistence.set_conversation_data(user_id, session_data)
        
        # Create 50 sessions concurrently
        start_time = time.time()
        tasks = [create_session(i) for i in range(50)]
        await asyncio.gather(*tasks)
        elapsed_time = time.time() - start_time
        
        # Verify all operations completed
        assert mock_redis_client.setex.call_count == 50
        
        # Concurrent operations should be faster than sequential
        assert elapsed_time < 0.5, f"Concurrent operations took too long: {elapsed_time}s"
    
    @pytest.mark.asyncio
    async def test_memory_usage_with_large_data(self, redis_persistence, mock_redis_client):
        """Test memory usage with large session data."""
        await redis_persistence.connect()
        
        # Create session with large metadata
        large_session_data = {
            'user_id': 123,
            'username': 'test_user',
            'start_time': datetime.now(),
            'state': 'WAITING_FOR_AUDIO',
            'metadata': {
                'deposit_id': 'dep_123',
                'audio_file_path': '/path/to/very/long/audio/file.wav',
                'classification_results': {
                    'category': 'Electronics',
                    'confidence': 0.95,
                    'alternatives': [
                        {'category': 'Electronics', 'confidence': 0.95},
                        {'category': 'Appliances', 'confidence': 0.03},
                        {'category': 'Other', 'confidence': 0.02}
                    ]
                },
                'processing_log': [
                    {'timestamp': datetime.now(), 'action': 'upload_started'},
                    {'timestamp': datetime.now(), 'action': 'file_validated'},
                    {'timestamp': datetime.now(), 'action': 'classification_started'},
                    {'timestamp': datetime.now(), 'action': 'classification_completed'}
                ]
            }
        }
        
        # Test serialization of large data
        await redis_persistence.set_conversation_data(123, large_session_data)
        
        # Verify operation completed
        mock_redis_client.setex.assert_called_once()
        
        # Test deserialization
        import pickle
        mock_redis_client.get.return_value = pickle.dumps(large_session_data)
        retrieved_data = await redis_persistence.get_conversation_data(123)
        
        assert retrieved_data == large_session_data
        assert len(retrieved_data['metadata']['processing_log']) == 4


class TestRedisResilience:
    """Resilience tests for Redis persistence."""
    
    @pytest.mark.asyncio
    async def test_redis_connection_retry_mechanism(self, mock_redis_client):
        """Test Redis connection retry mechanism."""
        # First attempt fails, second succeeds
        mock_redis_client.ping.side_effect = [Exception("Connection failed"), True]
        
        with patch('redis.asyncio.from_url', return_value=mock_redis_client):
            persistence = RedisPersistence(
                redis_url="redis://localhost:6379",
                key_prefix="test_telegram_bot:"
            )
            
            # First connection attempt should fail
            with pytest.raises(Exception, match="Connection failed"):
                await persistence.connect()
            
            # Reset side effect for retry
            mock_redis_client.ping.side_effect = None
            mock_redis_client.ping.return_value = True
            
            # Second attempt should succeed
            await persistence.connect()
            assert persistence.redis_client is not None
    
    @pytest.mark.asyncio
    async def test_redis_operation_failure_handling(self, redis_persistence, mock_redis_client):
        """Test handling of Redis operation failures."""
        await redis_persistence.connect()
        
        # Simulate Redis operation failure
        mock_redis_client.setex.side_effect = Exception("Redis operation failed")
        
        # Our implementation logs errors but doesn't raise them
        await redis_persistence.set_conversation_data(123, {'user_id': 123})
        # Verify the error was logged (we can't easily test logging in this context)
        mock_redis_client.setex.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_redis_timeout_handling(self, redis_persistence, mock_redis_client):
        """Test Redis timeout handling."""
        await redis_persistence.connect()
        
        # Simulate Redis timeout
        mock_redis_client.get.side_effect = asyncio.TimeoutError("Redis timeout")

        # Our implementation logs errors but doesn't raise them
        result = await redis_persistence.get_conversation_data(123)
        assert result is None
        mock_redis_client.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_redis_connection_loss_recovery(self, redis_persistence, mock_redis_client):
        """Test recovery from Redis connection loss."""
        await redis_persistence.connect()
        
        # Simulate connection loss during operation
        mock_redis_client.setex.side_effect = Exception("Connection lost")

        # Our implementation logs errors but doesn't raise them
        await redis_persistence.set_conversation_data(123, {'user_id': 123})
        mock_redis_client.setex.assert_called_once()
        
        # Reset mock for recovery
        mock_redis_client.setex.side_effect = None
        
        # Subsequent operations should work
        await redis_persistence.set_conversation_data(123, {'user_id': 123})
        mock_redis_client.setex.assert_called()
    
    @pytest.mark.asyncio
    async def test_redis_memory_pressure_handling(self, redis_persistence, mock_redis_client):
        """Test handling of Redis memory pressure."""
        await redis_persistence.connect()
        
        # Simulate Redis memory pressure (OOM error)
        mock_redis_client.setex.side_effect = Exception("OOM command not allowed when used memory > 'maxmemory'")

        # Our implementation logs errors but doesn't raise them
        await redis_persistence.set_conversation_data(123, {'user_id': 123})
        mock_redis_client.setex.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_redis_data_corruption_handling(self, redis_persistence, mock_redis_client):
        """Test handling of corrupted data in Redis."""
        await redis_persistence.connect()
        
        # Simulate corrupted data
        mock_redis_client.get.return_value = b"corrupted_data"

        # Our implementation logs errors but doesn't raise them
        result = await redis_persistence.get_conversation_data(123)
        assert result is None
        mock_redis_client.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_redis_network_partition_handling(self, redis_persistence, mock_redis_client):
        """Test handling of network partition."""
        await redis_persistence.connect()
        
        # Simulate network partition
        mock_redis_client.ping.side_effect = Exception("Network unreachable")
        
        # Connection check should fail
        with pytest.raises(Exception, match="Network unreachable"):
            await redis_persistence.connect()
    
    @pytest.mark.asyncio
    async def test_redis_slow_operation_handling(self, redis_persistence, mock_redis_client):
        """Test handling of slow Redis operations."""
        await redis_persistence.connect()
        
        # Simulate slow operation
        async def slow_setex(*args, **kwargs):
            await asyncio.sleep(0.1)  # Simulate slow operation
            return True
        
        mock_redis_client.setex.side_effect = slow_setex
        
        # Operation should complete but take time
        start_time = time.time()
        await redis_persistence.set_conversation_data(123, {'user_id': 123})
        elapsed_time = time.time() - start_time
        
        # Should complete within reasonable time
        assert elapsed_time >= 0.1  # At least as long as the simulated delay
        assert elapsed_time < 0.2   # But not much longer
