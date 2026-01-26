-- Add approval status and child linking for Parent role
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS child_link_id VARCHAR(50) DEFAULT NULL;

-- Index for faster lookups on specific columns if needed
-- CREATE INDEX idx_child_link ON users(child_link_id);
