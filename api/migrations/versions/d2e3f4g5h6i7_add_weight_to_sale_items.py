"""add weight to sale_items

Revision ID: d2e3f4g5h6i7
Revises: 9a2b3c4d5e6f
Create Date: 2025-10-02 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd2e3f4g5h6i7'
down_revision = '9a2b3c4d5e6f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add weight column to sale_items table
    op.add_column('sale_items', sa.Column('weight', sa.Float(), nullable=True))

    # Set default weight value for existing rows (0.0 or null)
    # Note: In production, you might want to migrate existing quantity values to weight
    op.execute("UPDATE sale_items SET weight = 0.0 WHERE weight IS NULL")

    # Make weight column non-nullable after setting defaults
    op.alter_column('sale_items', 'weight', nullable=False)


def downgrade() -> None:
    # Remove weight column
    op.drop_column('sale_items', 'weight')
