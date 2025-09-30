"""add destination to ligne_depot

Revision ID: 9a2b3c4d5e6f
Revises: 8f2b7a1d4e6b
Create Date: 2025-09-30 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9a2b3c4d5e6f"
down_revision = "8f2b7a1d4e6b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ligne_depot", sa.Column("destination", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("ligne_depot", "destination")


