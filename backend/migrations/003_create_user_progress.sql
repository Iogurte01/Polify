-- Migration: Criar tabela user_progress para XP/gamificação
-- Data: 2026-04-28
-- Descrição: Estrutura para armazenar XP total e progresso de gamificação por usuário

CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Índice para performance em consultas por usuário
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Índice para performance em consultas por XP
CREATE INDEX IF NOT EXISTS idx_user_progress_xp_total ON user_progress(xp_total);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inicializar XP = 0 para usuários existentes que ainda não tem progresso
INSERT INTO user_progress (user_id, xp_total)
SELECT id, 0 FROM users
WHERE id NOT IN (SELECT user_id FROM user_progress);

-- Comentário para documentação da tabela
COMMENT ON TABLE user_progress IS 'Tabela de progresso de gamificação para armazenar XP total por usuário';
COMMENT ON COLUMN user_progress.id IS 'Identificador único do registro de progresso';
COMMENT ON COLUMN user_progress.user_id IS 'Chave estrangeira para o usuário';
COMMENT ON COLUMN user_progress.xp_total IS 'XP total acumulado pelo usuário';
COMMENT ON COLUMN user_progress.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN user_progress.updated_at IS 'Data da última atualização do registro';
