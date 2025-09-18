"""
Unit tests for the email metrics system.
"""
import pytest
import time
from unittest.mock import patch, MagicMock

from recyclic_api.utils.email_metrics import EmailMetricsCollector, EmailMetric


class TestEmailMetricsCollector:
    """Test cases for EmailMetricsCollector class."""

    def setup_method(self):
        """Set up a fresh metrics collector for each test."""
        self.collector = EmailMetricsCollector(max_history=100)

    def test_record_successful_email(self):
        """Test recording a successful email send."""
        self.collector.record_email_send(
            to_email="test@example.com",
            success=True,
            elapsed_ms=150.0,
            provider="brevo",
            message_id="msg-123"
        )

        # Check that the metric was recorded
        assert len(self.collector._metrics_history) == 1
        metric = self.collector._metrics_history[0]
        assert metric.to_email == "test@example.com"
        assert metric.success is True
        assert metric.elapsed_ms == 150.0
        assert metric.provider == "brevo"
        assert metric.message_id == "msg-123"

        # Check counters
        assert self.collector._counters["emails_sent_total_brevo_success"] == 1

    def test_record_failed_email(self):
        """Test recording a failed email send."""
        self.collector.record_email_send(
            to_email="test@example.com",
            success=False,
            elapsed_ms=75.0,
            provider="brevo",
            error_type="api_exception",
            error_detail="Invalid API key"
        )

        # Check that the metric was recorded
        assert len(self.collector._metrics_history) == 1
        metric = self.collector._metrics_history[0]
        assert metric.to_email == "test@example.com"
        assert metric.success is False
        assert metric.elapsed_ms == 75.0
        assert metric.provider == "brevo"
        assert metric.error_type == "api_exception"
        assert metric.error_detail == "Invalid API key"

        # Check counters
        assert self.collector._counters["emails_failed_total_brevo_api_exception"] == 1

    def test_metrics_summary_empty(self):
        """Test metrics summary when no data is available."""
        summary = self.collector.get_metrics_summary(hours=24)

        expected = {
            "total_emails": 0,
            "success_count": 0,
            "failure_count": 0,
            "success_rate_percent": 0,
            "latency_metrics": {},
            "error_breakdown": {},
            "provider_breakdown": {}
        }

        for key, value in expected.items():
            assert summary[key] == value

    def test_metrics_summary_with_data(self):
        """Test metrics summary with recorded data."""
        # Record some successful and failed emails
        self.collector.record_email_send("test1@example.com", True, 100.0, "brevo", "msg-1")
        self.collector.record_email_send("test2@example.com", True, 200.0, "brevo", "msg-2")
        self.collector.record_email_send("test3@example.com", False, 50.0, "brevo", error_type="api_exception")

        summary = self.collector.get_metrics_summary(hours=24)

        assert summary["total_emails"] == 3
        assert summary["success_count"] == 2
        assert summary["failure_count"] == 1
        assert summary["success_rate_percent"] == 66.67

        # Check latency metrics
        latency = summary["latency_metrics"]
        assert latency["min_ms"] == 50.0
        assert latency["max_ms"] == 200.0
        assert latency["avg_ms"] == pytest.approx(116.67, abs=0.1)
        assert latency["p50_ms"] == 100.0

        # Check error breakdown
        assert summary["error_breakdown"]["api_exception"] == 1

        # Check provider breakdown
        provider_stats = summary["provider_breakdown"]["brevo"]
        assert provider_stats["success"] == 2
        assert provider_stats["failure"] == 1

    def test_metrics_summary_time_filtering(self):
        """Test that metrics summary filters by time correctly."""
        # Mock time to control timestamps
        with patch('time.time') as mock_time:
            # Set initial time
            mock_time.return_value = 1000.0

            # Record an old email (3 hours ago)
            mock_time.return_value = 1000.0 - (3 * 3600)
            self.collector.record_email_send("old@example.com", True, 100.0, "brevo")

            # Record a recent email (1 hour ago)
            mock_time.return_value = 1000.0 - (1 * 3600)
            self.collector.record_email_send("recent@example.com", True, 150.0, "brevo")

            # Set current time back
            mock_time.return_value = 1000.0

            # Get summary for last 2 hours - should only include recent email
            summary = self.collector.get_metrics_summary(hours=2)

            assert summary["total_emails"] == 1
            assert summary["success_count"] == 1

    def test_prometheus_metrics(self):
        """Test Prometheus metrics format."""
        # Record some metrics
        self.collector.record_email_send("test@example.com", True, 100.0, "brevo", "msg-1")
        self.collector.record_email_send("test2@example.com", False, 50.0, "brevo", error_type="api_error")

        prometheus_metrics = self.collector.get_prometheus_metrics()

        # Should be a list of strings
        assert isinstance(prometheus_metrics, list)
        assert len(prometheus_metrics) > 0

        # Check for expected metric types
        metrics_text = "\n".join(prometheus_metrics)
        assert "emails_sent_total_brevo_success 1" in metrics_text
        assert "emails_failed_total_brevo_api_error 1" in metrics_text
        assert "email_send_latency_ms" in metrics_text
        assert "email_success_rate" in metrics_text

    def test_reset_metrics(self):
        """Test resetting metrics."""
        # Record some metrics
        self.collector.record_email_send("test@example.com", True, 100.0, "brevo")
        assert len(self.collector._metrics_history) == 1
        assert len(self.collector._counters) > 0

        # Reset metrics
        self.collector.reset_metrics()

        # Check everything is cleared
        assert len(self.collector._metrics_history) == 0
        assert len(self.collector._counters) == 0

    def test_max_history_limit(self):
        """Test that metrics history respects max_history limit."""
        collector = EmailMetricsCollector(max_history=3)

        # Add 5 metrics (should only keep last 3)
        for i in range(5):
            collector.record_email_send(f"test{i}@example.com", True, 100.0, "brevo")

        # Should only have 3 metrics
        assert len(collector._metrics_history) == 3

        # Should be the last 3 emails
        emails = [m.to_email for m in collector._metrics_history]
        assert emails == ["test2@example.com", "test3@example.com", "test4@example.com"]

    @patch('recyclic_api.utils.email_metrics.logger')
    def test_logging_success(self, mock_logger):
        """Test that successful email sends are logged correctly."""
        self.collector.record_email_send(
            to_email="test@example.com",
            success=True,
            elapsed_ms=150.0,
            provider="brevo",
            message_id="msg-123"
        )

        # Check that info log was called
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        assert "Email sent successfully" in call_args[0][0]

        # Check extra data
        extra = call_args[1]["extra"]
        assert extra["event"] == "email_sent"
        assert extra["message_id"] == "msg-123"
        assert extra["to_email"] == "test@example.com"
        assert extra["elapsed_ms"] == 150.0
        assert extra["provider"] == "brevo"

    @patch('recyclic_api.utils.email_metrics.logger')
    def test_logging_failure(self, mock_logger):
        """Test that failed email sends are logged correctly."""
        self.collector.record_email_send(
            to_email="test@example.com",
            success=False,
            elapsed_ms=75.0,
            provider="brevo",
            error_type="api_exception",
            error_detail="Invalid API key"
        )

        # Check that error log was called
        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args
        assert "Email send failed" in call_args[0][0]

        # Check extra data
        extra = call_args[1]["extra"]
        assert extra["event"] == "email_failed"
        assert extra["error_type"] == "api_exception"
        assert extra["to_email"] == "test@example.com"
        assert extra["elapsed_ms"] == 75.0
        assert extra["provider"] == "brevo"
        assert extra["error_detail"] == "Invalid API key"