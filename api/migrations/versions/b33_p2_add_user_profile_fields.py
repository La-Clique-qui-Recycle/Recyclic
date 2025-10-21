"""add optional profile fields to users

Revision ID: b33p2_add_user_profile_fields
Revises: p1q2r3s4t5u6
Create Date: 2025-10-20
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b33p2_add_user_profile_fields'
down_revision = 'p1q2r3s4t5u6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('phone_number', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('address', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('skills', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('availability', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('availability')
        batch_op.drop_column('skills')
        batch_op.drop_column('notes')
        batch_op.drop_column('address')
        batch_op.drop_column('phone_number')


