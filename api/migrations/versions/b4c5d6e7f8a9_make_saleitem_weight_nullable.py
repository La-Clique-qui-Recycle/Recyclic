"""make_saleitem_weight_nullable

Revision ID: b4c5d6e7f8a9
Revises: a1b2c3d4e5f6
Create Date: 2025-10-07 16:45:00.000000

"""
from alembic import op


revision = 'b4c5d6e7f8a9'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE sale_items ALTER COLUMN weight DROP NOT NULL;")


def downgrade() -> None:
    op.execute("UPDATE sale_items SET weight = 0 WHERE weight IS NULL;")
    op.execute("ALTER TABLE sale_items ALTER COLUMN weight SET NOT NULL;")


