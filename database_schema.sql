-- =====================================================
-- POLIFY DATABASE SCHEMA
-- =====================================================
-- SaaS Survey Platform Database Structure
-- Created: April 2026
-- =====================================================

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS resp_form CASCADE;
DROP TABLE IF EXISTS header_form_cont CASCADE;
DROP TABLE IF EXISTS perguntas_form CASCADE;
DROP TABLE IF EXISTS header_formulario CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. USER TABLE
-- =====================================================
-- Stores user information for authentication and profile management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    idade INTEGER CHECK (idade >= 0 AND idade <= 150),
    cidade VARCHAR(100),
    pais VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. USER_PROGRESS TABLE
-- =====================================================
-- Stores XP/progress for each user
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- =====================================================
-- 3. HEADER_FORMULARIO TABLE
-- =====================================================
-- Main survey/form definitions
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

-- =====================================================
-- 4. PERGUNTAS_FORM TABLE
-- =====================================================
-- Individual questions within each survey/form
CREATE TABLE perguntas_form (
    id_perg SERIAL PRIMARY KEY,
    id_form INTEGER NOT NULL REFERENCES header_formulario(id) ON DELETE CASCADE,
    num_pergunta INTEGER NOT NULL,
    pergunta TEXT NOT NULL,
    alternativa TEXT, -- For multiple choice options (JSON format or comma-separated)
    tipagem VARCHAR(50) NOT NULL CHECK (tipagem IN ('text', 'multiple_choice', 'checkbox', 'rating', 'date', 'number')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_form, num_pergunta) -- Ensures question numbers are unique within each form
);

-- =====================================================
-- 5. HEADER_FORM_CONT TABLE
-- =====================================================
-- Tracks user participation in surveys/forms
CREATE TABLE header_form_cont (
    id SERIAL PRIMARY KEY,
    id_form INTEGER NOT NULL REFERENCES header_formulario(id) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(id_form, id_user) -- Prevents duplicate participation
);

-- =====================================================
-- 6. RESP_FORM TABLE
-- =====================================================
-- Stores individual responses to questions
CREATE TABLE resp_form (
    id SERIAL PRIMARY KEY,
    id_perg INTEGER NOT NULL REFERENCES perguntas_form(id_perg) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resposta TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_perg, id_user) -- One response per question per user
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nome ON users(nome);

-- User_progress table indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_xp_total ON user_progress(xp_total);

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
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_header_formulario_updated_at BEFORE UPDATE ON header_formulario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perguntas_form_updated_at BEFORE UPDATE ON perguntas_form
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resp_form_updated_at BEFORE UPDATE ON resp_form
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
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
    u.nome || ' ' || u.sobrenome AS criador_nome,
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
