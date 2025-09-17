"""
Unit tests for the new LangChain-based classification service (Story 4.2).

These tests verify the classification service implementation according to Story 4.2 requirements:
- Audio transcription using Google Speech-to-Text
- Text classification using LangChain + Gemini LLM
- Confidence scoring and alternative suggestions
- Error handling with appropriate status updates
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

from recyclic_api.services.classification_service import (
    ClassificationService,
    classify_deposit_audio,
    ClassificationResult
)
from recyclic_api.models.deposit import EEECategory, DepositStatus


class TestClassificationService:
    """Test the ClassificationService class."""

    def test_init_without_gemini_key(self):
        """Test service initialization without Gemini API key."""
        with patch.dict('os.environ', {}, clear=True):
            service = ClassificationService()
            assert service.llm is None
            assert service.classification_chain is None

    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test_key_123'})
    @patch('recyclic_api.services.classification_service.LANGCHAIN_AVAILABLE', True)
    def test_init_with_gemini_key_simple(self):
        """Test service initialization with Gemini API key (simplified)."""
        # This test verifies that the service initializes without errors when API key is present
        service = ClassificationService()

        # Should have the API key stored
        assert service.gemini_api_key == 'test_key_123'

        # In a real environment with modules installed, LLM would be initialized
        # For now, we just verify no crashes occur

    @pytest.mark.asyncio
    async def test_transcribe_audio_success(self):
        """Test audio transcription success cases."""
        service = ClassificationService()

        # Test different scenarios
        test_cases = [
            ("/audio/ordinateur_test.ogg", "ordinateur"),
            ("/audio/frigo_test.wav", "réfrigérateur"),
            ("/audio/lampe_test.mp3", "lampe"),
            ("/audio/telephone_test.ogg", "téléphone"),
        ]

        for audio_path, expected_keyword in test_cases:
            result = await service._transcribe_audio(audio_path)
            assert result is not None
            assert expected_keyword in result.lower()

    @pytest.mark.asyncio
    async def test_transcribe_audio_file_not_found(self):
        """Test audio transcription with non-existent file."""
        service = ClassificationService()

        result = await service._transcribe_audio("/nonexistent/path.ogg")
        assert result is None

    @pytest.mark.asyncio
    async def test_fallback_classification_it_equipment(self):
        """Test fallback classification for IT equipment."""
        service = ClassificationService()

        test_cases = [
            "J'ai un vieil ordinateur portable qui ne fonctionne plus",
            "Mon téléphone mobile avec écran fissuré",
            "Une imprimante qui ne marche plus",
            "Un clavier et une souris à recycler"
        ]

        for transcription in test_cases:
            result = await service._fallback_classification(transcription)

            assert result["success"] is True
            assert result["category"] == EEECategory.IT_EQUIPMENT.value
            assert result["confidence"] >= 0.7
            assert "informatiques" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_fallback_classification_large_appliance(self):
        """Test fallback classification for large appliances."""
        service = ClassificationService()

        test_cases = [
            "Un réfrigérateur en panne que je souhaite recycler",
            "Lave-linge qui ne fonctionne plus",
            "Four électrique défaillant",
            "Congélateur à déposer"
        ]

        for transcription in test_cases:
            result = await service._fallback_classification(transcription)

            assert result["success"] is True
            assert result["category"] == EEECategory.LARGE_APPLIANCE.value
            assert result["confidence"] >= 0.7
            assert "électroménager" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_fallback_classification_lighting(self):
        """Test fallback classification for lighting equipment."""
        service = ClassificationService()

        test_cases = [
            "Une lampe de bureau avec ampoule LED cassée",
            "Néon qui ne s'allume plus",
            "Luminaire défectueux"
        ]

        for transcription in test_cases:
            result = await service._fallback_classification(transcription)

            assert result["success"] is True
            assert result["category"] == EEECategory.LIGHTING.value
            assert result["confidence"] >= 0.7
            assert "éclairage" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_fallback_classification_with_alternatives(self):
        """Test fallback classification that provides alternatives."""
        service = ClassificationService()

        # Test cases that should generate alternatives
        result = await service._fallback_classification("Un aspirateur qui ne marche plus")

        assert result["success"] is True
        assert result["category"] == EEECategory.SMALL_APPLIANCE.value
        assert result["confidence"] == 0.7
        assert result["alternatives"] is not None
        assert len(result["alternatives"]) > 0

        # Check alternative structure
        alternative = result["alternatives"][0]
        assert "category" in alternative
        assert "confidence" in alternative
        assert "reasoning" in alternative

    @pytest.mark.asyncio
    async def test_fallback_classification_other_category(self):
        """Test fallback classification for unrecognized items."""
        service = ClassificationService()

        result = await service._fallback_classification("Un objet électronique mystérieux")

        assert result["success"] is True
        assert result["category"] == EEECategory.OTHER.value
        assert result["confidence"] == 0.3
        assert result["alternatives"] is not None
        assert len(result["alternatives"]) >= 2

    @pytest.mark.asyncio
    async def test_process_audio_file_success(self):
        """Test complete audio processing workflow - success case."""
        service = ClassificationService()

        # Mock the transcription and classification
        with patch.object(service, '_transcribe_audio', return_value="Un ordinateur portable défaillant") as mock_transcribe, \
             patch.object(service, '_classify_description', return_value={
                 "success": True,
                 "category": EEECategory.IT_EQUIPMENT.value,
                 "confidence": 0.85,
                 "reasoning": "Classification by keywords",
                 "alternatives": None
             }) as mock_classify:

            result = await service.process_audio_file("/audio/test.ogg")

            # Verify calls
            mock_transcribe.assert_called_once_with("/audio/test.ogg")
            mock_classify.assert_called_once_with("Un ordinateur portable défaillant")

            # Verify result structure according to Story 4.2
            assert result["success"] is True
            assert result["transcription"] == "Un ordinateur portable défaillant"
            assert result["eee_category"] == EEECategory.IT_EQUIPMENT.value
            assert result["confidence_score"] == 0.85
            assert result["alternative_categories"] is None
            assert result["reasoning"] == "Classification by keywords"
            assert result["status"] == DepositStatus.PENDING_VALIDATION

    @pytest.mark.asyncio
    async def test_process_audio_file_transcription_failure(self):
        """Test audio processing when transcription fails."""
        service = ClassificationService()

        with patch.object(service, '_transcribe_audio', return_value=None):
            result = await service.process_audio_file("/audio/corrupted.ogg")

            assert result["success"] is False
            assert result["error"] == "Failed to transcribe audio"
            assert result["status"] == DepositStatus.CLASSIFICATION_FAILED
            assert result["transcription"] is None
            assert result["eee_category"] is None

    @pytest.mark.asyncio
    async def test_process_audio_file_classification_failure(self):
        """Test audio processing when classification fails."""
        service = ClassificationService()

        with patch.object(service, '_transcribe_audio', return_value="Valid transcription") as mock_transcribe, \
             patch.object(service, '_classify_description', return_value={
                 "success": False,
                 "error": "LLM classification failed"
             }) as mock_classify:

            result = await service.process_audio_file("/audio/test.ogg")

            assert result["success"] is False
            assert result["error"] == "LLM classification failed"
            assert result["status"] == DepositStatus.CLASSIFICATION_FAILED
            assert result["transcription"] == "Valid transcription"
            assert result["eee_category"] is None

    @pytest.mark.asyncio
    async def test_process_audio_file_exception_handling(self):
        """Test audio processing with unexpected exception."""
        service = ClassificationService()

        with patch.object(service, '_transcribe_audio', side_effect=Exception("Unexpected error")):
            result = await service.process_audio_file("/audio/test.ogg")

            assert result["success"] is False
            assert "Unexpected error" in result["error"]
            assert result["status"] == DepositStatus.CLASSIFICATION_FAILED

    @pytest.mark.asyncio
    @patch('recyclic_api.services.classification_service.classification_service')
    async def test_classify_deposit_audio_convenience_function(self, mock_service):
        """Test the convenience function classify_deposit_audio."""
        # Setup mock
        mock_service.process_audio_file = AsyncMock(return_value={"success": True, "test": "result"})

        # Test the function
        result = await classify_deposit_audio("/audio/test.ogg")

        # Verify the service was used correctly
        mock_service.process_audio_file.assert_called_once_with("/audio/test.ogg")
        assert result == {"success": True, "test": "result"}


class TestClassificationResultModel:
    """Test the Pydantic ClassificationResult model."""

    def test_classification_result_valid(self):
        """Test valid ClassificationResult creation."""
        result = ClassificationResult(
            category="IT_EQUIPMENT",
            confidence=0.85,
            reasoning="Keywords detected",
            alternatives=[
                {"category": "TOYS", "confidence": 0.3, "reasoning": "Alternative"}
            ]
        )

        assert result.category == "IT_EQUIPMENT"
        assert result.confidence == 0.85
        assert result.reasoning == "Keywords detected"
        assert len(result.alternatives) == 1

    def test_classification_result_without_alternatives(self):
        """Test ClassificationResult without alternatives."""
        result = ClassificationResult(
            category="LIGHTING",
            confidence=0.9,
            reasoning="High confidence classification"
        )

        assert result.category == "LIGHTING"
        assert result.confidence == 0.9
        assert result.alternatives is None


if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, "-v"])