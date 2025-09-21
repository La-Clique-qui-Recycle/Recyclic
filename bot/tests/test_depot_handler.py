"""
Unit tests for the depot handler - Story 4.1 functionality.
Tests the /depot command, voice message handling, and session management.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from telegram import Update, Message, User, Chat, Voice
from telegram.ext import ContextTypes

from bot.src.handlers.depot import (
    start_depot_session,
    handle_voice_message,
    cancel_depot_session,
    handle_invalid_message,
    _handle_session_timeout,
    _cleanup_session,
    active_sessions,
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


@pytest.fixture
def mock_voice_message(mock_update):
    """Create a mock voice message."""
    mock_update.message.voice = MagicMock(spec=Voice)
    mock_update.message.voice.file_id = "test_file_id"

    # Mock file object
    mock_file = MagicMock()
    mock_file.download_to_drive = AsyncMock()

    return mock_update, mock_file


class TestDepotHandler:
    """Test class for depot handler functionality."""

    def setup_method(self):
        """Clean up active sessions before each test."""
        active_sessions.clear()

    @pytest.mark.asyncio
    async def test_start_depot_session_new_user(self, mock_update, mock_context):
        """Test starting a new depot session for a new user."""
        result = await start_depot_session(mock_update, mock_context)

        # Check return value
        assert result == WAITING_FOR_AUDIO

        # Check session was created
        user_id = mock_update.effective_user.id
        assert user_id in active_sessions
        assert active_sessions[user_id]['user_id'] == user_id
        assert active_sessions[user_id]['username'] == "testuser"

        # Check reply was sent
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Session de dépôt démarrée" in call_args
        assert "5 minutes" in call_args

    @pytest.mark.asyncio
    async def test_start_depot_session_existing_user(self, mock_update, mock_context):
        """Test starting a depot session when user already has an active session."""
        user_id = mock_update.effective_user.id

        # Create existing session
        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        result = await start_depot_session(mock_update, mock_context)

        # Check return value
        assert result == WAITING_FOR_AUDIO

        # Check reply mentions existing session
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "session de dépôt active" in call_args

    @pytest.mark.asyncio
    async def test_cancel_depot_session_active(self, mock_update, mock_context):
        """Test canceling an active depot session."""
        user_id = mock_update.effective_user.id

        # Create active session
        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': MagicMock()
        }

        result = await cancel_depot_session(mock_update, mock_context)

        # Check session was removed
        assert user_id not in active_sessions

        # Check reply was sent
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Session de dépôt annulée" in call_args

    @pytest.mark.asyncio
    async def test_handle_session_timeout_sends_message(self, mock_update, mock_context):
        """Test that session timeout sends expiration message and cleans session."""
        user_id = mock_update.effective_user.id

        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        sleep_mock = AsyncMock()
        sleep_mock.return_value = None

        with patch('bot.src.handlers.depot.asyncio.sleep', sleep_mock):
            timeout_task = asyncio.create_task(
                _handle_session_timeout(user_id, mock_update, mock_context)
            )
            active_sessions[user_id]['timeout_task'] = timeout_task
            await timeout_task

        sleep_mock.assert_awaited_once()
        mock_context.bot.send_message.assert_awaited_once()
        args, kwargs = mock_context.bot.send_message.call_args
        assert kwargs['chat_id'] == user_id
        assert "Session de dépôt expirée" in kwargs['text']
        assert user_id not in active_sessions

    @pytest.mark.asyncio
    async def test_cleanup_session_does_not_cancel_calling_timeout_task(self, mock_update):
        """Ensure cleanup skips cancelling the timeout task that invokes it."""
        user_id = mock_update.effective_user.id

        timeout_task = MagicMock()
        timeout_task.cancel = MagicMock()

        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': timeout_task,
        }

        await _cleanup_session(user_id, skip_task=timeout_task)

        timeout_task.cancel.assert_not_called()
        assert user_id not in active_sessions

    @pytest.mark.asyncio
    async def test_cancel_depot_session_no_active(self, mock_update, mock_context):
        """Test canceling when no active session exists."""
        result = await cancel_depot_session(mock_update, mock_context)

        # Check reply was sent
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Aucune session de dépôt active" in call_args

    @pytest.mark.asyncio
    async def test_handle_voice_message_no_session(self, mock_update, mock_context):
        """Test handling voice message when no active session exists."""
        mock_update.message.voice = MagicMock(spec=Voice)

        result = await handle_voice_message(mock_update, mock_context)

        # Check appropriate error message
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Aucune session de dépôt active" in call_args

    @pytest.mark.asyncio
    @patch('bot.src.handlers.depot._send_to_api')
    @patch('bot.src.handlers.depot._trigger_classification')
    @patch('os.makedirs')
    async def test_handle_voice_message_success(
        self,
        mock_makedirs,
        mock_classify,
        mock_send_api,
        mock_voice_message,
        mock_context
    ):
        """Test successful voice message handling."""
        mock_update, mock_file = mock_voice_message
        user_id = mock_update.effective_user.id

        # Setup active session
        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        # Setup mocks
        mock_context.bot.get_file.return_value = mock_file
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

        # Check that file was requested to be downloaded
        mock_context.bot.get_file.assert_called_once()
        mock_file.download_to_drive.assert_called_once()

        # Check API was called
        mock_send_api.assert_called_once()
        mock_classify.assert_called_once_with('test-deposit-123')

        # Check session was cleaned up
        assert user_id not in active_sessions

    @pytest.mark.asyncio
    @patch('bot.src.handlers.depot._send_to_api')
    async def test_handle_voice_message_api_failure(
        self,
        mock_send_api,
        mock_voice_message,
        mock_context
    ):
        """Test voice message handling when API call fails."""
        mock_update, mock_file = mock_voice_message
        user_id = mock_update.effective_user.id

        # Setup active session
        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        # Setup mocks
        mock_context.bot.get_file.return_value = mock_file
        mock_send_api.return_value = {
            'success': False,
            'error': 'API Error'
        }

        # Mock processing message
        processing_msg = MagicMock()
        processing_msg.edit_text = AsyncMock()
        mock_update.message.reply_text.return_value = processing_msg

        result = await handle_voice_message(mock_update, mock_context)

        # Check error message was sent
        processing_msg.edit_text.assert_called_once()
        call_args = processing_msg.edit_text.call_args[0][0]
        assert "Erreur lors de la création du dépôt" in call_args

    @pytest.mark.asyncio
    async def test_handle_invalid_message(self, mock_update, mock_context):
        """Test handling invalid (non-voice) messages during session."""
        result = await handle_invalid_message(mock_update, mock_context)

        # Check return value
        assert result == WAITING_FOR_AUDIO

        # Check appropriate instruction message
        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Envoyez un message vocal" in call_args

    @pytest.mark.asyncio
    @patch('httpx.AsyncClient')
    async def test_send_to_api_success(self, mock_client_class):
        """Test successful API call to create deposit."""
        from bot.src.handlers.depot import _send_to_api

        # Setup mock response
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'id': 'test-deposit-123'}

        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_response
        mock_client_class.return_value = mock_client

        result = await _send_to_api(12345, "/path/to/audio.ogg")

        # Check result
        assert result['success'] is True
        assert result['deposit_id'] == 'test-deposit-123'

        # Check API was called correctly
        mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    @patch('httpx.AsyncClient')
    async def test_send_to_api_failure(self, mock_client_class):
        """Test API call failure."""
        from bot.src.handlers.depot import _send_to_api

        # Setup mock response
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_response
        mock_client_class.return_value = mock_client

        result = await _send_to_api(12345, "/path/to/audio.ogg")

        # Check result
        assert result['success'] is False
        assert "API error: 500" in result['error']

    @pytest.mark.asyncio
    @patch('httpx.AsyncClient')
    async def test_trigger_classification_success(self, mock_client_class):
        """Test successful classification trigger."""
        from bot.src.handlers.depot import _trigger_classification

        # Setup mock response
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'category': 'IT_EQUIPMENT',
            'ai_confidence': 0.85
        }

        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_response
        mock_client_class.return_value = mock_client

        result = await _trigger_classification('test-deposit-123')

        # Check result
        assert result['success'] is True
        assert result['category'] == 'IT_EQUIPMENT'
        assert result['confidence'] == 0.85


if __name__ == '__main__':
    pytest.main([__file__])