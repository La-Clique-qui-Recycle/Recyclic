"""add operator to sales

Revision ID: f4g5h6i7j8k9
Revises: e3f4g5h6i7j8
Create Date: 2025-10-03 10:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'f4g5h6i7j8k9'
down_revision = 'e3f4g5h6i7j8'
branch_labels = None
depends_on = None


def upgrade():
    # Add operator_id column to sales table
    op.add_column('sales', sa.Column('operator_id', UUID(as_uuid=True), nullable=True))

    # Create foreign key constraint
    op.create_foreign_key(
        'fk_sales_operator_id_users',
        'sales',
        'users',
        ['operator_id'],
        ['id']
    )


def downgrade():
    op.drop_constraint('fk_sales_operator_id_users', 'sales', type_='foreignkey')
    op.drop_column('sales', 'operator_id')
