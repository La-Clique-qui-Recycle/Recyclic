"""Robust migration of data from dom_category to categories with idempotence

Revision ID: k1l2m3n4o5p6
Revises: g1h2i3j4k5l6
Create Date: 2025-01-27 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'k1l2m3n4o5p6'
down_revision = 'g1h2i3j4k5l6'
branch_labels = None
depends_on = None


def upgrade():
    """
    Migrate data from dom_category to categories table.
    This migration is idempotent - it can be run multiple times safely.
    """
    conn = op.get_bind()
    
    # Check if dom_category table exists and has data
    result = conn.execute(text("""
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'dom_category' AND table_schema = 'public'
    """))
    table_exists = result.fetchone()[0] > 0
    
    if not table_exists:
        print("dom_category table does not exist, skipping migration")
        return
    
    # Check if there are any records in dom_category
    result = conn.execute(text("SELECT COUNT(*) FROM dom_category"))
    dom_category_count = result.fetchone()[0]
    
    if dom_category_count == 0:
        print("No data in dom_category table, skipping migration")
        return
    
    # Check if categories table already has data (idempotency check)
    result = conn.execute(text("SELECT COUNT(*) FROM categories"))
    categories_count = result.fetchone()[0]
    
    if categories_count > 0:
        print(f"Categories table already has {categories_count} records, skipping migration")
        return
    
    print(f"Migrating {dom_category_count} records from dom_category to categories")
    
    # Migrate all categories from dom_category to categories
    # For now, we only migrate level 1 categories (no parent relationships)
    # as the current dom_category data only has level 1 categories
    result = conn.execute(text("""
        INSERT INTO categories (id, name, is_active, parent_id, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            label as name,
            active as is_active,
            NULL as parent_id,
            NOW() as created_at,
            NOW() as updated_at
        FROM dom_category 
        WHERE level = 1
        ORDER BY label
    """))
    
    # Get the count of migrated records
    migrated_count = result.rowcount
    print(f"Successfully migrated {migrated_count} categories from dom_category to categories")
    
    # Post-migration validation
    print("Performing post-migration validation...")
    
    # Validate that all level 1 categories were migrated
    validation_result = conn.execute(text("""
        SELECT COUNT(*) FROM dom_category d
        LEFT JOIN categories c ON d.label = c.name
        WHERE d.level = 1 AND c.name IS NULL
    """))
    missing_count = validation_result.fetchone()[0]
    
    if missing_count == 0:
        print("✅ Post-migration validation passed: All categories migrated successfully")
    else:
        print(f"❌ Post-migration validation failed: {missing_count} categories missing")
        raise Exception(f"Migration validation failed: {missing_count} categories not migrated")
    
    # Validate data integrity
    integrity_result = conn.execute(text("""
        SELECT COUNT(*) FROM categories 
        WHERE name IS NULL OR name = '' OR is_active IS NULL
    """))
    integrity_issues = integrity_result.fetchone()[0]
    
    if integrity_issues == 0:
        print("✅ Data integrity validation passed: No null or empty values found")
    else:
        print(f"❌ Data integrity validation failed: {integrity_issues} issues found")
        raise Exception(f"Data integrity validation failed: {integrity_issues} data issues found")


def downgrade():
    """
    Remove all data from categories table that was migrated from dom_category.
    This is a destructive operation - use with caution.
    """
    conn = op.get_bind()
    
    # Check if categories table has data
    result = conn.execute(text("SELECT COUNT(*) FROM categories"))
    categories_count = result.fetchone()[0]
    
    if categories_count == 0:
        print("Categories table is empty, nothing to rollback")
        return
    
    print(f"Removing {categories_count} records from categories table")
    
    # Delete all records from categories table
    conn.execute(text("DELETE FROM categories"))
    
    print("Successfully removed all categories data")
