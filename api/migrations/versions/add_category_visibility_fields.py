"""add_category_visibility_fields

Revision ID: story_12_add_category_visibility
Revises: a1b2c3d4e5f6
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'story_12_add_category_visibility'
down_revision = 'story112_preset_notes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to categories table
    op.add_column('categories', sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('categories', sa.Column('is_visible', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('categories', sa.Column('shortcut_key', sa.String(), nullable=True))
    
    # IMPORTANT: Update existing categories to have is_visible=True (backward compatibility)
    # The server_default only applies to new rows, so we need to explicitly update existing ones
    op.execute("UPDATE categories SET is_visible = true WHERE is_visible IS NULL OR is_visible = false")
    
    # Create indexes for performance
    op.create_index(op.f('ix_categories_display_order'), 'categories', ['display_order'], unique=False)
    op.create_index(op.f('ix_categories_is_visible'), 'categories', ['is_visible'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_categories_is_visible'), table_name='categories')
    op.drop_index(op.f('ix_categories_display_order'), table_name='categories')
    
    # Drop columns
    op.drop_column('categories', 'shortcut_key')
    op.drop_column('categories', 'is_visible')
    op.drop_column('categories', 'display_order')

