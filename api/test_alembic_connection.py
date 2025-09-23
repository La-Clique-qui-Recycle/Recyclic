#!/usr/bin/env python3
"""
Test script to debug Alembic connection issues
"""
import os
import sys
from sqlalchemy import create_engine

def test_connection():
    """Test database connection using different methods"""

    print("=== Testing Database Connection ===")

    # Method 1: Direct connection with individual variables
    print("\n1. Testing with individual variables:")
    postgres_host = os.getenv("POSTGRES_HOST")
    postgres_user = os.getenv("POSTGRES_USER")
    postgres_password = os.getenv("POSTGRES_PASSWORD")
    postgres_port = os.getenv("POSTGRES_PORT", "5432")
    postgres_db = os.getenv("POSTGRES_DB")

    print(f"POSTGRES_HOST: {postgres_host}")
    print(f"POSTGRES_USER: {postgres_user}")
    print(f"POSTGRES_PASSWORD: {postgres_password}")
    print(f"POSTGRES_PORT: {postgres_port}")
    print(f"POSTGRES_DB: {postgres_db}")

    if all([postgres_host, postgres_user, postgres_password, postgres_db]):
        url1 = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
        print(f"URL: {url1}")

        try:
            engine = create_engine(url1)
            with engine.connect() as conn:
                result = conn.execute("SELECT 1")
                print(f"✅ Connection successful: {result.fetchone()}")
        except Exception as e:
            print(f"❌ Connection failed: {e}")
    else:
        print("❌ Missing environment variables")

    # Method 2: Using DATABASE_URL
    print("\n2. Testing with DATABASE_URL:")
    database_url = os.getenv("DATABASE_URL")
    print(f"DATABASE_URL: {database_url}")

    if database_url:
        try:
            engine = create_engine(database_url)
            with engine.connect() as conn:
                result = conn.execute("SELECT 1")
                print(f"✅ Connection successful: {result.fetchone()}")
        except Exception as e:
            print(f"❌ Connection failed: {e}")
    else:
        print("❌ DATABASE_URL not set")

if __name__ == "__main__":
    test_connection()
