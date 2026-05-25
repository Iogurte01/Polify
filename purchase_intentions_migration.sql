-- =====================================================
-- PURCHASE INTENTIONS TABLE
-- =====================================================
-- Stores fictional purchase intentions for beta testing
-- and internal research during platform beta phase

CREATE TABLE IF NOT EXISTS purchase_intentions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    selected_plan VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    tokens_amount INTEGER NOT NULL,
    price VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_purchase_intentions_user ON purchase_intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_intentions_created ON purchase_intentions(created_at);

-- Create trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_purchase_intentions_updated_at BEFORE UPDATE ON purchase_intentions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
