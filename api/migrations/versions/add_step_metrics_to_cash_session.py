"""add_step_metrics_to_cash_session

Revision ID: add_step_metrics_to_cash_session
Revises: f93987027864
Create Date: 2025-01-27 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_step_metrics_to_cash_session'
down_revision: Union[str, None] = '9ca74a277c0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type for cash session steps (idempotent)
    cash_session_step = postgresql.ENUM('ENTRY', 'SALE', 'EXIT', name='cashsessionstep', create_type=True)
    cash_session_step.create(op.get_bind(), checkfirst=True)

    # Check if columns already exist before adding (idempotent migration)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('cash_sessions')]

    # Add new columns to cash_sessions table only if they don't exist
    if 'current_step' not in existing_columns:
        op.add_column('cash_sessions',
            sa.Column('current_step', cash_session_step, nullable=True, default=None,
                     comment="Étape actuelle du workflow (entry/sale/exit)")
        )
    if 'last_activity' not in existing_columns:
        op.add_column('cash_sessions',
            sa.Column('last_activity', sa.DateTime(timezone=True), nullable=True, default=None,
                     comment="Dernière activité utilisateur pour gestion du timeout")
        )
    if 'step_start_time' not in existing_columns:
        op.add_column('cash_sessions',
            sa.Column('step_start_time', sa.DateTime(timezone=True), nullable=True, default=None,
                     comment="Début de l'étape actuelle pour métriques de performance")
        )


def downgrade() -> None:
    # Remove the new columns
    op.drop_column('cash_sessions', 'step_start_time')
    op.drop_column('cash_sessions', 'last_activity')
    op.drop_column('cash_sessions', 'current_step')

    # Drop the enum type
    cash_session_step = postgresql.ENUM('ENTRY', 'SALE', 'EXIT', name='cashsessionstep')
    cash_session_step.drop(op.get_bind(), checkfirst=True)


