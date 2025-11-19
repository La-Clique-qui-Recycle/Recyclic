"""add_preset_buttons_table

Revision ID: a1b2c3d4e5f6
Revises: add_step_metrics_to_cash_session
Create Date: 2025-01-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'add_step_metrics_to_cash_session'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for button_type
    button_type_enum = sa.Enum('DONATION', 'RECYCLING', name='buttontype')

    # Create preset_buttons table
    op.create_table('preset_buttons',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category_id', sa.UUID(), nullable=False),
        sa.Column('preset_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('button_type', button_type_enum, nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_preset_buttons_name'), 'preset_buttons', ['name'], unique=False)
    op.create_index(op.f('ix_preset_buttons_category_id'), 'preset_buttons', ['category_id'], unique=False)
    op.create_index(op.f('ix_preset_buttons_button_type'), 'preset_buttons', ['button_type'], unique=False)
    op.create_index(op.f('ix_preset_buttons_sort_order'), 'preset_buttons', ['sort_order'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_preset_buttons_sort_order'), table_name='preset_buttons')
    op.drop_index(op.f('ix_preset_buttons_button_type'), table_name='preset_buttons')
    op.drop_index(op.f('ix_preset_buttons_category_id'), table_name='preset_buttons')
    op.drop_index(op.f('ix_preset_buttons_name'), table_name='preset_buttons')

    # Drop table
    op.drop_table('preset_buttons')

    # Drop enum type
    button_type_enum = sa.Enum('DONATION', 'RECYCLING', name='buttontype')
    button_type_enum.drop(op.get_bind(), checkfirst=True)
