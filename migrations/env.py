from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool

# This Alembic env proxies to the project's migrations but respects the
# provided alembic Config sqlalchemy.url (used by tests).

# Alembic Config
config = context.config

# Configure logging if alembic.ini is present
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# No autogenerate in tests; avoid importing project metadata to prevent side effects
target_metadata = None


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    ini_section = config.get_section(config.config_ini_section) or {}
    connectable = engine_from_config(
        ini_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    # Ensure engine fully disposed to release DB for teardown drops
    try:
        connectable.dispose()
    except Exception:
        pass


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
