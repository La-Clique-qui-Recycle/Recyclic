"""add price fields to categories

Revision ID: h2i3j4k5l6m7
Revises: 24b194c1b790
Create Date: 2025-10-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'h2i3j4k5l6m7'
down_revision = '8dfd79bd357d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add price, min_price, and max_price columns to categories table."""
    # Add price columns to categories
    op.add_column('categories', sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('categories', sa.Column('min_price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('categories', sa.Column('max_price', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    """Remove price columns from categories table."""
    op.drop_column('categories', 'max_price')
    op.drop_column('categories', 'min_price')
    op.drop_column('categories', 'price')
