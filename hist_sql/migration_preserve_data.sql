-- =====================================================
-- POLIFY DATABASE MIGRATION - PRESERVE EXISTING DATA
-- =====================================================
-- This script migrates the existing database to the new schema
-- while preserving all existing user data
-- =====================================================

-- =====================================================
-- STEP 1: UPDATE EXISTING USERS TABLE
-- =====================================================

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sobrenome VARCHAR(100),
ADD COLUMN IF NOT EXISTS idade INTEGER CHECK (idade >= 0 AND idade <= 150),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS pais VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Make nome column NOT NULL (it should already have data)
ALTER TABLE users ALTER COLUMN nome SET NOT NULL;

-- Ensure id sequence is properly configured
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users_id_seq') THEN
        CREATE SEQUENCE users_id_seq;
        ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
        ALTER SEQUENCE users_id_seq OWNED BY users.id;
    END IF;
END
$$;

-- Set sequence to current max value
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- Add constraints to users table
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS users_id_check CHECK (id > 0),
ADD CONSTRAINT IF NOT EXISTS users_nome_not_null CHECK (nome IS NOT NULL),
ADD CONSTRAINT IF NOT EXISTS users_email_not_null CHECK (email IS NOT NULL),
ADD CONSTRAINT IF NOT EXISTS users_password_hash_not_null CHECK (password_hash IS NOT NULL);

-- Create trigger for updated_at
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

-- Update existing records to have proper timestamps
UPDATE users SET 
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nome ON users(nome);

-- =====================================================
-- STEP 2: CREATE NEW TABLES
-- =====================================================

-- Create header_formulario table
CREATE TABLE header_formulario (
    id SERIAL PRIMARY KEY,
    nome_formulario VARCHAR(255) NOT NULL,
    descricao_formulario TEXT,
    categoria VARCHAR(100) NOT NULL,
    min_respondentes INTEGER DEFAULT 1 CHECK (min_respondentes >= 1),
    tempo_max_dias INTEGER CHECK (tempo_max_dias >= 1),
    id_criador INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pontos_base INTEGER DEFAULT 0 CHECK (pontos_base >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create perguntas_form table
CREATE TABLE perguntas_form (
    id_perg SERIAL PRIMARY KEY,
    id_form INTEGER NOT NULL REFERENCES header_formulario(id) ON DELETE CASCADE,
    num_pergunta INTEGER NOT NULL,
    pergunta TEXT NOT NULL,
    alternativa TEXT,
    tipagem VARCHAR(50) NOT NULL CHECK (tipagem IN ('text', 'multiple_choice', 'checkbox', 'rating', 'date', 'number')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_form, num_pergunta)
);

-- Create header_form_cont table
CREATE TABLE header_form_cont (
    id SERIAL PRIMARY KEY,
    id_form INTEGER NOT NULL REFERENCES header_formulario(id) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(id_form, id_user)
);

-- Create resp_form table
CREATE TABLE resp_form (
    id SERIAL PRIMARY KEY,
    id_perg INTEGER NOT NULL REFERENCES perguntas_form(id_perg) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resposta TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_perg, id_user)
);

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

-- Header_formulario table indexes
CREATE INDEX idx_header_formulario_criador ON header_formulario(id_criador);
CREATE INDEX idx_header_formulario_categoria ON header_formulario(categoria);
CREATE INDEX idx_header_formulario_active ON header_formulario(is_active);

-- Perguntas_form table indexes
CREATE INDEX idx_perguntas_form_form ON perguntas_form(id_form);
CREATE INDEX idx_perguntas_form_tipagem ON perguntas_form(tipagem);

-- Header_form_cont table indexes
CREATE INDEX idx_header_form_cont_form ON header_form_cont(id_form);
CREATE INDEX idx_header_form_cont_user ON header_form_cont(id_user);
CREATE INDEX idx_header_form_cont_completed ON header_form_cont(completed);

-- Resp_form table indexes
CREATE INDEX idx_resp_form_pergunta ON resp_form(id_perg);
CREATE INDEX idx_resp_form_user ON resp_form(id_user);

-- =====================================================
-- STEP 4: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp (already created for users)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_header_formulario_updated_at BEFORE UPDATE ON header_formulario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perguntas_form_updated_at BEFORE UPDATE ON perguntas_form
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resp_form_updated_at BEFORE UPDATE ON resp_form
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 5: CREATE VIEWS
-- =====================================================

-- View for survey details with creator information
CREATE VIEW survey_details AS
SELECT 
    hf.id,
    hf.nome_formulario,
    hf.descricao_formulario,
    hf.categoria,
    hf.min_respondentes,
    hf.tempo_max_dias,
    hf.pontos_base,
    hf.created_at,
    hf.is_active,
    u.nome || ' ' || COALESCE(u.sobrenome, '') AS criador_nome,
    u.email AS criador_email
FROM header_formulario hf
JOIN users u ON hf.id_criador = u.id;

-- View for response statistics
CREATE VIEW survey_statistics AS
SELECT 
    hf.id AS survey_id,
    hf.nome_formulario,
    COUNT(DISTINCT hfc.id_user) AS total_respondentes,
    COUNT(DISTINCT pf.id_perg) AS total_perguntas,
    COUNT(rf.id) AS total_respostas,
    CASE 
        WHEN COUNT(DISTINCT hfc.id_user) >= hf.min_respondentes THEN 'Completado'
        ELSE 'Em andamento'
    END AS status
FROM header_formulario hf
LEFT JOIN header_form_cont hfc ON hf.id = hfc.id_form
LEFT JOIN perguntas_form pf ON hf.id = pf.id_form
LEFT JOIN resp_form rf ON pf.id_perg = rf.id_perg
GROUP BY hf.id, hf.nome_formulario, hf.min_respondentes;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show final users table structure
-- \d users

-- Show all tables
-- \dt

-- Count existing users (should preserve data)
-- SELECT COUNT(*) FROM users;

-- Sample data check
-- SELECT id, nome, email FROM users LIMIT 3;
