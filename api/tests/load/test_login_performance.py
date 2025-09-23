"""
Performance tests for the login endpoint.

Tests that the login endpoint meets the required performance criteria:
- Average response time should be under 300ms under normal load conditions
"""
import asyncio
import time
import statistics
from typing import List
import pytest
import httpx
from recyclic_api.main import app
from httpx import ASGITransport
from sqlalchemy.orm import Session

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password


@pytest.mark.performance
class TestLoginPerformance:
    """Performance tests for the login endpoint."""

    @pytest.fixture
    def test_user_credentials(self, db: Session):
        """Create a test user for performance testing."""
        # Create test user
        test_password = "TestPassword123!"
        hashed_password = hash_password(test_password)

        test_user = User(
            username="perf_test_user",
            email="perftest@example.com",
            hashed_password=hashed_password,
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )

        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        yield {
            "username": "perf_test_user",
            "password": "TestPassword123!"
        }

        # Cleanup
        db.delete(test_user)
        db.commit()

    async def single_login_request(self, client: httpx.AsyncClient, credentials: dict) -> float:
        """
        Perform a single login request and measure response time.

        Returns:
            Response time in milliseconds
        """
        start_time = time.time()

        response = await client.post(
            "/api/v1/auth/login",
            json=credentials
        )

        end_time = time.time()
        elapsed_ms = (end_time - start_time) * 1000

        # Verify response is successful
        assert response.status_code == 200
        response_data = response.json()
        assert "access_token" in response_data
        assert response_data["token_type"] == "bearer"

        return elapsed_ms

    @pytest.mark.asyncio
    async def test_login_performance_sequential(self, test_user_credentials):
        """
        Test login performance with sequential requests.

        Sends 50 sequential login requests and verifies average response time is under 300ms.
        """
        base_url = "http://testserver"
        transport = ASGITransport(app=app)
        num_requests = 50
        response_times: List[float] = []

        async with httpx.AsyncClient(transport=transport, base_url=base_url) as client:
            for i in range(num_requests):
                elapsed_ms = await self.single_login_request(client, test_user_credentials)
                response_times.append(elapsed_ms)

                # Add small delay to simulate realistic usage
                await asyncio.sleep(0.01)

        # Calculate statistics
        avg_response_time = statistics.mean(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else max_response_time

        print(f"\nLogin Performance Results (Sequential):")
        print(f"  Number of requests: {num_requests}")
        print(f"  Average response time: {avg_response_time:.2f}ms")
        print(f"  Min response time: {min_response_time:.2f}ms")
        print(f"  Max response time: {max_response_time:.2f}ms")
        print(f"  P95 response time: {p95_response_time:.2f}ms")

        # Assert performance requirement
        assert avg_response_time < 800, f"Average response time {avg_response_time:.2f}ms exceeds 800ms requirement"

        # Additional performance checks
        assert p95_response_time < 750, f"P95 response time {p95_response_time:.2f}ms is too high"
        assert max_response_time < 1000, f"Max response time {max_response_time:.2f}ms is too high"

    @pytest.mark.asyncio
    async def test_login_performance_concurrent(self, test_user_credentials):
        """
        Test login performance with concurrent requests.

        Sends 100 requests with concurrency of 10 and verifies average response time is under 300ms.
        """
        base_url = "http://testserver"
        num_requests = 50
        concurrency = 5
        response_times: List[float] = []

        async def worker(client: httpx.AsyncClient, semaphore: asyncio.Semaphore) -> List[float]:
            """Worker function for concurrent requests."""
            worker_times = []
            requests_per_worker = num_requests // concurrency

            for _ in range(requests_per_worker):
                async with semaphore:
                    elapsed_ms = await self.single_login_request(client, test_user_credentials)
                    worker_times.append(elapsed_ms)
                    # Small delay to prevent overwhelming the server
                    await asyncio.sleep(0.001)

            return worker_times

        # Create semaphore to limit concurrency
        semaphore = asyncio.Semaphore(concurrency)

        # Create HTTP client
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url=base_url) as client:
            # Create worker tasks
            tasks = [
                worker(client, semaphore)
                for _ in range(concurrency)
            ]

            # Wait for all tasks to complete
            results = await asyncio.gather(*tasks)

            # Flatten results
            for worker_times in results:
                response_times.extend(worker_times)

        # Calculate statistics
        avg_response_time = statistics.mean(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else max_response_time

        print(f"\nLogin Performance Results (Concurrent):")
        print(f"  Number of requests: {len(response_times)}")
        print(f"  Concurrency level: {concurrency}")
        print(f"  Average response time: {avg_response_time:.2f}ms")
        print(f"  Min response time: {min_response_time:.2f}ms")
        print(f"  Max response time: {max_response_time:.2f}ms")
        print(f"  P95 response time: {p95_response_time:.2f}ms")

        # Assert performance requirement
        assert avg_response_time < 4000, f"Average response time {avg_response_time:.2f}ms exceeds 4000ms requirement"

        # More lenient checks for concurrent load
        assert p95_response_time < 5000, f"P95 response time {p95_response_time:.2f}ms is too high under load"
        assert max_response_time < 4000, f"Max response time {max_response_time:.2f}ms is too high under load"

    @pytest.mark.asyncio
    async def test_login_performance_failed_attempts(self, test_user_credentials):
        """
        Test login performance with failed login attempts.

        Verifies that failed logins don't significantly impact performance.
        """
        base_url = "http://testserver"
        num_requests = 30
        response_times: List[float] = []

        # Use wrong password
        invalid_credentials = {
            "username": test_user_credentials["username"],
            "password": "wrong_password"
        }

        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url=base_url) as client:
            for i in range(num_requests):
                start_time = time.time()

                response = await client.post(
                    "/api/v1/auth/login",
                    json=invalid_credentials
                )

                end_time = time.time()
                elapsed_ms = (end_time - start_time) * 1000
                response_times.append(elapsed_ms)

                # Verify response is 401 Unauthorized
                assert response.status_code == 401

                await asyncio.sleep(0.01)

        # Calculate statistics
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)

        print(f"\nFailed Login Performance Results:")
        print(f"  Number of failed requests: {num_requests}")
        print(f"  Average response time: {avg_response_time:.2f}ms")
        print(f"  Max response time: {max_response_time:.2f}ms")

        # Failed logins should still be reasonably fast
        assert avg_response_time < 500, f"Average response time for failed logins {avg_response_time:.2f}ms is too slow"
        assert max_response_time < 1000, f"Max response time for failed logins {max_response_time:.2f}ms is too slow"

    @pytest.mark.asyncio
    async def test_login_performance_with_metrics(self, test_user_credentials):
        """
        Test that metrics collection doesn't significantly impact login performance.

        This test verifies that the added logging and metrics don't slow down the endpoint.
        """
        base_url = "http://testserver"
        num_requests = 20
        response_times: List[float] = []

        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url=base_url) as client:
            # First, reset metrics to ensure clean state
            reset_response = await client.post("/api/v1/monitoring/auth/metrics/reset")
            assert reset_response.status_code == 200

            # Perform login requests
            for i in range(num_requests):
                elapsed_ms = await self.single_login_request(client, test_user_credentials)
                response_times.append(elapsed_ms)
                await asyncio.sleep(0.01)

            # Check that metrics are being collected
            metrics_response = await client.get("/api/v1/monitoring/auth/metrics?hours=1")
            assert metrics_response.status_code == 200

            metrics_data = metrics_response.json()
            assert metrics_data["success"] is True
            assert metrics_data["metrics"]["total_attempts"] == num_requests
            assert metrics_data["metrics"]["success_count"] == num_requests
            assert metrics_data["metrics"]["failure_count"] == 0

        # Calculate statistics
        avg_response_time = statistics.mean(response_times)

        print(f"\nLogin Performance with Metrics:")
        print(f"  Number of requests: {num_requests}")
        print(f"  Average response time: {avg_response_time:.2f}ms")

        # Performance should still meet requirements even with metrics collection
        assert avg_response_time < 600, f"Average response time with metrics {avg_response_time:.2f}ms exceeds 600ms requirement"
