"""
Integration test for auth metrics endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestAuthMetricsIntegration:
    """Integration tests for auth metrics endpoints."""

    def test_auth_metrics_endpoint_exists(self, client: TestClient):
        """Test that auth metrics endpoint is accessible."""
        response = client.get("/api/v1/monitoring/auth/metrics")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert "metrics" in data

    def test_auth_metrics_prometheus_endpoint_exists(self, client: TestClient):
        """Test that Prometheus metrics endpoint is accessible."""
        response = client.get("/api/v1/monitoring/auth/metrics/prometheus")
        assert response.status_code == 200

        # Response should be plain text with metrics
        assert isinstance(response.text, str)

    def test_auth_metrics_reset_endpoint_exists(self, client: TestClient):
        """Test that metrics reset endpoint is accessible."""
        response = client.post("/api/v1/monitoring/auth/metrics/reset")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert "message" in data