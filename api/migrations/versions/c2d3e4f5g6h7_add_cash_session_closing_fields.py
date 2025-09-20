"""add cash session closing fields

Revision ID: c2d3e4f5g6h7
Revises: b1a2c3d4e5f6
Create Date: 2025-01-27 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2d3e4f5g6h7'
down_revision = 'b1a2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajouter les nouveaux champs à la table cash_sessions
    op.add_column('cash_sessions', sa.Column('closing_amount', sa.Float(), nullable=True, comment='Montant théorique calculé à la fermeture'))
    op.add_column('cash_sessions', sa.Column('actual_amount', sa.Float(), nullable=True, comment='Montant physique compté à la fermeture'))
    op.add_column('cash_sessions', sa.Column('variance', sa.Float(), nullable=True, comment='Écart entre théorique et physique'))
    op.add_column('cash_sessions', sa.Column('variance_comment', sa.String(), nullable=True, comment='Commentaire sur l\'écart'))


def downgrade() -> None:
    # Supprimer les champs ajoutés
    op.drop_column('cash_sessions', 'variance_comment')
    op.drop_column('cash_sessions', 'variance')
    op.drop_column('cash_sessions', 'actual_amount')
    op.drop_column('cash_sessions', 'closing_amount')
