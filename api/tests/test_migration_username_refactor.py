"""
Integration tests for username refactor migration (06c4a1b70fde)
Tests the migration that switches from email-based to username-based authentication
"""
import pytest
import os
import tempfile
import shutil
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic import command
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.database import Base

class TestUsernameRefactorMigration:
    """Test suite for the username refactor migration"""

    @pytest.fixture(scope="class")
    def temp_db_url(self):
        """Create a temporary test database for migration testing"""
        return "postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_migration_test"

    @pytest.fixture(scope="class")
    def alembic_config(self, temp_db_url):
        """Create Alembic configuration for testing"""
        # Create temporary alembic.ini
        config = Config()
        config.set_main_option("script_location", "migrations")
        config.set_main_option("sqlalchemy.url", temp_db_url)
        return config

    @pytest.fixture(scope="class", autouse=True)
    def setup_test_database(self, temp_db_url):
        """Set up and tear down test database"""
        from sqlalchemy.engine.url import make_url

        # Create test database
        u = make_url(temp_db_url)
        admin_url = u.set(database="postgres")
        admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")

        with admin_engine.connect() as conn:
            # Drop if exists and create fresh
            conn.execute(text(f'DROP DATABASE IF EXISTS "{u.database}"'))
            conn.execute(text(f'CREATE DATABASE "{u.database}"'))

        admin_engine.dispose()

        yield

        # Cleanup
        with admin_engine.connect() as conn:
            conn.execute(text(f'DROP DATABASE IF EXISTS "{u.database}"'))
        admin_engine.dispose()

    def test_migration_from_scratch(self, temp_db_url, alembic_config):
        """Test running all migrations from scratch"""
        # Run all migrations up to the username refactor
        command.upgrade(alembic_config, "06c4a1b70fde")

        # Verify final schema
        engine = create_engine(temp_db_url)
        with engine.connect() as conn:
            # Check users table structure
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'users'
                AND column_name IN ('username', 'email', 'hashed_password', 'telegram_id')
                ORDER BY ordinal_position
            """))

            columns = {row[0]: {"type": row[1], "nullable": row[2] == "YES"} for row in result}

            # Verify correct schema
            assert "username" in columns
            assert columns["username"]["nullable"] == False  # NOT NULL

            assert "email" in columns
            assert columns["email"]["nullable"] == True  # NULLABLE

            assert "hashed_password" in columns
            assert columns["hashed_password"]["nullable"] == False  # NOT NULL

            assert "telegram_id" in columns
            assert columns["telegram_id"]["nullable"] == True  # NULLABLE

            # Check indexes
            result = conn.execute(text("""
                SELECT indexname, tablename
                FROM pg_indexes
                WHERE tablename = 'users'
                AND (indexname LIKE '%username%' OR indexname LIKE '%email%')
            """))

            indexes = [row[0] for row in result]
            assert "ix_users_username" in indexes  # Username index should exist
            assert "ix_users_email" not in indexes  # Email index should be gone

        engine.dispose()

    def test_migration_with_existing_data(self, temp_db_url, alembic_config):
        """Test migration with existing data (step by step)"""
        engine = create_engine(temp_db_url)

        # Step 1: Run migration up to email-based auth (before username refactor)
        command.upgrade(alembic_config, "3017df163e5d")

        # Step 2: Insert test data in old format
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO users (id, email, hashed_password, username, first_name, last_name, role, status, is_active)
                VALUES
                ('11111111-1111-1111-1111-111111111111', 'user1@test.com', 'password1', NULL, 'User', 'One', 'user', 'pending', true),
                ('22222222-2222-2222-2222-222222222222', 'user2@test.com', 'password2', NULL, 'User', 'Two', 'user', 'approved', true),
                ('33333333-3333-3333-3333-333333333333', 'user3@test.com', 'password3', 'existing_username', 'User', 'Three', 'admin', 'approved', true)
            """))
            conn.commit()

        # Step 3: Run the username refactor migration
        command.upgrade(alembic_config, "06c4a1b70fde")

        # Step 4: Verify data migration worked correctly
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, username, email, hashed_password
                FROM users
                ORDER BY email
            """))

            users = list(result)
            assert len(users) == 3

            # Check that usernames were generated for NULL values
            for user in users:
                user_id, username, email, password = user
                assert username is not None  # All should have usernames now
                assert username != ""
                assert password is not None

                if user_id == "33333333-3333-3333-3333-333333333333":
                    # This user already had a username
                    assert username == "existing_username"
                else:
                    # These users should have generated usernames
                    assert "_" in username  # Should contain email part + ID part

        engine.dispose()

    def test_migration_rollback(self, temp_db_url, alembic_config):
        """Test migration rollback functionality"""
        # Run forward migration
        command.upgrade(alembic_config, "06c4a1b70fde")

        engine = create_engine(temp_db_url)

        # Add some test data
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO users (id, username, email, hashed_password, first_name, role, status, is_active)
                VALUES ('44444444-4444-4444-4444-444444444444', 'testuser', 'test@example.com', 'password', 'Test', 'user', 'pending', true)
            """))
            conn.commit()

        # Rollback migration
        command.downgrade(alembic_config, "3017df163e5d")

        # Verify rollback worked
        with engine.connect() as conn:
            # Check schema rolled back
            result = conn.execute(text("""
                SELECT column_name, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'users'
                AND column_name IN ('username', 'email')
            """))

            columns = {row[0]: row[1] == "YES" for row in result}

            # After rollback: email should be NOT NULL, username should be NULLABLE
            assert columns["email"] == False  # NOT NULL (back to original)
            assert columns["username"] == True  # NULLABLE (back to original)

            # Check indexes rolled back
            result = conn.execute(text("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'users'
                AND (indexname LIKE '%username%' OR indexname LIKE '%email%')
            """))

            indexes = [row[0] for row in result]
            assert "ix_users_email" in indexes  # Email index should be back
            assert "ix_users_username" not in indexes  # Username index should be gone

        engine.dispose()

    def test_username_uniqueness_after_migration(self, temp_db_url, alembic_config):
        """Test that username uniqueness is enforced after migration"""
        # Run migration
        command.upgrade(alembic_config, "06c4a1b70fde")

        engine = create_engine(temp_db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        with SessionLocal() as db:
            # Create first user
            user1 = User(
                username="uniqueuser",
                email="user1@test.com",
                hashed_password="password1"
            )
            db.add(user1)
            db.commit()

            # Try to create second user with same username (should fail)
            user2 = User(
                username="uniqueuser",  # Duplicate username
                email="user2@test.com",
                hashed_password="password2"
            )
            db.add(user2)

            with pytest.raises(Exception):  # Should raise integrity error
                db.commit()

        engine.dispose()

    def test_email_non_uniqueness_after_migration(self, temp_db_url, alembic_config):
        """Test that email non-uniqueness works after migration"""
        # Run migration
        command.upgrade(alembic_config, "06c4a1b70fde")

        engine = create_engine(temp_db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        with SessionLocal() as db:
            # Create two users with same email (should work)
            user1 = User(
                username="user1",
                email="shared@test.com",
                hashed_password="password1"
            )
            user2 = User(
                username="user2",
                email="shared@test.com",  # Same email - should be allowed
                hashed_password="password2"
            )

            db.add(user1)
            db.add(user2)
            db.commit()  # Should succeed

            # Verify both users exist
            db.refresh(user1)
            db.refresh(user2)
            assert user1.email == "shared@test.com"
            assert user2.email == "shared@test.com"
            assert user1.username != user2.username  # But usernames are different

        engine.dispose()