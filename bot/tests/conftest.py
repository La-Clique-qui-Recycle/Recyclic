"""
Test configuration and fixtures for bot tests
Provides environment setup and common test utilities
"""

import os
import pytest
from unittest.mock import patch, MagicMock

# Set test environment variables before importing any modules
os.environ.update({
    'DATABASE_URL': 'sqlite:///test.db',
    'REDIS_URL': 'redis://localhost:6379/1',  # Use database 1 for tests
    'TELEGRAM_BOT_TOKEN': 'test_token_123456789',
    'API_BASE_URL': 'http://test-api:8000',
    'FRONTEND_URL': 'http://test-frontend:4444',
    'ADMIN_TELEGRAM_IDS': '123456789,987654321'
})

@pytest.fixture(scope="session")
def test_env():
    """Provide test environment configuration."""
    return {
        'DATABASE_URL': os.environ['DATABASE_URL'],
        'REDIS_URL': os.environ['REDIS_URL'],
        'TELEGRAM_BOT_TOKEN': os.environ['TELEGRAM_BOT_TOKEN'],
        'API_BASE_URL': os.environ['API_BASE_URL'],
        'FRONTEND_URL': os.environ['FRONTEND_URL'],
        'ADMIN_TELEGRAM_IDS': os.environ['ADMIN_TELEGRAM_IDS']
    }

@pytest.fixture
def mock_redis_client():
    """Create a mock Redis client for testing."""
    client = MagicMock()
    client.ping.return_value = True
    client.setex = MagicMock()
    client.get = MagicMock()
    client.delete = MagicMock()
    client.keys = MagicMock(return_value=[])
    client.close = MagicMock()
    client.scan_iter = MagicMock(return_value=iter([]))
    return client

@pytest.fixture
def mock_telegram_update():
    """Create a mock Telegram Update for testing."""
    update = MagicMock()
    update.effective_user.id = 123456789
    update.effective_user.username = "test_user"
    update.effective_user.first_name = "Test"
    update.effective_chat.id = 123456789
    update.message = MagicMock()
    return update

@pytest.fixture
def mock_telegram_context():
    """Create a mock Telegram Context for testing."""
    context = MagicMock()
    context.bot = MagicMock()
    context.user_data = {}
    context.chat_data = {}
    context.bot_data = {}
    return context