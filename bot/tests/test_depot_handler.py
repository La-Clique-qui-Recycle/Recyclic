"""
Unit tests for the depot handler - Story 2.1 functionality.
Tests the /depot command, voice message handling, and session management.
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from telegram import Update, Message, User, Chat, Voice, Audio
from telegram.ext import ContextTypes, ConversationHandler

import bot.src.handlers.depot as depot_module

from bot.src.handlers.depot import (
    start_depot_session,
    handle_voice_message,
    cancel_depot_session,
    handle_invalid_message,
    active_sessions,
    WAITING_FOR_AUDIO,
    _handle_session_timeout,
    SESSION_TIMEOUT,
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
    update.message.voice = None
    update.message.audio = None

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
    mock_update.message.voice.mime_type = "audio/ogg"
    mock_update.message.voice.file_size = 1024

    # Mock file object
    mock_file = MagicMock()
    mock_file.download_to_drive = AsyncMock()

    return mock_update, mock_file


class TestDepotHandler:
    """Test class for depot handler functionality."""

    def setup_method(self):
        """Clean up active sessions before each test."""
        active_sessions.clear()
        patcher = patch(
            "bot.src.handlers.depot.user_service.get_user_by_telegram_id",
            new_callable=AsyncMock,
        )
        self.user_service_patcher = patcher
        self.mock_user_service = patcher.start()
        self.mock_user_service.return_value = {
            "id": "user-123",
            "is_active": True,
            "status": "approved",
        }

    def teardown_method(self):
        active_sessions.clear()
        self.user_service_patcher.stop()

    @pytest.mark.asyncio
    async def test_start_depot_session_new_user(self, mock_update, mock_context):
        """Test starting a new depot session for a new user."""
        result = await start_depot_session(mock_update, mock_context)

        # Check return value
        assert result == WAITING_FOR_AUDIO

        # Check authorization lookup
        self.mock_user_service.assert_awaited_once_with(str(mock_update.effective_user.id))

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
    async def test_start_depot_session_unauthorized_user(self, mock_update, mock_context):
        """Test that unauthorized users cannot start a session."""
        self.mock_user_service.return_value = None

        result = await start_depot_session(mock_update, mock_context)

        assert result == ConversationHandler.END
        mock_update.message.reply_text.assert_called_once()
        message = mock_update.message.reply_text.call_args[0][0]
        assert "pas autorisé" in message
        assert mock_update.effective_user.id not in active_sessions

    @pytest.mark.asyncio
    async def test_start_depot_session_pending_user(self, mock_update, mock_context):
        """Test that pending users are asked to wait for activation."""
        self.mock_user_service.return_value = {
            "id": "user-123",
            "is_active": True,
            "status": "pending",
        }

        result = await start_depot_session(mock_update, mock_context)

        assert result == ConversationHandler.END
        mock_update.message.reply_text.assert_called_once()
        message = mock_update.message.reply_text.call_args[0][0]
        assert "en attente d'activation" in message
        assert mock_update.effective_user.id not in active_sessions

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
    @patch('bot.src.handlers.depot._trigger_classification')
    @patch('os.makedirs')
    async def test_handle_audio_message_wav_supported(
        self,
        mock_makedirs,
        mock_classify,
        mock_send_api,
        mock_update,
        mock_context,
        monkeypatch,
        tmp_path,
    ):
        """Standard audio files in WAV format should be accepted and stored using config path."""
        user_id = mock_update.effective_user.id

        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        mock_update.message.voice = None
        mock_update.message.audio = MagicMock(spec=Audio)
        mock_update.message.audio.file_id = "audio_wav_id"
        mock_update.message.audio.mime_type = "audio/wav"
        mock_update.message.audio.file_size = 2048
        mock_update.message.audio.file_name = "sample.wav"

        mock_file = MagicMock()
        mock_file.download_to_drive = AsyncMock()
        mock_context.bot.get_file.return_value = mock_file

        mock_send_api.return_value = {
            'success': True,
            'deposit_id': 'wav-deposit-456'
        }
        mock_classify.return_value = {
            'success': True,
            'category': 'IT_EQUIPMENT',
            'confidence': 0.9
        }

        monkeypatch.setattr(depot_module.settings, "AUDIO_STORAGE_PATH", str(tmp_path))

        processing_msg = MagicMock()
        processing_msg.edit_text = AsyncMock()
        mock_update.message.reply_text.return_value = processing_msg

        result = await handle_voice_message(mock_update, mock_context)

        assert result == ConversationHandler.END
        mock_context.bot.get_file.assert_called_once_with("audio_wav_id")
        mock_file.download_to_drive.assert_called_once()

        mock_send_api.assert_called_once()
        mock_classify.assert_called_once_with('wav-deposit-456')
        saved_path = mock_send_api.call_args[0][1]
        assert saved_path.endswith(".wav")
        assert str(tmp_path) in saved_path

        mock_makedirs.assert_called_once_with(str(tmp_path), exist_ok=True)
        assert user_id not in active_sessions

    @pytest.mark.asyncio
    async def test_handle_voice_message_file_too_large(self, mock_voice_message, mock_context):
        """Voice message larger than allowed size should be rejected."""
        mock_update, _ = mock_voice_message
        user_id = mock_update.effective_user.id

        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        from bot.src.handlers.depot import MAX_AUDIO_FILE_SIZE_BYTES

        mock_update.message.voice.file_size = MAX_AUDIO_FILE_SIZE_BYTES + 1

        result = await handle_voice_message(mock_update, mock_context)

        assert result == WAITING_FOR_AUDIO
        mock_update.message.reply_text.assert_called_once()
        message = mock_update.message.reply_text.call_args[0][0]
        assert "Fichier trop volumineux" in message
        assert user_id in active_sessions

    @pytest.mark.asyncio
    async def test_handle_voice_message_unsupported_format(self, mock_voice_message, mock_context):
        """Unsupported audio formats should prompt retry."""
        mock_update, _ = mock_voice_message
        user_id = mock_update.effective_user.id

        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        mock_update.message.voice.mime_type = "audio/flac"

        result = await handle_voice_message(mock_update, mock_context)

        assert result == WAITING_FOR_AUDIO
        mock_update.message.reply_text.assert_called_once()
        message = mock_update.message.reply_text.call_args[0][0]
        assert "Format audio non supporté" in message
        assert user_id in active_sessions

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
    async def test_session_timeout_sends_expiration_message(self, mock_update, mock_context):
        """Session timeout should notify user and preserve cleanup."""
        user_id = mock_update.effective_user.id
        timeout_task = MagicMock()
        timeout_task.cancel = MagicMock()

        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': datetime.utcnow(),
            'timeout_task': timeout_task,
        }

        with patch('bot.src.handlers.depot.asyncio.sleep', new_callable=AsyncMock) as sleep_mock:
            sleep_mock.return_value = None
            await _handle_session_timeout(user_id, mock_update, mock_context)
            sleep_mock.assert_awaited_once_with(SESSION_TIMEOUT)

        assert user_id not in active_sessions
        timeout_task.cancel.assert_not_called()

        mock_context.bot.send_message.assert_awaited_once()
        _, kwargs = mock_context.bot.send_message.await_args
        assert "Session de dépôt expirée" in kwargs['text']

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

    @pytest.mark.asyncio
    @patch('bot.src.handlers.depot._send_to_api')
    @patch('bot.src.handlers.depot._trigger_classification')
    @patch('os.makedirs')
    async def test_handle_audio_message_success(
        self,
        mock_makedirs,
        mock_classify,
        mock_send_api,
        mock_update,
        mock_context
    ):
        """Test handling of standard audio files (mp3)."""
        user_id = mock_update.effective_user.id

        active_sessions[user_id] = {
            'user_id': user_id,
            'username': 'testuser',
            'start_time': None,
            'timeout_task': None
        }

        mock_update.message.voice = None
        mock_update.message.audio = MagicMock(spec=Audio)
        mock_update.message.audio.file_id = "audio_file_id"
        mock_update.message.audio.mime_type = "audio/mpeg"
        mock_update.message.audio.file_size = 2048
        mock_update.message.audio.file_name = "sample.mp3"

        mock_file = MagicMock()
        mock_file.download_to_drive = AsyncMock()
        mock_context.bot.get_file.return_value = mock_file

        mock_send_api.return_value = {
            'success': True,
            'deposit_id': 'test-audio-789'
        }
        mock_classify.return_value = {
            'success': True,
            'category': 'IT_EQUIPMENT',
            'confidence': 0.9
        }

        processing_msg = MagicMock()
        processing_msg.edit_text = AsyncMock()
        mock_update.message.reply_text.return_value = processing_msg

        result = await handle_voice_message(mock_update, mock_context)

        assert result == ConversationHandler.END
        mock_context.bot.get_file.assert_called_once_with("audio_file_id")
        mock_file.download_to_drive.assert_called_once()
        mock_send_api.assert_called_once()
        assert user_id not in active_sessions


if __name__ == '__main__':
    pytest.main([__file__])
