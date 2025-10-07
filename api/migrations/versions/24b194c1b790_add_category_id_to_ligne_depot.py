"""add category_id to ligne_depot

Revision ID: 24b194c1b790
Revises: k1l2m3n4o5p6
Create Date: 2025-01-27 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '24b194c1b790'
down_revision = 'k1l2m3n4o5p6'
branch_labels = None
depends_on = None


def upgrade():
    # Add category_id column to ligne_depot table
    op.add_column('ligne_depot', sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Add foreign key constraint
    op.create_foreign_key('fk_ligne_depot_category_id', 'ligne_depot', 'categories', ['category_id'], ['id'])

    # Migrate data from dom_category_id to category_id
    # This migration maps old dom_category IDs to new categories IDs via matching labels
    op.execute("""
        UPDATE ligne_depot
        SET category_id = (
            SELECT c.id
            FROM categories c
            JOIN dom_category dc ON dc.label = c.name
            WHERE dc.id = ligne_depot.dom_category_id
        )
        WHERE dom_category_id IS NOT NULL
    """)


def downgrade():
    # Remove foreign key constraint
    op.drop_constraint('fk_ligne_depot_category_id', 'ligne_depot', type_='foreignkey')
    
    # Drop category_id column
    op.drop_column('ligne_depot', 'category_id')
