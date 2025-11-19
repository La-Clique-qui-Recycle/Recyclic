"""fix_enum_values_cashsessionstep_buttontype

Revision ID: fix_enum_values_cashsessionstep_buttontype
Revises: story_12_add_category_visibility
Create Date: 2025-11-19 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fix_enum_values_cashsessionstep_buttontype'
down_revision: Union[str, None] = 'story_12_add_category_visibility'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Fix enum values to use lowercase values instead of uppercase names.
    
    This migration:
    1. Changes cashsessionstep enum from ('ENTRY', 'SALE', 'EXIT') to ('entry', 'sale', 'exit')
    2. Changes cashsessionstatus enum from ('OPEN', 'CLOSED') to ('open', 'closed')
    3. Changes buttontype enum from ('DONATION', 'RECYCLING') to ('donation', 'recycling')
    
    This ensures consistency with the Python enum values and other enums in the database.
    """
    
    # ===== Fix cashsessionstep enum =====
    # Step 1: Rename old enum to temporary name
    op.execute("ALTER TYPE cashsessionstep RENAME TO cashsessionstep_old")
    
    # Step 2: Create new enum with lowercase values
    op.execute("CREATE TYPE cashsessionstep AS ENUM ('entry', 'sale', 'exit')")
    
    # Step 3: Convert existing data (convert uppercase to lowercase)
    op.execute("""
        ALTER TABLE cash_sessions 
        ALTER COLUMN current_step TYPE cashsessionstep 
        USING CASE 
            WHEN current_step::text = 'ENTRY' THEN 'entry'::cashsessionstep
            WHEN current_step::text = 'SALE' THEN 'sale'::cashsessionstep
            WHEN current_step::text = 'EXIT' THEN 'exit'::cashsessionstep
            ELSE NULL
        END
    """)
    
    # Step 4: Drop old enum
    op.execute("DROP TYPE cashsessionstep_old")
    
    # ===== Fix cashsessionstatus enum =====
    # Step 1: Rename old enum to temporary name
    op.execute("ALTER TYPE cashsessionstatus RENAME TO cashsessionstatus_old")
    
    # Step 2: Create new enum with lowercase values
    op.execute("CREATE TYPE cashsessionstatus AS ENUM ('open', 'closed')")
    
    # Step 3: Convert existing data (convert uppercase to lowercase)
    op.execute("""
        ALTER TABLE cash_sessions 
        ALTER COLUMN status TYPE cashsessionstatus 
        USING CASE 
            WHEN status::text = 'OPEN' THEN 'open'::cashsessionstatus
            WHEN status::text = 'CLOSED' THEN 'closed'::cashsessionstatus
            ELSE 'open'::cashsessionstatus  -- fallback (should not happen)
        END
    """)
    
    # Step 4: Drop old enum
    op.execute("DROP TYPE cashsessionstatus_old")
    
    # ===== Fix buttontype enum =====
    # Step 1: Rename old enum to temporary name
    op.execute("ALTER TYPE buttontype RENAME TO buttontype_old")
    
    # Step 2: Create new enum with lowercase values
    op.execute("CREATE TYPE buttontype AS ENUM ('donation', 'recycling')")
    
    # Step 3: Convert existing data (convert uppercase to lowercase)
    op.execute("""
        ALTER TABLE preset_buttons 
        ALTER COLUMN button_type TYPE buttontype 
        USING CASE 
            WHEN button_type::text = 'DONATION' THEN 'donation'::buttontype
            WHEN button_type::text = 'RECYCLING' THEN 'recycling'::buttontype
            ELSE 'donation'::buttontype  -- fallback (should not happen)
        END
    """)
    
    # Step 4: Drop old enum
    op.execute("DROP TYPE buttontype_old")


def downgrade() -> None:
    """
    Revert enum values back to uppercase names.
    """
    
    # ===== Revert buttontype enum =====
    # Step 1: Rename current enum to temporary name
    op.execute("ALTER TYPE buttontype RENAME TO buttontype_old")
    
    # Step 2: Create old enum with uppercase values
    op.execute("CREATE TYPE buttontype AS ENUM ('DONATION', 'RECYCLING')")
    
    # Step 3: Convert existing data (convert lowercase to uppercase)
    op.execute("""
        ALTER TABLE preset_buttons 
        ALTER COLUMN button_type TYPE buttontype 
        USING CASE 
            WHEN button_type::text = 'donation' THEN 'DONATION'::buttontype
            WHEN button_type::text = 'recycling' THEN 'RECYCLING'::buttontype
            ELSE 'DONATION'::buttontype  -- fallback
        END
    """)
    
    # Step 4: Drop temporary enum
    op.execute("DROP TYPE buttontype_old")
    
    # ===== Revert cashsessionstatus enum =====
    # Step 1: Rename current enum to temporary name
    op.execute("ALTER TYPE cashsessionstatus RENAME TO cashsessionstatus_old")
    
    # Step 2: Create old enum with uppercase values
    op.execute("CREATE TYPE cashsessionstatus AS ENUM ('OPEN', 'CLOSED')")
    
    # Step 3: Convert existing data (convert lowercase to uppercase)
    op.execute("""
        ALTER TABLE cash_sessions 
        ALTER COLUMN status TYPE cashsessionstatus 
        USING CASE 
            WHEN status::text = 'open' THEN 'OPEN'::cashsessionstatus
            WHEN status::text = 'closed' THEN 'CLOSED'::cashsessionstatus
            ELSE 'OPEN'::cashsessionstatus  -- fallback
        END
    """)
    
    # Step 4: Drop temporary enum
    op.execute("DROP TYPE cashsessionstatus_old")
    
    # ===== Revert cashsessionstep enum =====
    # Step 1: Rename current enum to temporary name
    op.execute("ALTER TYPE cashsessionstep RENAME TO cashsessionstep_old")
    
    # Step 2: Create old enum with uppercase values
    op.execute("CREATE TYPE cashsessionstep AS ENUM ('ENTRY', 'SALE', 'EXIT')")
    
    # Step 3: Convert existing data (convert lowercase to uppercase)
    op.execute("""
        ALTER TABLE cash_sessions 
        ALTER COLUMN current_step TYPE cashsessionstep 
        USING CASE 
            WHEN current_step::text = 'entry' THEN 'ENTRY'::cashsessionstep
            WHEN current_step::text = 'sale' THEN 'SALE'::cashsessionstep
            WHEN current_step::text = 'exit' THEN 'EXIT'::cashsessionstep
            ELSE NULL
        END
    """)
    
    # Step 4: Drop temporary enum
    op.execute("DROP TYPE cashsessionstep_old")

