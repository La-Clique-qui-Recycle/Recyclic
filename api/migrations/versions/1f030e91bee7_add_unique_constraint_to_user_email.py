"""add_unique_constraint_to_user_email

Revision ID: 1f030e91bee7
Revises: 335d7c71186e
Create Date: 2025-10-22 12:24:08.542018

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1f030e91bee7'
down_revision = '335d7c71186e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajouter une contrainte d'unicité sur la colonne email de la table users
    op.create_unique_constraint('uq_users_email', 'users', ['email'])


def downgrade() -> None:
    # Supprimer la contrainte d'unicité sur la colonne email
    op.drop_constraint('uq_users_email', 'users', type_='unique')
