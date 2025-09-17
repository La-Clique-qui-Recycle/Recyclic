#!/usr/bin/env python3
"""
Script to create deposits and sites tables directly in PostgreSQL
"""

import psycopg2
import sys
import os

# Add the src directory to the path
sys.path.append('api/src')

from recyclic_api.core.config import settings

def create_tables():
    try:
        # Connect to PostgreSQL using DATABASE_URL
        conn = psycopg2.connect(settings.DATABASE_URL)
        
        cur = conn.cursor()
        
        print("Creating sites table...")
        # Create sites table first
        cur.execute('''
        CREATE TABLE IF NOT EXISTS sites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            address VARCHAR,
            configuration JSON,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        ''')
        
        print("Creating deposits table...")
        # Create deposits table
        cur.execute('''
        CREATE TABLE IF NOT EXISTS deposits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            site_id UUID REFERENCES sites(id),
            telegram_user_id VARCHAR,
            audio_file_path VARCHAR,
            status VARCHAR NOT NULL DEFAULT 'PENDING_AUDIO',
            category VARCHAR,
            weight FLOAT,
            description VARCHAR,
            ai_classification VARCHAR,
            ai_confidence FLOAT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        ''')
        
        conn.commit()
        print("✅ Tables created successfully!")
        
        # Verify tables exist
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sites', 'deposits')")
        tables = cur.fetchall()
        print(f"✅ Tables in database: {[table[0] for table in tables]}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
    
    return True

if __name__ == "__main__":
    create_tables()
