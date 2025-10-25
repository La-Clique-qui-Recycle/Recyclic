import pytest
from unittest.mock import patch, AsyncMock, MagicMock

# Set webhook-related environment variables for testing
import os
os.environ['TELEGRAM_WEBHOOK_URL'] = 'https://test.webhook.url/telegram'
os.environ['TELEGRAM_WEBHOOK_SECRET'] = 'test_secret_token'

# Import the server events and app instance after setting env vars
from src.webhook_server import startup_event, shutdown_event, get_telegram_app

@pytest.fixture(autouse=True)
def clear_global_telegram_app():
    """Ensure the global telegram_app is reset before and after each test."""
    # This is crucial because the app is a global singleton
    from src import webhook_server
    webhook_server.telegram_app = None
    yield
    webhook_server.telegram_app = None

@pytest.mark.asyncio
@patch('src.webhook_server.Application.builder')
async def test_webhook_setup_and_teardown(mock_app_builder):
    """
    Test that the webhook is correctly set on startup and deleted on shutdown.
    """
    # --- Arrange ---
    # Create a mock for the bot object and its methods
    mock_bot = AsyncMock()
    
    # Create a mock for the application object
    mock_app = AsyncMock()
    mock_app.bot = mock_bot  # Attach the mocked bot to the application
    
    # Configure the builder chain to return our mock application
    mock_app_builder.return_value.token.return_value.build.return_value = mock_app

    # --- Act: Startup ---
    await startup_event()

    # --- Assert: Startup ---
    # Verify that the Application was built with the correct token
    mock_app_builder.return_value.token.assert_called_with('test_token_123456789')

    # Verify that the webhook was set with the correct URL and secret token
    mock_bot.set_webhook.assert_called_once_with(
        url='https://test.webhook.url/telegram',
        secret_token='test_secret_token'
    )
    
    # Verify the global app is set
    assert get_telegram_app() is not None

    # --- Act: Shutdown ---
    await shutdown_event()

    # --- Assert: Shutdown ---
    # Verify that the webhook was deleted
    mock_bot.delete_webhook.assert_called_once()
    
    # Verify that the application was stopped and shut down
    mock_app.stop.assert_called_once()
    mock_app.shutdown.assert_called_once()

@pytest.mark.asyncio
@patch('src.webhook_server.Application.builder')
async def test_startup_skips_webhook_if_url_not_set(mock_app_builder):
    """
    Test that webhook setup is skipped if the TELEGRAM_WEBHOOK_URL is not set.
    """
    # --- Arrange ---
    # Unset the environment variable for this test
    with patch.dict(os.environ, {'TELEGRAM_WEBHOOK_URL': ''}):
        mock_bot = AsyncMock()
        mock_app = AsyncMock()
        mock_app.bot = mock_bot
        mock_app_builder.return_value.token.return_value.build.return_value = mock_app

        # --- Act ---
        await startup_event()

        # --- Assert ---
        # Verify that set_webhook was NOT called
        mock_bot.set_webhook.assert_not_called()

    # --- Cleanup ---
    await shutdown_event()