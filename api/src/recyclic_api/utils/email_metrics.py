"""
Email metrics collection system for monitoring and observability.
"""
import time
from collections import defaultdict, deque
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from threading import Lock
import logging
import statistics

logger = logging.getLogger(__name__)


@dataclass
class EmailMetric:
    """Represents a single email send metric."""
    timestamp: float
    to_email: str
    success: bool
    elapsed_ms: float
    provider: str = "brevo"
    message_id: Optional[str] = None
    error_type: Optional[str] = None
    error_detail: Optional[str] = None


class EmailMetricsCollector:
    """Collects and manages email sending metrics."""

    def __init__(self, max_history: int = 10000):
        """
        Initialize the metrics collector.

        Args:
            max_history: Maximum number of metrics to keep in memory
        """
        self.max_history = max_history
        self._metrics_history: deque = deque(maxlen=max_history)
        self._counters = defaultdict(int)
        self._lock = Lock()

    def record_email_send(
        self,
        to_email: str,
        success: bool,
        elapsed_ms: float,
        provider: str = "brevo",
        message_id: Optional[str] = None,
        error_type: Optional[str] = None,
        error_detail: Optional[str] = None
    ) -> None:
        """
        Record an email send attempt.

        Args:
            to_email: Recipient email address
            success: Whether the send was successful
            elapsed_ms: Time taken to send the email
            provider: Email service provider (default: "brevo")
            message_id: Provider's message ID (if successful)
            error_type: Type of error (if failed)
            error_detail: Detailed error message (if failed)
        """
        metric = EmailMetric(
            timestamp=time.time(),
            to_email=to_email,
            success=success,
            elapsed_ms=elapsed_ms,
            provider=provider,
            message_id=message_id,
            error_type=error_type,
            error_detail=error_detail
        )

        with self._lock:
            self._metrics_history.append(metric)

            # Update counters
            if success:
                self._counters[f"emails_sent_total_{provider}_success"] += 1
                self._log_success(metric)
            else:
                self._counters[f"emails_failed_total_{provider}_{error_type or 'unknown'}"] += 1
                self._log_error(metric)

    def _log_success(self, metric: EmailMetric) -> None:
        """Log successful email send with structured logging."""
        logger.info(
            "Email sent successfully",
            extra={
                "event": "email_sent",
                "message_id": metric.message_id,
                "to_email": metric.to_email,
                "elapsed_ms": metric.elapsed_ms,
                "provider": metric.provider,
                "timestamp": metric.timestamp
            }
        )

    def _log_error(self, metric: EmailMetric) -> None:
        """Log failed email send with structured logging."""
        logger.error(
            "Email send failed",
            extra={
                "event": "email_failed",
                "error_type": metric.error_type,
                "to_email": metric.to_email,
                "elapsed_ms": metric.elapsed_ms,
                "provider": metric.provider,
                "error_detail": metric.error_detail,
                "timestamp": metric.timestamp
            }
        )

    def get_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get a summary of email metrics for the specified time period.

        Args:
            hours: Number of hours to include in the summary

        Returns:
            Dictionary containing metrics summary
        """
        cutoff_time = time.time() - (hours * 3600)

        with self._lock:
            recent_metrics = [
                m for m in self._metrics_history
                if m.timestamp >= cutoff_time
            ]

        if not recent_metrics:
            return {
                "total_emails": 0,
                "success_count": 0,
                "failure_count": 0,
                "success_rate_percent": 0,
                "latency_metrics": {},
                "error_breakdown": {},
                "provider_breakdown": {}
            }

        # Calculate basic stats
        total_emails = len(recent_metrics)
        success_count = sum(1 for m in recent_metrics if m.success)
        failure_count = total_emails - success_count
        success_rate = (success_count / total_emails) * 100 if total_emails > 0 else 0

        # Calculate latency statistics
        latencies = [m.elapsed_ms for m in recent_metrics]
        latency_metrics = {
            "min_ms": min(latencies) if latencies else 0,
            "max_ms": max(latencies) if latencies else 0,
            "avg_ms": statistics.mean(latencies) if latencies else 0,
            "p50_ms": statistics.median(latencies) if latencies else 0,
            "p95_ms": statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else (max(latencies) if latencies else 0)
        }

        # Error breakdown
        error_breakdown = defaultdict(int)
        for metric in recent_metrics:
            if not metric.success:
                error_breakdown[metric.error_type or "unknown"] += 1

        # Provider breakdown
        provider_breakdown = defaultdict(lambda: {"success": 0, "failure": 0})
        for metric in recent_metrics:
            if metric.success:
                provider_breakdown[metric.provider]["success"] += 1
            else:
                provider_breakdown[metric.provider]["failure"] += 1

        return {
            "total_emails": total_emails,
            "success_count": success_count,
            "failure_count": failure_count,
            "success_rate_percent": round(success_rate, 2),
            "latency_metrics": latency_metrics,
            "error_breakdown": dict(error_breakdown),
            "provider_breakdown": dict(provider_breakdown),
            "time_period_hours": hours,
            "timestamp": time.time()
        }

    def get_prometheus_metrics(self) -> List[str]:
        """
        Get metrics in Prometheus format.

        Returns:
            List of metric strings in Prometheus format
        """
        metrics = []

        with self._lock:
            # Add counter metrics
            for counter_name, value in self._counters.items():
                metrics.append(f"# TYPE {counter_name} counter")
                metrics.append(f"{counter_name} {value}")

        # Add current summary metrics
        summary = self.get_metrics_summary(hours=1)  # Last hour

        metrics.extend([
            "# TYPE email_send_latency_ms histogram",
            f"email_send_latency_ms_sum {summary['latency_metrics'].get('avg_ms', 0) * summary['total_emails']}",
            f"email_send_latency_ms_count {summary['total_emails']}",

            "# TYPE email_success_rate gauge",
            f"email_success_rate {summary['success_rate_percent'] / 100}",
        ])

        return metrics

    def reset_metrics(self) -> None:
        """Reset all metrics (useful for testing)."""
        with self._lock:
            self._metrics_history.clear()
            self._counters.clear()


# Global metrics collector instance
email_metrics = EmailMetricsCollector()