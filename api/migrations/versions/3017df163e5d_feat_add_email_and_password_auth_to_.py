"""feat: add email and password auth to user model

Revision ID: 3017df163e5d
Revises: ad54dca40eca
Create Date: 2025-09-17 00:53:28.080902

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3017df163e5d'
down_revision = 'ad54dca40eca'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email and hashed_password columns to users table (nullable first)
    op.add_column('users', sa.Column('email', sa.String(), nullable=True))
    op.add_column('users', sa.Column('hashed_password', sa.String(), nullable=True))

    # Set default values for existing users
    op.execute("UPDATE users SET email = 'temp_' || id::text || '@temporary.com' WHERE email IS NULL")
    op.execute("UPDATE users SET hashed_password = 'temp_password_will_be_reset' WHERE hashed_password IS NULL")

    # Now make them NOT NULL
    op.alter_column('users', 'email', nullable=False)
    op.alter_column('users', 'hashed_password', nullable=False)

    # Make telegram_id nullable and remove unique constraint
    op.alter_column('users', 'telegram_id',
                   existing_type=sa.VARCHAR(),
                   nullable=True)

    # Drop the unique index on telegram_id and recreate it as non-unique
    op.drop_index(op.f('ix_users_telegram_id'), table_name='users')
    op.create_index(op.f('ix_users_telegram_id'), 'users', ['telegram_id'], unique=False)

    # Create unique index for email
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    # Remove unique index for email
    op.drop_index(op.f('ix_users_email'), table_name='users')

    # Restore unique index on telegram_id
    op.drop_index(op.f('ix_users_telegram_id'), table_name='users')
    op.create_index(op.f('ix_users_telegram_id'), 'users', ['telegram_id'], unique=True)

    # Make telegram_id non-nullable
    op.alter_column('users', 'telegram_id',
                   existing_type=sa.VARCHAR(),
                   nullable=False)

    # Remove email and hashed_password columns
    op.drop_column('users', 'hashed_password')
    op.drop_column('users', 'email')
