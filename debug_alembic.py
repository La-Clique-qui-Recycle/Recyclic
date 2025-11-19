#!/usr/bin/env python3
import os
from alembic.config import Config
from alembic import command

print("=== ALEMBIC DEBUG ===")
cfg = Config("api/alembic.ini")
print(f"Config file: api/alembic.ini")

try:
    print("Checking current revision...")
    command.current(cfg)
except Exception as e:
    print(f"Error getting current: {e}")

try:
    print("Checking history...")
    command.history(cfg)
except Exception as e:
    print(f"Error getting history: {e}")

print("=== END DEBUG ===")
