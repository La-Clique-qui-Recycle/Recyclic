# Annexe A : Schéma de la Base de Données

Ce document est une annexe au document d'architecture principal et fournit le schéma SQL complet pour la base de données PostgreSQL du projet Recyclic.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('super-admin', 'admin', 'manager', 'cashier', 'user');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE eee_category AS ENUM ('EEE-1', 'EEE-2', 'EEE-3', 'EEE-4', 'EEE-5', 'EEE-6', 'EEE-7', 'EEE-8');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'check');
CREATE TYPE session_status AS ENUM ('opened', 'closed');

-- Tables
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    settings JSONB NOT NULL DEFAULT '{}',
    branding JSONB NOT NULL DEFAULT '{}',
    sync_config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id VARCHAR UNIQUE NOT NULL,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT true,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    audio_file_path VARCHAR(500),
    transcription TEXT,
    category_eee eee_category NOT NULL,
    subcategory VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    weight_kg DECIMAL(8,3) NOT NULL CHECK (weight_kg > 0),
    ai_confidence DECIMAL(5,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    ai_suggested_categories eee_category[],
    human_validated BOOLEAN NOT NULL DEFAULT false,
    validation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id),
    opening_amount DECIMAL(10,2) NOT NULL CHECK (opening_amount >= 0),
    closing_amount DECIMAL(10,2) CHECK (closing_amount >= 0),
    actual_amount DECIMAL(10,2) CHECK (actual_amount >= 0),
    variance DECIMAL(10,2) GENERATED ALWAYS AS (actual_amount - closing_amount) STORED,
    variance_comment TEXT,
    status session_status NOT NULL DEFAULT 'opened',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id),
    category_eee eee_category NOT NULL,
    subcategory VARCHAR(100),
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(8,2) NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    payment_method payment_method NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_deposits_category_eee ON deposits(category_eee);
CREATE INDEX idx_sales_category_eee ON sales(category_eee);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
