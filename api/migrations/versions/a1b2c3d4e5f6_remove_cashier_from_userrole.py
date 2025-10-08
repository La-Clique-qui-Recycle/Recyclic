"""remove_cashier_from_userrole

Revision ID: a1b2c3d4e5f6
Revises: m3npr1c3dr0p
Create Date: 2025-10-07 10:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'm3npr1c3dr0p'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Migrer les données: cashier -> user
    op.execute("UPDATE users SET role = 'user' WHERE role = 'cashier';")

    # 2) Supprimer la valeur 'cashier' de l'ENUM PostgreSQL 'userrole'
    #    Pattern: rename old type -> create new -> alter column -> drop old
    op.execute("ALTER TYPE userrole RENAME TO userrole_old;")
    op.execute("CREATE TYPE userrole AS ENUM ('super-admin', 'admin', 'manager', 'user');")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::text::userrole;")
    op.execute("DROP TYPE userrole_old;")


def downgrade() -> None:
    # Réintroduire 'cashier' dans l'ENUM et ne pas re-mapper les données
    op.execute("ALTER TYPE userrole RENAME TO userrole_old;")
    op.execute("CREATE TYPE userrole AS ENUM ('super-admin', 'admin', 'manager', 'cashier', 'user');")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::text::userrole;")
    op.execute("DROP TYPE userrole_old;")


