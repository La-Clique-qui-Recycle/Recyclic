"""
Classification cache for reducing duplicate API calls.

This module provides caching functionality for classification results
to improve performance and reduce API costs for repetitive classifications.
"""

import hashlib
import json
import logging
import time
from typing import Dict, Any, Optional
from threading import Lock
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ClassificationCache:
    """
    Cache for classification results to avoid redundant API calls.

    Uses transcription text as the key and caches the classification results
    with TTL (time-to-live) to ensure cache freshness.
    """

    def __init__(self, max_size: int = 1000, ttl_hours: int = 24):
        """
        Initialize the classification cache.

        Args:
            max_size: Maximum number of entries in the cache
            ttl_hours: Time-to-live for cache entries in hours
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_hours * 3600
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_times: Dict[str, float] = {}
        self._lock = Lock()

    def _generate_cache_key(self, transcription: str) -> str:
        """
        Generate a cache key from transcription text.

        Args:
            transcription: Transcribed audio text

        Returns:
            SHA256 hash of the normalized transcription
        """
        # Normalize the transcription for consistent caching
        normalized = transcription.lower().strip()
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())

        # Generate hash
        return hashlib.sha256(normalized.encode('utf-8')).hexdigest()[:16]

    def _is_expired(self, timestamp: float) -> bool:
        """
        Check if a cache entry is expired.

        Args:
            timestamp: Timestamp when the entry was cached

        Returns:
            True if the entry is expired, False otherwise
        """
        return time.time() - timestamp > self.ttl_seconds

    def _evict_expired_entries(self):
        """Remove expired entries from the cache."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if self._is_expired(entry["timestamp"])
        ]

        for key in expired_keys:
            del self._cache[key]
            if key in self._access_times:
                del self._access_times[key]

        if expired_keys:
            logger.debug(f"Evicted {len(expired_keys)} expired cache entries")

    def _evict_lru_entries(self):
        """Remove least recently used entries if cache is full."""
        if len(self._cache) <= self.max_size:
            return

        # Sort by access time and remove oldest entries
        sorted_keys = sorted(self._access_times.items(), key=lambda x: x[1])
        entries_to_remove = len(self._cache) - self.max_size + 1

        for key, _ in sorted_keys[:entries_to_remove]:
            if key in self._cache:
                del self._cache[key]
            if key in self._access_times:
                del self._access_times[key]

        logger.debug(f"Evicted {entries_to_remove} LRU cache entries")

    def get(self, transcription: str) -> Optional[Dict[str, Any]]:
        """
        Get cached classification result for a transcription.

        Args:
            transcription: Transcribed audio text

        Returns:
            Cached classification result or None if not found/expired
        """
        if not transcription or not transcription.strip():
            return None

        cache_key = self._generate_cache_key(transcription)

        with self._lock:
            # Clean up expired entries
            self._evict_expired_entries()

            # Check if key exists and is not expired
            if cache_key in self._cache:
                entry = self._cache[cache_key]

                if not self._is_expired(entry["timestamp"]):
                    # Update access time
                    self._access_times[cache_key] = time.time()

                    logger.debug(f"Cache hit for transcription: {transcription[:50]}...")
                    return entry["result"]
                else:
                    # Remove expired entry
                    del self._cache[cache_key]
                    if cache_key in self._access_times:
                        del self._access_times[cache_key]

            logger.debug(f"Cache miss for transcription: {transcription[:50]}...")
            return None

    def put(self, transcription: str, classification_result: Dict[str, Any]):
        """
        Cache a classification result.

        Args:
            transcription: Transcribed audio text
            classification_result: Classification result to cache
        """
        if not transcription or not transcription.strip():
            return

        cache_key = self._generate_cache_key(transcription)
        current_time = time.time()

        with self._lock:
            # Clean up expired entries
            self._evict_expired_entries()

            # Ensure we don't exceed max size
            self._evict_lru_entries()

            # Store the entry
            self._cache[cache_key] = {
                "timestamp": current_time,
                "transcription": transcription,
                "result": classification_result.copy()
            }
            self._access_times[cache_key] = current_time

            logger.debug(f"Cached classification for transcription: {transcription[:50]}...")

    def clear(self):
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()
            self._access_times.clear()
            logger.info("Classification cache cleared")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary containing cache statistics
        """
        with self._lock:
            # Clean up expired entries for accurate stats
            self._evict_expired_entries()

            current_time = time.time()
            total_entries = len(self._cache)

            # Calculate age distribution
            ages = [current_time - entry["timestamp"] for entry in self._cache.values()]
            avg_age_hours = (sum(ages) / len(ages) / 3600) if ages else 0

            return {
                "total_entries": total_entries,
                "max_size": self.max_size,
                "cache_utilization_percent": round((total_entries / self.max_size) * 100, 2),
                "ttl_hours": self.ttl_seconds / 3600,
                "average_age_hours": round(avg_age_hours, 2),
                "memory_usage_estimate_kb": round(
                    sum(len(json.dumps(entry).encode('utf-8')) for entry in self._cache.values()) / 1024, 2
                )
            }

    def export_cache(self, file_path: str):
        """
        Export cache contents to a JSON file.

        Args:
            file_path: Path to export the cache
        """
        with self._lock:
            export_data = {
                "export_timestamp": datetime.now().isoformat(),
                "cache_stats": self.get_stats(),
                "entries": [
                    {
                        "cache_key": key,
                        "timestamp": entry["timestamp"],
                        "age_hours": (time.time() - entry["timestamp"]) / 3600,
                        "transcription": entry["transcription"],
                        "result": entry["result"]
                    }
                    for key, entry in self._cache.items()
                ]
            }

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)

            logger.info(f"Exported {len(self._cache)} cache entries to {file_path}")


# Global cache instance
classification_cache = ClassificationCache(max_size=1000, ttl_hours=24)


# Convenience functions
def get_cached_classification(transcription: str) -> Optional[Dict[str, Any]]:
    """
    Get cached classification result.

    Args:
        transcription: Transcribed audio text

    Returns:
        Cached classification result or None
    """
    return classification_cache.get(transcription)


def cache_classification(transcription: str, result: Dict[str, Any]):
    """
    Cache a classification result.

    Args:
        transcription: Transcribed audio text
        result: Classification result to cache
    """
    classification_cache.put(transcription, result)


def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics.

    Returns:
        Dictionary containing cache statistics
    """
    return classification_cache.get_stats()