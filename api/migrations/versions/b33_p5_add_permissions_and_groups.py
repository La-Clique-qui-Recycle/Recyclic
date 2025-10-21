"""add permissions and groups tables with many-to-many relationships

Revision ID: b33p5_add_permissions_and_groups
Revises: b33p2_add_user_profile_fields
Create Date: 2025-10-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = 'b33p5_add_permissions_and_groups'
down_revision = 'b33p2_add_user_profile_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create permissions table
    op.create_table(
        'permissions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.UniqueConstraint('name', name='uq_permissions_name')
    )
    op.create_index('ix_permissions_name', 'permissions', ['name'])

    # Create groups table
    op.create_table(
        'groups',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.UniqueConstraint('name', name='uq_groups_name')
    )
    op.create_index('ix_groups_name', 'groups', ['name'])

    # Create user_groups association table (many-to-many: users <-> groups)
    op.create_table(
        'user_groups',
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('group_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'group_id')
    )

    # Create group_permissions association table (many-to-many: groups <-> permissions)
    op.create_table(
        'group_permissions',
        sa.Column('group_id', UUID(as_uuid=True), nullable=False),
        sa.Column('permission_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('group_id', 'permission_id')
    )

    # Seed initial permissions
    # Use uuid_generate_v4() which should be available from pgcrypto extension
    op.execute("""
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        INSERT INTO permissions (id, name, description, created_at, updated_at)
        VALUES
            (uuid_generate_v4(), 'caisse.access', 'Accès au module de caisse', NOW(), NOW()),
            (uuid_generate_v4(), 'reception.access', 'Accès au module de réception', NOW(), NOW()),
            (uuid_generate_v4(), 'admin.users.manage', 'Gestion des utilisateurs (création, modification, suppression)', NOW(), NOW()),
            (uuid_generate_v4(), 'admin.groups.manage', 'Gestion des groupes et permissions', NOW(), NOW()),
            (uuid_generate_v4(), 'reports.view', 'Consultation des rapports', NOW(), NOW()),
            (uuid_generate_v4(), 'reports.export', 'Export des rapports', NOW(), NOW())
    """)


def downgrade() -> None:
    # Drop association tables first (due to foreign keys)
    op.drop_table('group_permissions')
    op.drop_table('user_groups')

    # Drop main tables
    op.drop_index('ix_groups_name', table_name='groups')
    op.drop_table('groups')

    op.drop_index('ix_permissions_name', table_name='permissions')
    op.drop_table('permissions')
