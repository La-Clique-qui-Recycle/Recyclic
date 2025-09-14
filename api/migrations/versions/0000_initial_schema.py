"""initial_schema

Revision ID: 0000
Revises: 
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    print("DEBUG: Starting upgrade function")

    # Create users table - let SQLAlchemy handle enums automatically
    print("DEBUG: About to create users table")
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('telegram_id', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=False, server_default='user'),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    print("DEBUG: Users table created")
    op.create_index(op.f('ix_users_telegram_id'), 'users', ['telegram_id'], unique=True)
    print("DEBUG: Index created")
    print("DEBUG: Migration completed successfully")


def downgrade() -> None:
    # Drop users table
    op.drop_table('users')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS userstatus')
