import pytest
import os
import sys
from unittest.mock import patch, MagicMock

# Set environment variables before any imports
os.environ.update({
    'DATABASE_URL': 'sqlite:///./test.db',
    'REDIS_URL': 'redis://localhost:6379',
    'SECRET_KEY': 'test-secret-key',
    'ENVIRONMENT': 'test'
})

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

def test_imports():
    """Test that all modules can be imported"""
    try:
        from recyclic_api.core.config import settings
        from recyclic_api.core.database import Base
        from recyclic_api.models.user import User
        from recyclic_api.schemas.user import UserResponse
        assert True
    except ImportError as e:
        pytest.fail(f"Import failed: {e}")

def test_config():
    """Test configuration loading"""
    from recyclic_api.core.config import settings
    assert settings.DATABASE_URL == 'sqlite:///./test.db'
    assert settings.ENVIRONMENT == 'test'

@patch('redis.from_url')
def test_redis_mock(mock_redis_from_url):
    """Test Redis mocking"""
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_redis_from_url.return_value = mock_client
    
    from recyclic_api.core.redis import get_redis
    redis_client = get_redis()
    assert redis_client.ping() == True

def test_pydantic_models():
    """Test Pydantic model configuration"""
    from recyclic_api.schemas.user import UserResponse
    from recyclic_api.models.user import UserRole
    
    # Test that model_config is properly set
    assert hasattr(UserResponse, 'model_config')
    assert UserResponse.model_config.get('from_attributes') == True
