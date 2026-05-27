-- =====================================================
-- UPDATE EXISTING USERS TABLE TO MATCH NEW SCHEMA
-- =====================================================
-- This script updates the existing users table to include the new fields
-- and ensures proper ID auto-generation

-- First, let's see the current structure
-- \d users

-- Add new columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sobrenome VARCHAR(100),
ADD COLUMN IF NOT EXISTS idade INTEGER CHECK (idade >= 0 AND idade <= 150),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS pais VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Ensure id is properly set as SERIAL if not already
-- This is a bit tricky in PostgreSQL, so we'll check and fix if needed

-- First, let's create a sequence if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users_id_seq') THEN
        CREATE SEQUENCE users_id_seq;
        ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
        ALTER SEQUENCE users_id_seq OWNED BY users.id;
    END IF;
END
$$;

-- Make sure existing rows have the sequence value updated
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- Add constraints to existing table
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS users_id_check CHECK (id > 0),
ADD CONSTRAINT IF NOT EXISTS users_nome_not_null CHECK (nome IS NOT NULL),
ADD CONSTRAINT IF NOT EXISTS users_email_not_null CHECK (email IS NOT NULL),
ADD CONSTRAINT IF NOT EXISTS users_password_hash_not_null CHECK (password_hash IS NOT NULL);

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
CREATE TRIGGER users_updated_at_trigger BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();

-- Update any existing records to have proper timestamps
UPDATE users SET 
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nome ON users(nome);

-- Show final structure
-- \d users
