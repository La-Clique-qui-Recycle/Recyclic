"""convert_payment_method_to_simple_codes

Revision ID: edb26c4fe53b
Revises: story_12_add_category_visibility
Create Date: 2025-11-19 23:33:18.969587

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'edb26c4fe53b'
down_revision = 'story_12_add_category_visibility'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convertir les valeurs de payment_method de français vers codes simples
    # "espèces" -> "cash", "carte bancaire" -> "card", "chèque" -> "check"
    op.execute("""
        UPDATE sales 
        SET payment_method = CASE 
            WHEN payment_method = 'espèces' THEN 'cash'
            WHEN payment_method = 'carte bancaire' THEN 'card'
            WHEN payment_method = 'chèque' THEN 'check'
            ELSE payment_method  -- Garder les valeurs existantes si déjà converties
        END
        WHERE payment_method IN ('espèces', 'carte bancaire', 'chèque')
    """)


def downgrade() -> None:
    # Reconvertir les codes simples vers français (pour rollback)
    op.execute("""
        UPDATE sales 
        SET payment_method = CASE 
            WHEN payment_method = 'cash' THEN 'espèces'
            WHEN payment_method = 'card' THEN 'carte bancaire'
            WHEN payment_method = 'check' THEN 'chèque'
            ELSE payment_method
        END
        WHERE payment_method IN ('cash', 'card', 'check')
    """)
