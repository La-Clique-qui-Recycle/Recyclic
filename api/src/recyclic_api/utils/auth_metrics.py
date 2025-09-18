"""
Authentication metrics collection system for monitoring and observability.
"""
import time
from collections import defaultdict, deque
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from threading import Lock
import logging

logger = logging.getLogger(__name__)


@dataclass
class AuthMetric:
    """Represents a single authentication attempt metric."""
    timestamp: float
    username: str
    success: bool
    elapsed_ms: float
    client_ip: str = "unknown"
    user_id: Optional[str] = None
    error_type: Optional[str] = None


class AuthMetricsCollector:
    """Collects and manages authentication metrics."""

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

    def record_login_attempt(
        self,
        username: str,
        success: bool,
        elapsed_ms: float,
        client_ip: str = "unknown",
        user_id: Optional[str] = None,
        error_type: Optional[str] = None
    ) -> None:
        """
        Record a login attempt.

        Args:
            username: Username used for login
            success: Whether the login was successful
            elapsed_ms: Time taken to process the login
            client_ip: Client IP address
            user_id: User ID (if successful)
            error_type: Type of error (if failed)
        """
        metric = AuthMetric(
            timestamp=time.time(),
            username=username,
            success=success,
            elapsed_ms=elapsed_ms,
            client_ip=client_ip,
            user_id=user_id,
            error_type=error_type
        )

        with self._lock:
            self._metrics_history.append(metric)

            # Update counters
            if success:
                self._counters["login_success_total"] += 1
            else:
                self._counters["login_errors_total"] += 1
                self._counters[f"login_errors_by_type_{error_type or 'unknown'}"] += 1

    def get_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get a summary of authentication metrics for the specified time period.

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
                "total_attempts": 0,
                "success_count": 0,
                "failure_count": 0,
                "success_rate_percent": 0,
                "latency_metrics": {},
                "error_breakdown": {},
                "ip_breakdown": {}
            }

        # Calculate basic stats
        total_attempts = len(recent_metrics)
        success_count = sum(1 for m in recent_metrics if m.success)
        failure_count = total_attempts - success_count
        success_rate = (success_count / total_attempts) * 100 if total_attempts > 0 else 0

        # Calculate latency statistics
        latencies = [m.elapsed_ms for m in recent_metrics]
        latency_metrics = {
            "min_ms": min(latencies) if latencies else 0,
            "max_ms": max(latencies) if latencies else 0,
            "avg_ms": sum(latencies) / len(latencies) if latencies else 0
        }

        # Error breakdown
        error_breakdown = defaultdict(int)
        for metric in recent_metrics:
            if not metric.success:
                error_breakdown[metric.error_type or "unknown"] += 1

        # IP breakdown (for failed attempts)
        ip_breakdown = defaultdict(int)
        for metric in recent_metrics:
            if not metric.success:
                ip_breakdown[metric.client_ip] += 1

        return {
            "total_attempts": total_attempts,
            "success_count": success_count,
            "failure_count": failure_count,
            "success_rate_percent": round(success_rate, 2),
            "latency_metrics": latency_metrics,
            "error_breakdown": dict(error_breakdown),
            "ip_breakdown": dict(ip_breakdown),
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
            "# TYPE login_latency_ms histogram",
            f"login_latency_ms_sum {summary['latency_metrics'].get('avg_ms', 0) * summary['total_attempts']}",
            f"login_latency_ms_count {summary['total_attempts']}",

            "# TYPE login_success_rate gauge",
            f"login_success_rate {summary['success_rate_percent'] / 100}",
        ])

        return metrics

    def reset_metrics(self) -> None:
        """Reset all metrics (useful for testing)."""
        with self._lock:
            self._metrics_history.clear()
            self._counters.clear()


# Global metrics collector instance
auth_metrics = AuthMetricsCollector()