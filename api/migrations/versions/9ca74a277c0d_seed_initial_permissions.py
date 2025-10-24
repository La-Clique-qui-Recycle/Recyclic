"""Seed initial permissions

Revision ID: 9ca74a277c0d
Revises: f93987027864
Create Date: 2025-01-27 21:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = '9ca74a277c0d'
down_revision = 'f93987027864'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Define the permissions table structure
    permissions_table = sa.table(
        'permissions',
        sa.column('id', sa.UUID),
        sa.column('name', sa.String),
        sa.column('description', sa.Text)
    )
    
    # Insert the 6 initial permissions
    op.bulk_insert(permissions_table, [
        {
            'id': str(uuid.uuid4()),
            'name': 'caisse.access',
            'description': 'Donne accès au module de Caisse.'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'reception.access',
            'description': 'Donne accès au module de Réception.'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'admin.users.manage',
            'description': 'Permet la gestion des utilisateurs.'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'admin.groups.manage',
            'description': 'Permet la gestion des groupes et permissions.'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'reports.view',
            'description': 'Permet de consulter les rapports.'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'reports.export',
            'description': 'Permet d\'exporter les rapports.'
        }
    ])


def downgrade() -> None:
    # Remove the seeded permissions by name
    op.execute("""
        DELETE FROM permissions 
        WHERE name IN (
            'caisse.access',
            'reception.access', 
            'admin.users.manage',
            'admin.groups.manage',
            'reports.view',
            'reports.export'
        )
    """)
