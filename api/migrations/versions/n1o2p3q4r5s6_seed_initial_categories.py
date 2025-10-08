"""seed initial categories and prices

Revision ID: n1o2p3q4r5s6
Revises: m3npr1c3dr0p
Create Date: 2025-10-07 17:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from uuid import uuid4
from decimal import Decimal


# revision identifiers, used by Alembic.
revision = 'n1o2p3q4r5s6'
down_revision = 'b4c5d6e7f8a9'
branch_labels = None
depends_on = None


# Data structure: (root_category, [(subcategory, price, max_price), ...])
CATEGORIES_DATA = [
    ("Vaisselle & Cuisine / Maison", [
        ("Verre", Decimal("0.50"), None),
        ("Plat", Decimal("3.00"), None),
        ("Casserole", Decimal("3.00"), None),
        ("Cocotte", Decimal("8.00"), None),
        ("Couvert", Decimal("0.20"), None),
    ]),
    ("Électroménager", [
        ("Frigidaire", Decimal("30.00"), None),
        ("Plaque cuisson", Decimal("15.00"), None),
        ("Raclette", Decimal("10.00"), None),
        ("Mixer main", Decimal("5.00"), None),
    ]),
    ("Sports & Loisirs", [
        ("Instrument de musique", Decimal("5.00"), Decimal("30.00")),
        ("Ballon plastique", Decimal("0.50"), None),
        ("Ballon en cuir", Decimal("2.00"), None),
        ("Vélo elliptique, rameur, etc.", Decimal("20.00"), None),
        ("Vélo adulte (hors asso)", Decimal("20.00"), None),
        ("Vélo enfant", Decimal("10.00"), None),
    ]),
    ("Ameublement & Literie", [
        ("Gros meuble en bois massif", Decimal("30.00"), None),
        ("Gros meuble en plastique/stratifié", Decimal("20.00"), None),
        ("Meuble moyen en bois massif", Decimal("30.00"), None),
        ("Meuble moyen en plastique/stratifié", Decimal("20.00"), None),
        ("Petit meuble/chaise en bois massif", Decimal("12.00"), None),
        ("Petit meuble/chaise en plastique/stratifié", Decimal("8.00"), None),
    ]),
    ("Luminaires & Décoration", [
        ("Cadre / Tableau", Decimal("0.50"), None),
        ("Lampe", Decimal("3.00"), None),
    ]),
    ("Textiles – Linge – Chaussures", [
        ("Manteaux adultes", Decimal("5.00"), None),
        ("Manteaux enfants", Decimal("3.00"), None),
        ("Jupe longue, robe, pantalon, pull", Decimal("3.00"), None),
        ("Chemise, top", Decimal("3.00"), None),
        ("T-shirt", Decimal("2.00"), None),
        ("Sac", Decimal("3.00"), None),
        ("Chaussures", Decimal("3.00"), None),
        ("Chaussures enfants", Decimal("2.00"), None),
        ("Drap", Decimal("3.00"), None),
        ("Taie", Decimal("1.00"), None),
        ("Drap ancien", Decimal("12.00"), None),
    ]),
    ("Livres & Médias", [
        ("Livre", Decimal("1.00"), None),
    ]),
    # Root categories without subcategories (yet)
    ("Mobilité douce", []),
    ("Bricolage & Outils", []),
    ("Électronique / IT / Audio-vidéo", []),
    ("Jardin & Extérieur", []),
    ("Jouets", []),
    ("Puériculture & Bébé", []),
    ("Matériaux & Bâtiment", []),
]


def upgrade() -> None:
    conn = op.get_bind()

    # Define the categories table for bulk operations
    categories = sa.table(
        'categories',
        sa.column('id', postgresql.UUID(as_uuid=True)),
        sa.column('name', sa.String()),
        sa.column('is_active', sa.Boolean()),
        sa.column('parent_id', postgresql.UUID(as_uuid=True)),
        sa.column('price', sa.Numeric(10, 2)),
        sa.column('max_price', sa.Numeric(10, 2)),
    )

    # Check if any categories already exist (idempotency check)
    result = conn.execute(sa.text("SELECT COUNT(*) FROM categories"))
    count = result.scalar()

    if count > 0:
        # Categories already exist, skip seeding
        print(f"Categories table already contains {count} records. Skipping seed operation.")
        return

    # Process each root category and its subcategories
    for root_name, subcategories in CATEGORIES_DATA:
        # Create root category
        root_id = uuid4()
        root_row = {
            'id': root_id,
            'name': root_name,
            'is_active': True,
            'parent_id': None,
            'price': None,
            'max_price': None,
        }
        op.bulk_insert(categories, [root_row])

        # Create subcategories if any
        if subcategories:
            subcategory_rows = []
            for sub_name, price, max_price in subcategories:
                subcategory_rows.append({
                    'id': uuid4(),
                    'name': sub_name,
                    'is_active': True,
                    'parent_id': root_id,
                    'price': price,
                    'max_price': max_price,
                })
            op.bulk_insert(categories, subcategory_rows)


def downgrade() -> None:
    conn = op.get_bind()

    # Extract all root category names from the data
    root_names = [root_name for root_name, _ in CATEGORIES_DATA]

    # Delete all subcategories first (due to foreign key constraint)
    conn.execute(
        sa.text(
            """
            DELETE FROM categories
            WHERE parent_id IN (
                SELECT id FROM categories WHERE name = ANY(:names) AND parent_id IS NULL
            )
            """
        ).bindparams(names=root_names)
    )

    # Delete root categories
    conn.execute(
        sa.text(
            """
            DELETE FROM categories
            WHERE name = ANY(:names) AND parent_id IS NULL
            """
        ).bindparams(names=root_names)
    )
