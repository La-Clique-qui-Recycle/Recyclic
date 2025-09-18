"""Add user_status_history table only

Revision ID: 69dba742f15b
Revises: 06c4a1b70fde
Create Date: 2025-09-18 04:04:12.677210

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '69dba742f15b'
down_revision = '06c4a1b70fde'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_status_history table
    op.create_table('user_status_history',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('changed_by_admin_id', sa.UUID(), nullable=False),
        sa.Column('old_status', sa.Boolean(), nullable=True),
        sa.Column('new_status', sa.Boolean(), nullable=False),
        sa.Column('change_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('reason', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['changed_by_admin_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_status_history_changed_by_admin_id'), 'user_status_history', ['changed_by_admin_id'], unique=False)
    op.create_index(op.f('ix_user_status_history_user_id'), 'user_status_history', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_status_history_user_id'), table_name='user_status_history')
    op.drop_index(op.f('ix_user_status_history_changed_by_admin_id'), table_name='user_status_history')
    op.drop_table('user_status_history')
