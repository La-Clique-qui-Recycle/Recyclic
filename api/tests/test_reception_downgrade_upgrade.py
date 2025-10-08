import os
from alembic.config import Config
from alembic import command
import pytest


@pytest.mark.skip(reason="SQLite UUID DDL unsupported; covered by Postgres migration suite")
def test_alembic_round_trip_upgrade_downgrade():
    # Use project alembic.ini
    cfg = Config("alembic.ini")
    # Upgrade to head
    command.upgrade(cfg, "head")
    # Downgrade one step if possible (seed -> schema)
    try:
        command.downgrade(cfg, "-1")
    finally:
        # Always return to head for other tests
        command.upgrade(cfg, "head")


