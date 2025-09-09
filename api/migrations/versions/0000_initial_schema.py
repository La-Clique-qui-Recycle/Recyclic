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
    # Create UserRole enum if it doesn't exist
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'userrole'"))
    if not result.fetchone():
        connection.execute(sa.text("CREATE TYPE userrole AS ENUM ('super-admin', 'admin', 'manager', 'cashier', 'user')"))
    
    # Create UserStatus enum if it doesn't exist
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'userstatus'"))
    if not result.fetchone():
        connection.execute(sa.text("CREATE TYPE userstatus AS ENUM ('pending', 'approved', 'rejected')"))
    
    # Create users table if it doesn't exist
    if not op.get_bind().dialect.has_table(op.get_bind(), 'users'):
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
    # Drop users table
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE userrole')
    op.execute('DROP TYPE userstatus')
