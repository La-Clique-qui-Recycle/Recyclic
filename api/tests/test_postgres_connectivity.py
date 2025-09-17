import os
import pytest
from sqlalchemy import create_engine, text
from redis import Redis
from recyclic_api.core.config import settings

def test_postgres_connectivity():
    """Test PostgreSQL connection"""
    url = os.environ.get("TEST_DATABASE_URL") or settings.TEST_DATABASE_URL or "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test"
    engine = create_engine(url, pool_pre_ping=True)
    with engine.connect() as conn:
        assert conn.execute(text("SELECT 1")).scalar() == 1

def test_redis_connectivity():
    """Test Redis connection"""
    url = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
    r = Redis.from_url(url, decode_responses=True)
    assert r.ping() is True

@pytest.mark.integration_db
def test_postgres_database_creation():
    """Test that test database can be created and used"""
    url = os.environ.get("TEST_DATABASE_URL") or settings.TEST_DATABASE_URL or "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test"
    
    # Test connection
    engine = create_engine(url, pool_pre_ping=True)
    with engine.connect() as conn:
        # Test basic query
        result = conn.execute(text("SELECT current_database()")).scalar()
        assert "recyclic_test" in result
        
        # Test table creation capability
        conn.execute(text("CREATE TEMP TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(50))"))
        conn.execute(text("INSERT INTO test_table (name) VALUES ('test')"))
        result = conn.execute(text("SELECT name FROM test_table WHERE id = 1")).scalar()
        assert result == "test"

@pytest.mark.integration_db
def test_redis_operations():
    """Test Redis basic operations"""
    url = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
    r = Redis.from_url(url, decode_responses=True)
    
    # Test basic operations
    r.set("test_key", "test_value", ex=60)
    value = r.get("test_key")
    assert value == "test_value"
    
    # Test list operations
    r.lpush("test_list", "item1", "item2")
    length = r.llen("test_list")
    assert length == 2
    
    # Cleanup
    r.delete("test_key", "test_list")
