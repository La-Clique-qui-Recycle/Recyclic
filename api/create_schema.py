#!/usr/bin/env python3
"""Script to create database schema directly"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import create_engine, text
from recyclic_api.core.config import settings

def main():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Create enums
        print("Creating enums...")
        conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE userrole AS ENUM ('super-admin', 'admin', 'manager', 'cashier', 'user');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE userstatus AS ENUM ('pending', 'approved', 'rejected');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        # Create users table
        print("Creating users table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                telegram_id VARCHAR UNIQUE NOT NULL,
                username VARCHAR,
                first_name VARCHAR,
                last_name VARCHAR,
                role userrole NOT NULL DEFAULT 'user',
                status userstatus NOT NULL DEFAULT 'pending',
                is_active BOOLEAN NOT NULL DEFAULT true,
                site_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create index
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_users_telegram_id ON users(telegram_id);
        """))
        
        conn.commit()
        print("Schema created successfully!")

if __name__ == "__main__":
    main()
