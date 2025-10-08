"""add donation and payment method to sales

Revision ID: o2p3q4r5s6t7
Revises: n1o2p3q4r5s6
Create Date: 2025-10-07 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'o2p3q4r5s6t7'
down_revision: Union[str, None] = 'n1o2p3q4r5s6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add donation column to sales table
    op.add_column('sales', sa.Column('donation', sa.Float(), nullable=True, server_default='0.0'))

    # Add payment_method column to sales table
    op.add_column('sales', sa.Column('payment_method', sa.String(length=20), nullable=True, server_default='cash'))


def downgrade() -> None:
    # Remove payment_method column
    op.drop_column('sales', 'payment_method')

    # Remove donation column
    op.drop_column('sales', 'donation')
