"""
Root-level pytest fixtures for API tests outside api/tests/.
Ensures a TestClient `client` is available and environment is set to test.
"""
import os
import pytest
from fastapi.testclient import TestClient

# Ensure test environment
os.environ.setdefault("ENVIRONMENT", "test")

try:
    from recyclic_api.main import app
except Exception:  # pragma: no cover
    app = None


@pytest.fixture
def client():
    """Provide a FastAPI TestClient for tests in root tests/ directory."""
    assert app is not None, "FastAPI app could not be imported"
    c = TestClient(app)
    # Also expose a global variable for legacy tests expecting a module-level `client`
    globals()["client"] = c
    return c


