from logging.config import fileConfig
from sqlalchemy import engine_from_config, create_engine
from sqlalchemy import pool
from alembic import context
import os
import sys

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from recyclic_api.core.config import settings
from recyclic_api.core.database import Base
from recyclic_api.models import *  # Import all models

# Force the correct URL in Alembic configuration at startup
# This overrides any localhost configuration
correct_url = os.getenv("DATABASE_URL")
if correct_url:
    context.config.set_main_option("sqlalchemy.url", correct_url)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def get_url():
    # Debug: print all relevant environment variables
    print("=== DEBUG ENV VARS ===")
    print(f"TEST_DATABASE_URL: {os.getenv('TEST_DATABASE_URL')}")
    print(f"POSTGRES_HOST: {os.getenv('POSTGRES_HOST')}")
    print(f"POSTGRES_USER: {os.getenv('POSTGRES_USER')}")
    print(f"POSTGRES_PASSWORD: {os.getenv('POSTGRES_PASSWORD')}")
    print(f"POSTGRES_PORT: {os.getenv('POSTGRES_PORT')}")
    print(f"POSTGRES_DB: {os.getenv('POSTGRES_DB')}")
    print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
    print("=== END DEBUG ===")

    # For tests, prefer TEST_DATABASE_URL when provided (docker-compose api-tests)
    test_url = os.getenv("TEST_DATABASE_URL")
    if test_url:
        return test_url

    # First priority: build URL from individual environment variables (for Docker)
    postgres_host = os.getenv("POSTGRES_HOST")
    postgres_user = os.getenv("POSTGRES_USER")
    postgres_password = os.getenv("POSTGRES_PASSWORD")
    postgres_port = os.getenv("POSTGRES_PORT", "5432")
    postgres_db = os.getenv("POSTGRES_DB")

    if postgres_host and postgres_user and postgres_password and postgres_db:
        return f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

    # Otherwise, prefer alembic.ini sqlalchemy.url if set
    cfg_url = config.get_main_option("sqlalchemy.url")
    if cfg_url:
        return cfg_url

    # Fallback to application settings
    return settings.DATABASE_URL

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Debug: check what URL Alembic is using
    print("=== DEBUG ALEMBIC CONFIG ===")
    print(f"sqlalchemy.url: {config.get_main_option('sqlalchemy.url')}")
    print("=== END DEBUG ===")

    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
