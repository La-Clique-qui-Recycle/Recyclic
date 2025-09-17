"""refactor: set user login to username

Revision ID: 06c4a1b70fde
Revises: 3017df163e5d
Create Date: 2025-09-17 01:11:22.861179

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '06c4a1b70fde'
down_revision = '3017df163e5d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Ensure all users have a username
    # Set username from email (removing @domain.com) for users without username
    op.execute("""
        UPDATE users
        SET username = split_part(email, '@', 1) || '_' || SUBSTRING(id::text, 1, 6)
        WHERE username IS NULL
    """)

    # Step 2: Make username unique and not null
    op.alter_column('users', 'username',
                   existing_type=sa.VARCHAR(),
                   nullable=False)

    # Step 3: Create unique index on username
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Step 4: Make email nullable and non-unique
    op.alter_column('users', 'email',
                   existing_type=sa.VARCHAR(),
                   nullable=True)

    # Step 5: Drop unique index on email
    op.drop_index(op.f('ix_users_email'), table_name='users')


def downgrade() -> None:
    # Reverse the changes

    # Step 1: Recreate unique index on email
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Step 2: Make email non-nullable
    op.alter_column('users', 'email',
                   existing_type=sa.VARCHAR(),
                   nullable=False)

    # Step 3: Drop unique index on username
    op.drop_index(op.f('ix_users_username'), table_name='users')

    # Step 4: Make username nullable
    op.alter_column('users', 'username',
                   existing_type=sa.VARCHAR(),
                   nullable=True)
