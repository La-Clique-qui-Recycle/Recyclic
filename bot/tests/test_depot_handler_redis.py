"""
Integration tests for depot handler with Redis persistence.
Tests the /depot command integration with the new Redis-based session management.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from telegram import Update, Message, User, Voice
from telegram.ext import ContextTypes

from src.handlers.depot import (
    start_depot_session,
    handle_voice_message,
    cancel_depot_session,
    WAITING_FOR_AUDIO
)


@pytest.fixture
def mock_update():
    """Create a mock Telegram Update object."""
    update = MagicMock(spec=Update)
    update.effective_user = MagicMock(spec=User)
    update.effective_user.id = 12345
    update.effective_user.username = "testuser"
    update.effective_user.first_name = "Test"

    update.message = MagicMock(spec=Message)
    update.message.reply_text = AsyncMock()

    return update


@pytest.fixture
def mock_context():
    """Create a mock Telegram Context object."""
    context = MagicMock(spec=ContextTypes.DEFAULT_TYPE)
    context.bot = MagicMock()
    context.bot.get_file = AsyncMock()
    context.bot.send_message = AsyncMock()
    return context


class TestDepotHandlerRedisIntegration:
    """Test class for depot handler Redis integration."""

    @pytest.mark.asyncio
    @patch('src.handlers.depot.session_service')
    async def test_start_depot_session_no_existing_sessions(self, mock_session_service, mock_update, mock_context):
        """Test starting a depot session when user has no existing sessions."""
        # Mock session service to return no active sessions
        mock_session_service.get_user_active_sessions = AsyncMock(return_value=[])
        
        result = await start_depot_session(mock_update, mock_context)

        # Check return value
        assert result == WAITING_FOR_AUDIO

        # Check session service was called
        mock_session_service.get_user_active_sessions.assert_called_once_with(12345)

        # Check reply was sent
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Session de dépôt démarrée" in call_args
        assert "5 minutes" in call_args

    @pytest.mark.asyncio
    @patch('src.handlers.depot.session_service')
    async def test_start_depot_session_with_existing_sessions(self, mock_session_service, mock_update, mock_context):
        """Test starting a depot session when user already has active sessions."""
        # Mock session service to return existing sessions
        existing_sessions = [{
            'user_id': 12345,
            'username': 'testuser',
            'deposit_id': 'existing_deposit_123',
            'status': 'active'
        }]
        mock_session_service.get_user_active_sessions = AsyncMock(return_value=existing_sessions)
        
        result = await start_depot_session(mock_update, mock_context)

        # Check return value
        assert result == WAITING_FOR_AUDIO

        # Check session service was called
        mock_session_service.get_user_active_sessions.assert_called_once_with(12345)

        # Check reply mentions existing session
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "session de dépôt active" in call_args

    @pytest.mark.asyncio
    @patch('src.handlers.depot.session_service')
    async def test_cancel_depot_session_with_active_sessions(self, mock_session_service, mock_update, mock_context):
        """Test canceling depot session when user has active sessions."""
        # Mock session service to return active sessions
        active_sessions = [
            {
                'user_id': 12345,
                'username': 'testuser',
                'deposit_id': 'deposit_1',
                'status': 'active'
            },
            {
                'user_id': 12345,
                'username': 'testuser',
                'deposit_id': 'deposit_2',
                'status': 'active'
            }
        ]
        mock_session_service.get_user_active_sessions = AsyncMock(return_value=active_sessions)
        mock_session_service.cancel_session = AsyncMock()
        
        result = await cancel_depot_session(mock_update, mock_context)

        # Check session service was called for each active session
        assert mock_session_service.cancel_session.call_count == 2
        mock_session_service.cancel_session.assert_any_call(12345, 'deposit_1')
        mock_session_service.cancel_session.assert_any_call(12345, 'deposit_2')

        # Check reply was sent
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Session de dépôt annulée" in call_args

    @pytest.mark.asyncio
    @patch('src.handlers.depot.session_service')
    async def test_cancel_depot_session_no_active_sessions(self, mock_session_service, mock_update, mock_context):
        """Test canceling depot session when user has no active sessions."""
        # Mock session service to return no active sessions
        mock_session_service.get_user_active_sessions = AsyncMock(return_value=[])
        
        result = await cancel_depot_session(mock_update, mock_context)

        # Check session service was called
        mock_session_service.get_user_active_sessions.assert_called_once_with(12345)

        # Check reply was sent
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Aucune session de dépôt active" in call_args

    @pytest.mark.asyncio
    @patch('src.handlers.depot.session_service')
    async def test_handle_voice_message_no_active_sessions(self, mock_session_service, mock_update, mock_context):
        """Test handling voice message when user has no active sessions."""
        # Mock session service to return no active sessions
        mock_session_service.get_user_active_sessions = AsyncMock(return_value=[])
        
        mock_update.message.voice = MagicMock(spec=Voice)

        result = await handle_voice_message(mock_update, mock_context)

        # Check session service was called
        mock_session_service.get_user_active_sessions.assert_called_once_with(12345)

        # Check appropriate error message
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Aucune session de dépôt active" in call_args

    @pytest.mark.asyncio
    @patch('src.handlers.depot.session_service')
    @patch('src.handlers.depot._send_to_api')
    @patch('src.handlers.depot._trigger_classification')
    @patch('os.makedirs')
    async def test_handle_voice_message_success_with_redis(
        self,
        mock_makedirs,
        mock_classify,
        mock_send_api,
        mock_session_service,
        mock_update,
        mock_context
    ):
        """Test successful voice message handling with Redis session management."""
        # Mock session service to return active sessions
        active_sessions = [{
            'user_id': 12345,
            'username': 'testuser',
            'deposit_id': 'test_deposit_123',
            'status': 'active'
        }]
        mock_session_service.get_user_active_sessions = AsyncMock(return_value=active_sessions)
        mock_session_service.create_session = AsyncMock()
        mock_session_service.cleanup_session = AsyncMock()
        
        # Setup voice message
        mock_update.message.voice = MagicMock(spec=Voice)
        mock_update.message.voice.file_id = "test_file_id"

        # Mock file object
        mock_file = MagicMock()
        mock_file.download_to_drive = AsyncMock()
        mock_context.bot.get_file.return_value = mock_file

        # Setup API mocks
        mock_send_api.return_value = {
            'success': True,
            'deposit_id': 'test-deposit-123'
        }
        mock_classify.return_value = {
            'success': True,
            'category': 'IT_EQUIPMENT',
            'confidence': 0.85
        }

        # Mock processing message
        processing_msg = MagicMock()
        processing_msg.edit_text = AsyncMock()
        mock_update.message.reply_text.return_value = processing_msg

        result = await handle_voice_message(mock_update, mock_context)

        # Check session service was called
        mock_session_service.get_user_active_sessions.assert_called_once_with(12345)
        mock_session_service.create_session.assert_called_once()
        mock_session_service.cleanup_session.assert_called_once()

        # Check that file was requested to be downloaded
        mock_context.bot.get_file.assert_called_once()
        mock_file.download_to_drive.assert_called_once()

        # Check API was called
        mock_send_api.assert_called_once()
        mock_classify.assert_called_once_with('test-deposit-123')

        # Check processing message was updated
        processing_msg.edit_text.assert_called_once()


if __name__ == '__main__':
    pytest.main([__file__])
