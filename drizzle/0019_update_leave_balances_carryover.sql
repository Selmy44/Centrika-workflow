-- Migration: Update leave_balances table to track carryover and taken days
-- This implements professional leave management with carryover support
-- Annual leave: 18 days base + carryover from previous year
-- Remaining = Entitled + Carryover - Taken

-- Step 1: Add new columns to leave_balances table
ALTER TABLE leave_balances
  ADD COLUMN IF NOT EXISTS annual_leave_entitled INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS annual_leave_carryover INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_leave_taken INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_leave_remaining INTEGER DEFAULT 18;

-- Step 2: Migrate existing data from old structure to new
UPDATE leave_balances
SET 
  annual_leave_entitled = 18,
  annual_leave_carryover = 0,
  annual_leave_taken = 0,
  annual_leave_remaining = COALESCE(annual_leave, 18)
WHERE annual_leave_entitled IS NULL;

-- Step 3: Drop old column if it exists
ALTER TABLE leave_balances
  DROP COLUMN IF EXISTS annual_leave;

-- Step 4: Add unique constraint for one record per user per year
ALTER TABLE leave_balances
  ADD CONSTRAINT IF NOT EXISTS unique_user_year UNIQUE(user_id, year);

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_year ON leave_balances(user_id, year);

-- Step 6: Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_leave_balances_user ON leave_balances(user_id);

-- Comments for clarity
COMMENT ON TABLE leave_balances IS 'Tracks annual leave entitlement, carryover, taken days, and remaining balance for each user and year';
COMMENT ON COLUMN leave_balances.annual_leave_entitled IS 'Base annual leave entitlement: 18 days per year (1.5 days per month)';
COMMENT ON COLUMN leave_balances.annual_leave_carryover IS 'Unused days carried over from previous year (max 5-6 days as per policy)';
COMMENT ON COLUMN leave_balances.annual_leave_taken IS 'Total annual leave days already taken in this year';
COMMENT ON COLUMN leave_balances.annual_leave_remaining IS 'Available leave days: Entitled + Carryover - Taken';
