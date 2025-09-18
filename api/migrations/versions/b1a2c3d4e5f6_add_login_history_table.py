"""add login_history table

Revision ID: b1a2c3d4e5f6
Revises: 69dba742f15b
Create Date: 2025-09-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b1a2c3d4e5f6'
down_revision = '69dba742f15b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'login_history',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('client_ip', sa.String(), nullable=True),
        sa.Column('error_type', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_login_history_user_id'), 'login_history', ['user_id'], unique=False)
    op.create_index(op.f('ix_login_history_username'), 'login_history', ['username'], unique=False)
    op.create_index(op.f('ix_login_history_success'), 'login_history', ['success'], unique=False)
    op.create_index(op.f('ix_login_history_created_at'), 'login_history', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_login_history_created_at'), table_name='login_history')
    op.drop_index(op.f('ix_login_history_success'), table_name='login_history')
    op.drop_index(op.f('ix_login_history_username'), table_name='login_history')
    op.drop_index(op.f('ix_login_history_user_id'), table_name='login_history')
    op.drop_table('login_history')


