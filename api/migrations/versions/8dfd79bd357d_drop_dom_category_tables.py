"""Drop dom_category tables

Revision ID: 8dfd79bd357d
Revises: 9a2b3c4d5e6f
Create Date: 2025-01-27 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8dfd79bd357d'
down_revision = 'k1l2m3n4o5p6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Drop dom_category and dom_category_closure tables."""
    # Drop dom_category_closure table first (due to foreign key constraints)
    op.drop_table('dom_category_closure')
    
    # Drop dom_category table
    op.drop_table('dom_category')


def downgrade() -> None:
    """Recreate dom_category tables (for rollback purposes)."""
    # Recreate dom_category table
    op.create_table('dom_category',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.Column('l1_root_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['l1_root_id'], ['dom_category.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['dom_category.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    
    # Recreate dom_category_closure table
    op.create_table('dom_category_closure',
        sa.Column('ancestor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('descendant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('depth', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['ancestor_id'], ['dom_category.id'], ),
        sa.ForeignKeyConstraint(['descendant_id'], ['dom_category.id'], ),
        sa.PrimaryKeyConstraint('ancestor_id', 'descendant_id', name='pk_dom_category_closure')
    )
