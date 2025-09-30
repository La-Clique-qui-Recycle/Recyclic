"""reception schema: dom_category + closure + poste/ticket/ligne

Revision ID: 7c1a2f4b9c3a
Revises: c1891768c506
Create Date: 2025-09-30 10:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '7c1a2f4b9c3a'
down_revision = 'c1891768c506'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create dom_category
    op.create_table(
        'dom_category',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dom_category.id'), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('l1_root_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dom_category.id'), nullable=True),
        sa.UniqueConstraint('slug', name='uq_dom_category_slug'),
    )

    # Create dom_category_closure
    op.create_table(
        'dom_category_closure',
        sa.Column('ancestor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dom_category.id'), nullable=False),
        sa.Column('descendant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dom_category.id'), nullable=False),
        sa.Column('depth', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('ancestor_id', 'descendant_id', name='pk_dom_category_closure'),
    )

    # NOTE: Utiliser VARCHAR + CHECK au lieu d'ENUM pour éviter les conflits d'enums

    # Create poste_reception
    op.create_table(
        'poste_reception',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('opened_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('opened_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='opened'),
        sa.CheckConstraint("status IN ('opened','closed')", name='ck_poste_reception_status'),
    )

    # Create ticket_depot
    op.create_table(
        'ticket_depot',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('poste_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('poste_reception.id'), nullable=False),
        sa.Column('benevole_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='opened'),
        sa.CheckConstraint("status IN ('opened','closed')", name='ck_ticket_depot_status'),
    )

    # Create ligne_depot
    op.create_table(
        'ligne_depot',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('ticket_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ticket_depot.id'), nullable=False),
        sa.Column('dom_category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dom_category.id'), nullable=False),
        sa.Column('poids_kg', sa.Numeric(8, 3), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
    )


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table('ligne_depot')
    op.drop_table('ticket_depot')
    op.drop_table('poste_reception')
    op.drop_table('dom_category_closure')
    op.drop_table('dom_category')

    # Rien à supprimer: pas d'ENUMs créés dans cette migration


