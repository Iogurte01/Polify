-- =====================================================
-- POLIFY FINAL DATABASE SCHEMA (ATUALIZADO)
-- =====================================================
-- Consolidated final PostgreSQL schema after applying all SQL files
-- and removing migrations / incremental scripts.
-- =====================================================

-- =====================================================
-- CLEAN RECREATION
-- =====================================================

DROP VIEW IF EXISTS survey_statistics;
DROP VIEW IF EXISTS survey_details;

DROP TABLE IF EXISTS resp_form CASCADE;
DROP TABLE IF EXISTS header_form_cont CASCADE;
DROP TABLE IF EXISTS perguntas_form CASCADE;
DROP TABLE IF EXISTS header_formulario CASCADE;
DROP TABLE IF EXISTS purchase_intentions CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS token_balance CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;  -- Tabela de tokens de redefinição de senha

DROP FUNCTION IF EXISTS update_users_updated_at();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- 1. USERS
-- =====================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100),
    idade INTEGER CHECK (idade >= 0 AND idade <= 150),
    cidade VARCHAR(100),
    pais VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash VARCHAR(255),

    -- Login Google
    google_id VARCHAR(255) UNIQUE,
    foto_perfil TEXT,
    email_verificado BOOLEAN DEFAULT FALSE,
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'local'
        CHECK (auth_provider IN ('local', 'google')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_id_check CHECK (id > 0),
    CONSTRAINT users_nome_not_null CHECK (nome IS NOT NULL),
    CONSTRAINT users_email_not_null CHECK (email IS NOT NULL)
);

-- =====================================================
-- 2. USER_PROGRESS
-- =====================================================

CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- =====================================================
-- 3. PURCHASE_INTENTIONS
-- =====================================================

CREATE TABLE purchase_intentions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    selected_plan VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    tokens_amount INTEGER NOT NULL,
    price VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. HEADER_FORMULARIO
-- =====================================================

CREATE TABLE header_formulario (
    id SERIAL PRIMARY KEY,
    nome_formulario VARCHAR(255) NOT NULL,
    descricao_formulario TEXT,
    categoria VARCHAR(100) NOT NULL,
    min_respondentes INTEGER DEFAULT 1 CHECK (min_respondentes >= 1),
    tempo_max_dias INTEGER CHECK (tempo_max_dias >= 1),
    id_criador INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pontos_base INTEGER DEFAULT 0 CHECK (pontos_base >= 0),
    
    -- [NOVAS COLUNAS]
    pontos_recompensa INTEGER DEFAULT 0 CHECK (pontos_recompensa >= 0),
    tempo_estimado VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 5. PERGUNTAS_FORM
-- =====================================================

CREATE TABLE perguntas_form (
    id_perg SERIAL PRIMARY KEY,
    id_form INTEGER NOT NULL REFERENCES header_formulario(id) ON DELETE CASCADE,
    num_pergunta INTEGER NOT NULL,
    pergunta TEXT NOT NULL,
    alternativa JSONB DEFAULT '[]'::jsonb,
    tipagem VARCHAR(50) NOT NULL CHECK (
        tipagem IN ('text', 'multiple_choice', 'checkbox', 'rating', 'date', 'number')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_form, num_pergunta)
);

-- =====================================================
-- 6. HEADER_FORM_CONT
-- =====================================================

CREATE TABLE header_form_cont (
    id SERIAL PRIMARY KEY,
    id_form INTEGER NOT NULL REFERENCES header_formulario(id) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(id_form, id_user)
);

-- =====================================================
-- 7. RESP_FORM
-- =====================================================

CREATE TABLE resp_form (
    id SERIAL PRIMARY KEY,
    id_perg INTEGER NOT NULL REFERENCES perguntas_form(id_perg) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resposta JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_perg, id_user)
);

-- =====================================================
-- 8. TOKEN_BALANCE (Histórico e Saldo de Tokens)
-- =====================================================

CREATE TABLE token_balance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo da transação: entrada (credit) ou saída (debit)
    transaction_type VARCHAR(20) NOT NULL CHECK (
        transaction_type IN ('credit', 'debit')
    ),
    
    -- Quantidade de tokens na transação
    amount INTEGER NOT NULL CHECK (amount > 0),
    
    -- Saldo atual do usuário LOGO APÓS essa transação (snapshot)
    current_balance INTEGER NOT NULL CHECK (current_balance >= 0),
    
    -- Motivo / Descrição da transação
    reason VARCHAR(255) NOT NULL,
    
    -- Status da compra/transação
    purchase_status VARCHAR(50) NOT NULL DEFAULT 'completed'
        CHECK (purchase_status IN ('pending', 'completed', 'failed', 'canceled', 'refunded')),
    
    -- Datas de criação e atualização
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. PASSWORD_RESET_TOKENS - Tokens de Redefinição de Senha
-- =====================================================

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nome ON users(nome);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_xp_total ON user_progress(xp_total);

CREATE INDEX idx_purchase_intentions_user ON purchase_intentions(user_id);
CREATE INDEX idx_purchase_intentions_created ON purchase_intentions(created_at);

CREATE INDEX idx_header_formulario_criador ON header_formulario(id_criador);
CREATE INDEX idx_header_formulario_categoria ON header_formulario(categoria);
CREATE INDEX idx_header_formulario_active ON header_formulario(is_active);

CREATE INDEX idx_perguntas_form_form ON perguntas_form(id_form);
CREATE INDEX idx_perguntas_form_tipagem ON perguntas_form(tipagem);

CREATE INDEX idx_header_form_cont_form ON header_form_cont(id_form);
CREATE INDEX idx_header_form_cont_user ON header_form_cont(id_user);
CREATE INDEX idx_header_form_cont_completed ON header_form_cont(completed);

CREATE INDEX idx_resp_form_pergunta ON resp_form(id_perg);
CREATE INDEX idx_resp_form_user ON resp_form(id_user);

CREATE INDEX idx_token_balance_user ON token_balance(user_id);
CREATE INDEX idx_token_balance_created ON token_balance(created_at);
CREATE INDEX idx_token_balance_status ON token_balance(purchase_status);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_intentions_updated_at
BEFORE UPDATE ON purchase_intentions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_header_formulario_updated_at
BEFORE UPDATE ON header_formulario
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perguntas_form_updated_at
BEFORE UPDATE ON perguntas_form
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resp_form_updated_at
BEFORE UPDATE ON resp_form
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_balance_updated_at
BEFORE UPDATE ON token_balance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_reset_tokens_updated_at
BEFORE UPDATE ON password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS
-- =====================================================

CREATE VIEW survey_details AS
SELECT 
    hf.id,
    hf.nome_formulario,
    hf.descricao_formulario,
    hf.categoria,
    hf.min_respondentes,
    hf.tempo_max_dias,
    hf.pontos_base,
    
    -- [NOVAS COLUNAS AQUI]
    hf.pontos_recompensa,
    hf.tempo_estimado,
    
    hf.created_at,
    hf.is_active,
    u.nome || ' ' || COALESCE(u.sobrenome, '') AS criador_nome,
    u.email AS criador_email
FROM header_formulario hf
JOIN users u ON hf.id_criador = u.id;

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