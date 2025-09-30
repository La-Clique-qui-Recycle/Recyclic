"""add destination to ligne_depot

Revision ID: 9a2b3c4d5e6f
Revises: 8f2b7a1d4e6b
Create Date: 2025-09-30 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9a2b3c4d5e6f"
down_revision = "8f2b7a1d4e6b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Créer le type ENUM PostgreSQL pour destination
    destination_enum = sa.Enum("MAGASIN", "RECYCLAGE", "DECHETERIE", name="destinationenum")
    bind = op.get_bind()
    destination_enum.create(bind, checkfirst=True)

    # Ajouter la colonne avec NOT NULL. Pour gérer d'éventuelles lignes existantes,
    # on applique d'abord un server_default puis on le retire.
    op.add_column(
        "ligne_depot",
        sa.Column("destination", destination_enum, nullable=False, server_default="MAGASIN"),
    )
    # Retirer le server_default après remplissage des lignes existantes
    op.alter_column("ligne_depot", "destination", server_default=None)


def downgrade() -> None:
    # Supprimer d'abord la colonne puis le type ENUM
    op.drop_column("ligne_depot", "destination")
    destination_enum = sa.Enum("MAGASIN", "RECYCLAGE", "DECHETERIE", name="destinationenum")
    bind = op.get_bind()
    destination_enum.drop(bind, checkfirst=True)


