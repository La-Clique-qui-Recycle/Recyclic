"""
Performance monitoring utilities for classification service.

This module provides metrics collection and performance monitoring
for the classification pipeline according to QA recommendations.
"""

import time
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from threading import Lock
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


@dataclass
class ClassificationMetrics:
    """Metrics for a single classification operation."""
    timestamp: datetime
    audio_file_path: str
    transcription_time_ms: float
    classification_time_ms: float
    total_time_ms: float
    success: bool
    method_used: str  # "google_speech", "simulation", "llm", "fallback"
    confidence_score: Optional[float] = None
    category: Optional[str] = None
    error: Optional[str] = None


class PerformanceMonitor:
    """
    Performance monitor for classification operations.

    Collects metrics on transcription and classification performance,
    providing insights for optimization and monitoring.
    """

    def __init__(self):
        """Initialize the performance monitor."""
        self._metrics: list[ClassificationMetrics] = []
        self._lock = Lock()
        self._current_session: Optional[Dict[str, Any]] = None

    def start_classification_session(self, audio_file_path: str) -> str:
        """
        Start a new classification session for monitoring.

        Args:
            audio_file_path: Path to the audio file being processed

        Returns:
            Session ID for tracking this classification
        """
        session_id = f"session_{int(time.time() * 1000)}"

        self._current_session = {
            "session_id": session_id,
            "audio_file_path": audio_file_path,
            "start_time": time.time(),
            "transcription_start": None,
            "transcription_end": None,
            "classification_start": None,
            "classification_end": None,
        }

        logger.debug(f"Started classification session: {session_id}")
        return session_id

    def mark_transcription_start(self):
        """Mark the start of transcription phase."""
        if self._current_session:
            self._current_session["transcription_start"] = time.time()

    def mark_transcription_end(self, method_used: str, success: bool = True, error: str = None):
        """
        Mark the end of transcription phase.

        Args:
            method_used: Method used for transcription ("google_speech" or "simulation")
            success: Whether transcription was successful
            error: Error message if transcription failed
        """
        if self._current_session:
            self._current_session["transcription_end"] = time.time()
            self._current_session["transcription_method"] = method_used
            self._current_session["transcription_success"] = success
            self._current_session["transcription_error"] = error

    def mark_classification_start(self):
        """Mark the start of classification phase."""
        if self._current_session:
            self._current_session["classification_start"] = time.time()

    def mark_classification_end(self, method_used: str, success: bool = True,
                              confidence_score: float = None, category: str = None,
                              error: str = None):
        """
        Mark the end of classification phase.

        Args:
            method_used: Method used for classification ("llm" or "fallback")
            success: Whether classification was successful
            confidence_score: Classification confidence score
            category: Classified category
            error: Error message if classification failed
        """
        if self._current_session:
            self._current_session["classification_end"] = time.time()
            self._current_session["classification_method"] = method_used
            self._current_session["classification_success"] = success
            self._current_session["confidence_score"] = confidence_score
            self._current_session["category"] = category
            self._current_session["classification_error"] = error

    def end_classification_session(self) -> Optional[ClassificationMetrics]:
        """
        End the current classification session and record metrics.

        Returns:
            ClassificationMetrics object with the recorded metrics
        """
        if not self._current_session:
            return None

        session = self._current_session
        end_time = time.time()

        # Calculate timing metrics
        total_time_ms = (end_time - session["start_time"]) * 1000

        transcription_time_ms = 0
        if session.get("transcription_start") and session.get("transcription_end"):
            transcription_time_ms = (session["transcription_end"] - session["transcription_start"]) * 1000

        classification_time_ms = 0
        if session.get("classification_start") and session.get("classification_end"):
            classification_time_ms = (session["classification_end"] - session["classification_start"]) * 1000

        # Determine overall success and method
        success = session.get("transcription_success", False) and session.get("classification_success", False)
        method_used = f"{session.get('transcription_method', 'unknown')}+{session.get('classification_method', 'unknown')}"

        # Create metrics record
        metrics = ClassificationMetrics(
            timestamp=datetime.now(),
            audio_file_path=session["audio_file_path"],
            transcription_time_ms=transcription_time_ms,
            classification_time_ms=classification_time_ms,
            total_time_ms=total_time_ms,
            success=success,
            method_used=method_used,
            confidence_score=session.get("confidence_score"),
            category=session.get("category"),
            error=session.get("transcription_error") or session.get("classification_error")
        )

        # Store metrics
        with self._lock:
            self._metrics.append(metrics)
            # Keep only last 1000 metrics to prevent memory issues
            if len(self._metrics) > 1000:
                self._metrics = self._metrics[-1000:]

        logger.info(f"Classification session completed: {total_time_ms:.1f}ms total, "
                   f"{transcription_time_ms:.1f}ms transcription, "
                   f"{classification_time_ms:.1f}ms classification, "
                   f"success={success}, method={method_used}")

        # Clear current session
        self._current_session = None

        return metrics

    def get_performance_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get performance summary for the last N hours.

        Args:
            hours: Number of hours to include in summary

        Returns:
            Dictionary containing performance metrics summary
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)

        with self._lock:
            recent_metrics = [m for m in self._metrics if m.timestamp >= cutoff_time]

        if not recent_metrics:
            return {"message": "No metrics available for the specified period"}

        # Calculate summary statistics
        total_operations = len(recent_metrics)
        successful_operations = len([m for m in recent_metrics if m.success])
        success_rate = (successful_operations / total_operations) * 100

        total_times = [m.total_time_ms for m in recent_metrics]
        transcription_times = [m.transcription_time_ms for m in recent_metrics if m.transcription_time_ms > 0]
        classification_times = [m.classification_time_ms for m in recent_metrics if m.classification_time_ms > 0]

        # Method usage statistics
        method_counts = {}
        for metrics in recent_metrics:
            method = metrics.method_used
            method_counts[method] = method_counts.get(method, 0) + 1

        # Confidence score statistics
        confidence_scores = [m.confidence_score for m in recent_metrics if m.confidence_score is not None]

        summary = {
            "period_hours": hours,
            "total_operations": total_operations,
            "successful_operations": successful_operations,
            "success_rate_percent": round(success_rate, 2),
            "timing_metrics": {
                "avg_total_time_ms": round(sum(total_times) / len(total_times), 2) if total_times else 0,
                "min_total_time_ms": min(total_times) if total_times else 0,
                "max_total_time_ms": max(total_times) if total_times else 0,
                "avg_transcription_time_ms": round(sum(transcription_times) / len(transcription_times), 2) if transcription_times else 0,
                "avg_classification_time_ms": round(sum(classification_times) / len(classification_times), 2) if classification_times else 0,
            },
            "method_usage": method_counts,
            "confidence_metrics": {
                "avg_confidence": round(sum(confidence_scores) / len(confidence_scores), 3) if confidence_scores else 0,
                "min_confidence": min(confidence_scores) if confidence_scores else 0,
                "max_confidence": max(confidence_scores) if confidence_scores else 0,
            }
        }

        return summary

    def export_metrics(self, file_path: str, hours: int = 24):
        """
        Export metrics to a JSON file.

        Args:
            file_path: Path to export the metrics
            hours: Number of hours of metrics to export
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)

        with self._lock:
            recent_metrics = [m for m in self._metrics if m.timestamp >= cutoff_time]

        # Convert to serializable format
        export_data = {
            "export_timestamp": datetime.now().isoformat(),
            "period_hours": hours,
            "metrics_count": len(recent_metrics),
            "metrics": [
                {
                    "timestamp": m.timestamp.isoformat(),
                    "audio_file_path": m.audio_file_path,
                    "transcription_time_ms": m.transcription_time_ms,
                    "classification_time_ms": m.classification_time_ms,
                    "total_time_ms": m.total_time_ms,
                    "success": m.success,
                    "method_used": m.method_used,
                    "confidence_score": m.confidence_score,
                    "category": m.category,
                    "error": m.error
                }
                for m in recent_metrics
            ]
        }

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Exported {len(recent_metrics)} metrics to {file_path}")


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


# Context manager for easy monitoring
class ClassificationSession:
    """Context manager for monitoring classification sessions."""

    def __init__(self, audio_file_path: str):
        """Initialize classification session context manager."""
        self.audio_file_path = audio_file_path
        self.session_id = None

    def __enter__(self):
        """Start monitoring session."""
        self.session_id = performance_monitor.start_classification_session(self.audio_file_path)
        return performance_monitor

    def __exit__(self, exc_type, exc_val, exc_tb):
        """End monitoring session."""
        performance_monitor.end_classification_session()