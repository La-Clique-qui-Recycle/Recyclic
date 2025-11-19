import pytest
from datetime import datetime, timezone
from uuid import uuid4

from recyclic_api.models.cash_session import CashSession, CashSessionStep, CashSessionStatus


class TestCashSessionStepMetrics:
    """Tests pour les nouvelles fonctionnalités de métriques d'étapes dans CashSession."""

    def test_current_step_enum_values(self):
        """Test que l'enum CashSessionStep contient les bonnes valeurs."""
        assert CashSessionStep.ENTRY.value == "entry"
        assert CashSessionStep.SALE.value == "sale"
        assert CashSessionStep.EXIT.value == "exit"

    def test_cash_session_initialization_with_step_fields(self):
        """Test l'initialisation d'une CashSession avec les nouveaux champs."""
        session_id = uuid4()
        operator_id = uuid4()
        site_id = uuid4()

        session = CashSession(
            id=session_id,
            operator_id=operator_id,
            site_id=site_id,
            initial_amount=100.0,
            current_step=CashSessionStep.ENTRY,
            last_activity=datetime.now(timezone.utc),
            step_start_time=datetime.now(timezone.utc)
        )

        assert session.id == session_id
        assert session.current_step == CashSessionStep.ENTRY
        assert session.last_activity is not None
        assert session.step_start_time is not None

    def test_cash_session_initialization_with_string_step(self):
        """Test l'initialisation avec conversion automatique de string vers enum."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=50.0,
            current_step="entry"
        )

        assert session.current_step == CashSessionStep.ENTRY

    def test_set_current_step_method(self):
        """Test la méthode set_current_step."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=50.0
        )

        before_time = datetime.now(timezone.utc)

        # Set step to ENTRY
        session.set_current_step(CashSessionStep.ENTRY)

        after_time = datetime.now(timezone.utc)

        assert session.current_step == CashSessionStep.ENTRY
        assert session.step_start_time is not None
        assert session.last_activity is not None
        assert before_time <= session.step_start_time <= after_time
        assert before_time <= session.last_activity <= after_time

    def test_update_activity_method(self):
        """Test la méthode update_activity."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=50.0
        )

        # Set initial activity
        session.update_activity()
        first_activity = session.last_activity

        # Wait a bit and update again
        import time
        time.sleep(0.001)  # Small delay

        session.update_activity()
        second_activity = session.last_activity

        assert second_activity > first_activity

    def test_get_step_metrics_method(self):
        """Test la méthode get_step_metrics."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=50.0
        )

        # Initially no metrics
        metrics = session.get_step_metrics()
        assert metrics["current_step"] is None
        assert metrics["step_start_time"] is None
        assert metrics["last_activity"] is None
        assert metrics["step_duration_seconds"] is None

        # Set step and check metrics
        session.set_current_step(CashSessionStep.SALE)

        metrics = session.get_step_metrics()
        assert metrics["current_step"] == "sale"
        assert metrics["step_start_time"] is not None
        assert metrics["last_activity"] is not None
        assert metrics["step_duration_seconds"] >= 0

    def test_to_dict_includes_step_metrics(self):
        """Test que to_dict inclut les nouvelles métriques d'étapes."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=75.0,
            current_step=CashSessionStep.EXIT,
            last_activity=datetime.now(timezone.utc),
            step_start_time=datetime.now(timezone.utc)
        )

        data = session.to_dict()

        assert "current_step" in data
        assert "last_activity" in data
        assert "step_start_time" in data
        assert data["current_step"] == "exit"
        assert data["last_activity"] is not None
        assert data["step_start_time"] is not None

    def test_to_dict_handles_none_step_metrics(self):
        """Test que to_dict gère correctement les métriques None."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=25.0
        )

        data = session.to_dict()

        assert data["current_step"] is None
        assert data["last_activity"] is None
        assert data["step_start_time"] is None

    def test_step_transition_updates_timestamps(self):
        """Test que les transitions d'étapes mettent à jour les timestamps."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=100.0
        )

        # First transition
        session.set_current_step(CashSessionStep.ENTRY)
        first_start = session.step_start_time

        import time
        time.sleep(0.001)

        # Second transition
        session.set_current_step(CashSessionStep.SALE)
        second_start = session.step_start_time

        assert second_start > first_start
        assert session.current_step == CashSessionStep.SALE

    def test_string_normalization_various_cases(self):
        """Test la normalisation des strings vers enum pour différents cas."""
        test_cases = [
            ("entry", CashSessionStep.ENTRY),
            ("ENTRY", CashSessionStep.ENTRY),
            ("Entry", CashSessionStep.ENTRY),
            ("sale", CashSessionStep.SALE),
            ("SALE", CashSessionStep.SALE),
            ("exit", CashSessionStep.EXIT),
            ("EXIT", CashSessionStep.EXIT),
        ]

        for input_str, expected_enum in test_cases:
            session = CashSession(
                operator_id=uuid4(),
                site_id=uuid4(),
                initial_amount=50.0,
                current_step=input_str
            )
            assert session.current_step == expected_enum, f"Failed for input: {input_str}"

    def test_invalid_step_string_falls_back(self):
        """Test qu'une string invalide ne casse pas l'initialisation."""
        session = CashSession(
            operator_id=uuid4(),
            site_id=uuid4(),
            initial_amount=50.0,
            current_step="invalid_step"
        )

        # Should not crash and current_step should be None or default
        # (depending on how the normalization handles invalid values)
        assert session.current_step is None or isinstance(session.current_step, CashSessionStep)


