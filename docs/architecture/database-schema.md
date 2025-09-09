# Database Schema

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer');
CREATE TYPE eee_category AS ENUM ('EEE-1', 'EEE-2', 'EEE-3', 'EEE-4', 'EEE-5', 'EEE-6', 'EEE-7', 'EEE-8');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'check');
CREATE TYPE session_status AS ENUM ('opened', 'closed');

-- Sites table
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

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role user_role NOT NULL DEFAULT 'operator',
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposits table
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

-- Cash sessions table
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

-- Sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES cash_sessions(id),
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

-- Sync logs table
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL, -- 'google_sheets', 'infomaniak', 'ecologic'
    operation VARCHAR(50) NOT NULL, -- 'export', 'upload', 'sync'
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'pending'
    details JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_site_id ON users(site_id);
CREATE INDEX idx_deposits_site_id ON deposits(site_id);
CREATE INDEX idx_deposits_created_by ON deposits(created_by);
CREATE INDEX idx_deposits_category_eee ON deposits(category_eee);
CREATE INDEX idx_deposits_created_at ON deposits(created_at);
CREATE INDEX idx_sales_site_id ON sales(site_id);
CREATE INDEX idx_sales_session_id ON sales(session_id);
CREATE INDEX idx_sales_category_eee ON sales(category_eee);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_cash_sessions_site_id ON cash_sessions(site_id);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX idx_sync_logs_site_id ON sync_logs(site_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---
