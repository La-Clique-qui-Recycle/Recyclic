"""seed dom_category L1 + closure depth=0

Revision ID: 8f2b7a1d4e6b
Revises: 7c1a2f4b9c3a
Create Date: 2025-09-30 10:20:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from uuid import uuid4


# revision identifiers, used by Alembic.
revision = '8f2b7a1d4e6b'
down_revision = '7c1a2f4b9c3a'
branch_labels = None
depends_on = None


L1_CATEGORIES = [
    "Ameublement & Literie",
    "Électroménager",
    "Électronique / IT / Audio-vidéo",
    "Textiles – Linge – Chaussures",
    "Jouets",
    "Sports & Loisirs",
    "Mobilité douce",
    "Bricolage & Outils",
    "Jardin & Extérieur",
    "Vaisselle & Cuisine / Maison",
    "Livres & Médias",
    "Puériculture & Bébé",
    "Luminaires & Décoration",
    "Matériaux & Bâtiment",
]


def slugify(label: str) -> str:
    s = label.lower()
    replacements = {
        "é": "e", "è": "e", "ê": "e", "ë": "e",
        "à": "a", "â": "a", "ä": "a",
        "î": "i", "ï": "i",
        "ô": "o", "ö": "o",
        "û": "u", "ü": "u",
        "ç": "c",
        "&": "et", "/": "-", "–": "-", "—": "-",
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    # Keep alnum and dashes
    s = "".join(ch if ch.isalnum() or ch in {" ", "-"} else "-" for ch in s)
    s = "-".join(filter(None, s.replace(" ", "-").split("-")))
    return s


def upgrade() -> None:
    conn = op.get_bind()

    # Prepare insert statements
    dom_category = sa.table(
        'dom_category',
        sa.column('id', postgresql.UUID(as_uuid=True)),
        sa.column('parent_id', postgresql.UUID(as_uuid=True)),
        sa.column('level', sa.Integer()),
        sa.column('label', sa.String()),
        sa.column('slug', sa.String()),
        sa.column('active', sa.Boolean()),
        sa.column('l1_root_id', postgresql.UUID(as_uuid=True)),
    )
    closure = sa.table(
        'dom_category_closure',
        sa.column('ancestor_id', postgresql.UUID(as_uuid=True)),
        sa.column('descendant_id', postgresql.UUID(as_uuid=True)),
        sa.column('depth', sa.Integer()),
    )

    rows = []
    closure_rows = []
    for label in L1_CATEGORIES:
        new_id = uuid4()
        s = slugify(label)
        rows.append({
            'id': new_id,
            'parent_id': None,
            'level': 1,
            'label': label,
            'slug': s,
            'active': True,
            'l1_root_id': new_id,
        })
        closure_rows.append({
            'ancestor_id': new_id,
            'descendant_id': new_id,
            'depth': 0,
        })

    op.bulk_insert(dom_category, rows)
    op.bulk_insert(closure, closure_rows)


def downgrade() -> None:
    # Remove inserted rows by slug match
    conn = op.get_bind()
    slugs = [slugify(x) for x in L1_CATEGORIES]
    # Delete closure for descendants that are the inserted L1
    conn.execute(
        sa.text(
            """
            DELETE FROM dom_category_closure
            WHERE descendant_id IN (
                SELECT id FROM dom_category WHERE slug = ANY(:slugs)
            )
            """
        ).bindparams(slugs=slugs)
    )
    # Delete dom_category rows
    conn.execute(
        sa.text("DELETE FROM dom_category WHERE slug = ANY(:slugs)").bindparams(slugs=slugs)
    )


