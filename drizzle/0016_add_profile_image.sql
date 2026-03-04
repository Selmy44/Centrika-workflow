-- Add profile_image column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_image ON users(id);
