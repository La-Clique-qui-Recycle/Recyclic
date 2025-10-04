"""add pin and settings

Revision ID: e3f4g5h6i7j8
Revises: d2e3f4g5h6i7
Create Date: 2025-10-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'e3f4g5h6i7j8'
down_revision = 'd2e3f4g5h6i7'
branch_labels = None
depends_on = None


def upgrade():
    # Add pin column to users table
    op.add_column('users', sa.Column('hashed_pin', sa.String(), nullable=True))

    # Create settings table for global configuration
    op.create_table('settings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('key', sa.String(), nullable=False, unique=True),
        sa.Column('value', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create index on key for faster lookups
    op.create_index('ix_settings_key', 'settings', ['key'])


def downgrade():
    op.drop_index('ix_settings_key', table_name='settings')
    op.drop_table('settings')
    op.drop_column('users', 'hashed_pin')
