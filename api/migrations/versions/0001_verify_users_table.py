"""verify_users_table

Revision ID: 0001
Revises: 0000
Create Date: 2025-01-27 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = '0000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Verify users table exists, create if missing
    connection = op.get_bind()
    
    # Check if users table exists
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        )
    """))
    
    if not result.scalar():
        # Create users table if missing
        op.create_table('users',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('telegram_id', sa.String(), nullable=False),
            sa.Column('username', sa.String(), nullable=True),
            sa.Column('first_name', sa.String(), nullable=True),
            sa.Column('last_name', sa.String(), nullable=True),
            sa.Column('role', sa.Enum(name='userrole'), nullable=False, server_default='user'),
            sa.Column('status', sa.Enum(name='userstatus'), nullable=False, server_default='pending'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('site_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_telegram_id'), 'users', ['telegram_id'], unique=True)


def downgrade() -> None:
    # This migration only creates if missing, so no downgrade needed
    pass
