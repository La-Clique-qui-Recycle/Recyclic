"""drop min_price from categories

Revision ID: m3npr1c3dr0p
Revises: h2i3j4k5l6m7
Create Date: 2025-10-07 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'm3npr1c3dr0p'
down_revision = 'h2i3j4k5l6m7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Drop the min_price column from categories table."""
    with op.batch_alter_table('categories') as batch_op:
        batch_op.drop_column('min_price')


def downgrade() -> None:
    """Recreate the min_price column on downgrade."""
    with op.batch_alter_table('categories') as batch_op:
        batch_op.add_column(sa.Column('min_price', sa.Numeric(precision=10, scale=2), nullable=True))


