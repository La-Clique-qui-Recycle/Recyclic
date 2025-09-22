"""
Tests pour les services de monitoring et de planification.

Ce module teste les fonctionnalités critiques du système de monitoring
incluant la détection d'anomalies et la planification des tâches.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from recyclic_api.services.anomaly_detection_service import AnomalyDetectionService
from recyclic_api.services.scheduler_service import SchedulerService, ScheduledTask
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.deposit import Deposit
from recyclic_api.models.user import User


class TestAnomalyDetectionService:
    """Tests pour le service de détection d'anomalies."""

    @pytest.fixture
    def mock_db(self):
        """Mock de la session de base de données."""
        return Mock(spec=Session)

    @pytest.fixture
    def anomaly_service(self, mock_db):
        """Instance du service de détection d'anomalies."""
        return AnomalyDetectionService(mock_db)

    def test_anomaly_service_initialization(self, anomaly_service, mock_db):
        """Test l'initialisation du service."""
        assert anomaly_service.db == mock_db
        assert anomaly_service.anomaly_thresholds is not None

    @pytest.mark.asyncio
    async def test_detect_cash_anomalies(self, anomaly_service, mock_db):
        """Test la détection d'écarts de caisse."""
        # Mock des sessions de caisse avec écarts
        mock_sessions = [
            Mock(
                id=1,
                variance=15.0,
                operator_id=1,
                operator=Mock(username="test_operator"),
                site=Mock(name="test_site"),
                closing_amount=150.0,
                actual_amount=135.0,
                closed_at=datetime.now(timezone.utc)
            )
        ]

        # Mock de la requête de base de données avec joinedload
        mock_query = Mock()
        mock_query.filter.return_value.options.return_value.limit.return_value.all.return_value = mock_sessions
        mock_db.query.return_value = mock_query

        # Exécution de la détection
        anomalies = await anomaly_service._detect_cash_anomalies()

        # Vérifications
        assert len(anomalies) == 1
        assert anomalies[0]['type'] == 'cash_variance'
        assert anomalies[0]['severity'] == 'medium'

    @pytest.mark.asyncio
    async def test_detect_sync_anomalies(self, anomaly_service, mock_db):
        """Test la détection d'erreurs de synchronisation."""
        # Mock des logs de synchronisation avec erreurs
        mock_sync_logs = [
            Mock(
                id=1,
                status='error',
                sync_type='deposit_sync',
                created_at=datetime.now(timezone.utc) - timedelta(minutes=30)
            ),
            Mock(
                id=2,
                status='error',
                sync_type='deposit_sync',
                created_at=datetime.now(timezone.utc) - timedelta(minutes=15)
            ),
            Mock(
                id=3,
                status='error',
                sync_type='deposit_sync',
                created_at=datetime.now(timezone.utc) - timedelta(minutes=5)
            )
        ]

        # Mock de la requête de base de données avec limit
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.limit.return_value.all.return_value = mock_sync_logs
        mock_db.query.return_value = mock_query

        # Exécution de la détection
        anomalies = await anomaly_service._detect_sync_anomalies()

        # Vérifications
        assert len(anomalies) == 1  # Seuil de 3 erreurs
        assert anomalies[0]['type'] == 'sync_failure'
        assert anomalies[0]['severity'] == 'medium'

    @pytest.mark.asyncio
    async def test_detect_auth_anomalies(self, anomaly_service, mock_db):
        """Test la détection d'échecs d'authentification."""
        # Mock des logs d'authentification avec échecs
        mock_auth_logs = [
            Mock(
                id=1,
                user_id=1,
                success=False,
                created_at=datetime.now(timezone.utc) - timedelta(minutes=10)
            ),
            Mock(
                id=2,
                user_id=1,
                success=False,
                created_at=datetime.now(timezone.utc) - timedelta(minutes=5)
            ),
            Mock(
                id=3,
                user_id=1,
                success=False,
                created_at=datetime.now(timezone.utc) - timedelta(minutes=1)
            ),
            Mock(
                id=4,
                user_id=1,
                success=False,
                created_at=datetime.now(timezone.utc) - timedelta(minutes=30)
            ),
            Mock(
                id=5,
                user_id=1,
                success=False,
                created_at=datetime.now(timezone.utc) - timedelta(minutes=20)
            )
        ]

        # Mock de la requête de base de données avec limit
        mock_query = Mock()
        mock_query.filter.return_value.limit.return_value.all.return_value = mock_auth_logs
        mock_db.query.return_value = mock_query

        # Exécution de la détection
        anomalies = await anomaly_service._detect_auth_anomalies()

        # Vérifications
        assert len(anomalies) == 1  # Seuil de 5 échecs
        assert anomalies[0]['type'] == 'auth_failure'
        assert anomalies[0]['severity'] == 'medium'

    @pytest.mark.asyncio
    async def test_run_anomaly_detection(self, anomaly_service):
        """Test l'exécution complète de la détection d'anomalies."""
        # Mock des méthodes de détection
        with patch.object(anomaly_service, '_detect_cash_anomalies', return_value=[]), \
             patch.object(anomaly_service, '_detect_sync_anomalies', return_value=[]), \
             patch.object(anomaly_service, '_detect_auth_anomalies', return_value=[]), \
             patch.object(anomaly_service, '_detect_classification_anomalies', return_value=[]):

            # Exécution
            result = await anomaly_service.run_anomaly_detection()

            # Vérifications
            assert isinstance(result, dict)
            assert 'anomalies' in result
            assert 'recommendations' in result
            assert 'summary' in result

    @pytest.mark.asyncio
    async def test_send_anomaly_notifications(self, anomaly_service):
        """Test l'envoi de notifications d'anomalies."""
        # Mock du service Telegram
        with patch('recyclic_api.services.anomaly_detection_service.telegram_service') as mock_telegram:
            mock_telegram.notify_sync_failure = AsyncMock(return_value=True)

            # Données d'anomalies de test
            anomalies = {
                'summary': {
                    'total_anomalies': 1,
                    'critical_anomalies': 0
                },
                'anomalies': {
                    'cash_anomalies': [{'type': 'cash_variance', 'severity': 'medium'}]
                }
            }

            # Exécution
            result = await anomaly_service.send_anomaly_notifications(anomalies)

            # Vérifications
            assert result is True
            mock_telegram.notify_sync_failure.assert_called_once()


class TestSchedulerService:
    """Tests pour le service de planification."""

    @pytest.fixture
    def scheduler_service(self):
        """Instance du service de planification."""
        return SchedulerService()

    def test_scheduler_initialization(self, scheduler_service):
        """Test l'initialisation du scheduler."""
        assert scheduler_service.tasks == {}
        assert scheduler_service.running is False
        assert scheduler_service._task is None

    def test_add_task(self, scheduler_service):
        """Test l'ajout d'une tâche."""
        def dummy_task():
            return "test"

        scheduler_service.add_task("test_task", dummy_task, 30)

        assert "test_task" in scheduler_service.tasks
        task = scheduler_service.tasks["test_task"]
        assert task.name == "test_task"
        assert task.interval_minutes == 30
        assert task.enabled is True

    def test_scheduled_task_should_run(self):
        """Test la logique de détermination d'exécution d'une tâche."""
        def dummy_task():
            return "test"

        # Tâche activée, pas en cours d'exécution
        task = ScheduledTask("test", dummy_task, 30, enabled=True)
        assert task.should_run() is True

        # Tâche désactivée
        task.enabled = False
        assert task.should_run() is False

        # Tâche en cours d'exécution
        task.enabled = True
        task.running = True
        assert task.should_run() is False

    def test_scheduled_task_update_next_run(self):
        """Test la mise à jour de la prochaine exécution."""
        def dummy_task():
            return "test"

        task = ScheduledTask("test", dummy_task, 30)
        initial_time = datetime.now(timezone.utc)
        
        task.update_next_run()
        
        assert task.last_run is not None
        assert task.next_run is not None
        assert task.last_run >= initial_time
        assert task.next_run > task.last_run

    @pytest.mark.asyncio
    async def test_run_health_check_task(self, scheduler_service):
        """Test la tâche de vérification de santé."""
        result = await scheduler_service.run_health_check_task()
        
        assert result["status"] == "healthy"
        assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_run_cleanup_task(self, scheduler_service):
        """Test la tâche de nettoyage."""
        result = await scheduler_service.run_cleanup_task()
        
        assert result["status"] == "completed"
        assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_run_weekly_reports_task(self, scheduler_service):
        """Test la tâche de génération de rapports hebdomadaires."""
        with patch.object(scheduler_service, '_generate_weekly_report_data', return_value={
            'cash_sessions': {'count': 5, 'total_sales': 100.0, 'total_items': 10, 'average_session_value': 20.0},
            'deposits': {'count': 3},
            'users': {'total': 10, 'active': 8},
            'system': {'sync_errors': 0}
        }):
            result = await scheduler_service.run_weekly_reports_task()
            
            assert result["status"] == "completed"
            assert result["report_generated"] is True
            assert "timestamp" in result

    def test_setup_default_tasks(self, scheduler_service):
        """Test la configuration des tâches par défaut."""
        scheduler_service.setup_default_tasks()
        
        expected_tasks = ["anomaly_detection", "health_check", "cleanup", "weekly_reports"]
        for task_name in expected_tasks:
            assert task_name in scheduler_service.tasks

    def test_enable_disable_task(self, scheduler_service):
        """Test l'activation/désactivation des tâches."""
        def dummy_task():
            return "test"

        scheduler_service.add_task("test_task", dummy_task, 30)
        
        # Désactiver
        scheduler_service.disable_task("test_task")
        assert scheduler_service.tasks["test_task"].enabled is False
        
        # Activer
        scheduler_service.enable_task("test_task")
        assert scheduler_service.tasks["test_task"].enabled is True

    def test_get_status(self, scheduler_service):
        """Test la récupération du statut du scheduler."""
        def dummy_task():
            return "test"

        scheduler_service.add_task("test_task", dummy_task, 30)
        status = scheduler_service.get_status()
        
        assert "running" in status
        assert "tasks" in status
        assert "total_tasks" in status
        assert status["total_tasks"] == 1
        assert len(status["tasks"]) == 1


class TestMonitoringIntegration:
    """Tests d'intégration pour le système de monitoring."""

    @pytest.mark.asyncio
    async def test_monitoring_workflow(self):
        """Test le workflow complet de monitoring."""
        # Mock de la base de données
        mock_db = Mock(spec=Session)
        
        # Mock des données de test
        mock_db.query.return_value.filter.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.count.return_value = 0
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
        
        # Test du service de détection d'anomalies
        anomaly_service = AnomalyDetectionService(mock_db)
        result = await anomaly_service.run_anomaly_detection()
        
        # Test du service de planification
        scheduler_service = SchedulerService()
        scheduler_service.setup_default_tasks()
        
        # Vérifications
        assert isinstance(result, dict)
        assert 'anomalies' in result
        assert len(scheduler_service.tasks) == 4
        assert scheduler_service.get_status()["total_tasks"] == 4


if __name__ == "__main__":
    pytest.main([__file__])
