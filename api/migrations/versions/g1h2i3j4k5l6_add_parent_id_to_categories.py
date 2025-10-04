"""add parent_id to categories table for hierarchy support

Revision ID: g1h2i3j4k5l6
Revises: f4g5h6i7j8k9
Create Date: 2025-01-27 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'g1h2i3j4k5l6'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    # Create categories table if it doesn't exist
    op.create_table(
        'categories',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
    )
    
    # Add parent_id column to categories table
    op.add_column('categories', sa.Column('parent_id', UUID(as_uuid=True), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_categories_parent_id_categories',
        'categories',
        'categories',
        ['parent_id'],
        ['id']
    )
    
    # Create index for better performance
    op.create_index('ix_categories_parent_id', 'categories', ['parent_id'])


def downgrade():
    op.drop_index('ix_categories_parent_id', table_name='categories')
    op.drop_constraint('fk_categories_parent_id_categories', 'categories', type_='foreignkey')
    op.drop_column('categories', 'parent_id')
