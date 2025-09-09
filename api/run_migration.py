#!/usr/bin/env python3
"""Script to run Alembic migration"""
from alembic.config import Config
from alembic import command

def main():
    cfg = Config("alembic.ini")
    print("Running Alembic migration...")
    command.upgrade(cfg, "head")
    print("Migration completed!")

if __name__ == "__main__":
    main()
