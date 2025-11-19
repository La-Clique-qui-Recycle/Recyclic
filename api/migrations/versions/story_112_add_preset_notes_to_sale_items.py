"""Story 1.1.2: Add preset_id and notes to sale_items for per-item presets

Revision ID: story112_preset_notes
Revises: a1b2c3d4e5f6
Create Date: 2025-11-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'story112_preset_notes'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add notes column to sale_items (optional text field)
    op.add_column('sale_items', sa.Column('notes', sa.Text(), nullable=True))

    # Add preset_id column to sale_items (optional foreign key to preset_buttons)
    op.add_column('sale_items', sa.Column('preset_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Add foreign key constraint for preset_id
    op.create_foreign_key(
        'fk_sale_items_preset_id',
        'sale_items', 'preset_buttons',
        ['preset_id'], ['id'],
        ondelete='SET NULL'  # Set to NULL if preset is deleted
    )


def downgrade() -> None:
    # Remove foreign key constraint first
    op.drop_constraint('fk_sale_items_preset_id', 'sale_items', type_='foreignkey')

    # Remove the columns
    op.drop_column('sale_items', 'preset_id')
    op.drop_column('sale_items', 'notes')
