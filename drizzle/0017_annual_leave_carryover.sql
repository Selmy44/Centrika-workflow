-- Migration: Add carryover fields for annual leave tracking
-- This enables tracking of unused annual leave days that carry over to the next year

-- Drop the old leave_balances table if it exists and recreate with new structure
-- Note: In production, you would use ALTER TABLE to add columns without data loss

ALTER TABLE leave_balances 
  RENAME TO leave_balances_old;

CREATE TABLE leave_balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  year INTEGER NOT NULL,
  -- Annual leave tracking with carryover support
  annual_leave_entitled INTEGER NOT NULL DEFAULT 18, -- Base 18 days per year (1.5 days/month)
  annual_leave_carryover INTEGER NOT NULL DEFAULT 0, -- Unused days from previous year
  annual_leave_taken INTEGER NOT NULL DEFAULT 0, -- Days used this year
  annual_leave_remaining INTEGER NOT NULL DEFAULT 18, -- 18 + carryover - taken
  -- Other leave types
  sick_leave INTEGER NOT NULL DEFAULT 10,
  personal_leave INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Migrate existing data (set all to 2026 year for current records)
INSERT INTO leave_balances (user_id, year, annual_leave_entitled, annual_leave_carryover, annual_leave_taken, annual_leave_remaining, sick_leave, personal_leave, updated_at)
SELECT user_id, COALESCE(year, 2026), 18, 0, 0, 18, sick_leave, personal_leave, updated_at
FROM leave_balances_old;

-- Drop old table
DROP TABLE leave_balances_old;

-- Add unique constraint to ensure one record per user per year
ALTER TABLE leave_balances
  ADD CONSTRAINT unique_user_year UNIQUE(user_id, year);

-- Create index for faster lookups
CREATE INDEX idx_leave_balances_user_year ON leave_balances(user_id, year);
