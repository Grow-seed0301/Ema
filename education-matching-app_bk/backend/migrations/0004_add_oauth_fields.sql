-- Add OAuth fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR;

-- Add OAuth fields to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS oauth_id VARCHAR;

-- Add comments for clarity
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider: google, facebook, instagram, twitter';
COMMENT ON COLUMN users.oauth_id IS 'Unique ID from the OAuth provider';
COMMENT ON COLUMN teachers.oauth_provider IS 'OAuth provider: google, facebook, instagram, twitter';
COMMENT ON COLUMN teachers.oauth_id IS 'Unique ID from the OAuth provider';
