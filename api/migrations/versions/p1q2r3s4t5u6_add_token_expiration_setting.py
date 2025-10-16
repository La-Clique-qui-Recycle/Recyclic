"""add token expiration setting

Revision ID: p1q2r3s4t5u6
Revises: o2p3q4r5s6t7
Create Date: 2025-01-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'p1q2r3s4t5u6'
down_revision: Union[str, None] = 'o2p3q4r5s6t7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert default token expiration setting (480 minutes = 8 hours)
    op.execute("""
        INSERT INTO settings (id, key, value)
        VALUES (gen_random_uuid(), 'token_expiration_minutes', '480')
        ON CONFLICT (key) DO NOTHING
    """)


def downgrade() -> None:
    # Remove token expiration setting
    op.execute("DELETE FROM settings WHERE key = 'token_expiration_minutes'")

