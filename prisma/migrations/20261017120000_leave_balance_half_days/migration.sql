-- Annual leave accrues 1.5 days a month; whole-number columns were silently dropping the half days
ALTER TABLE "leave_balances"
  ALTER COLUMN "annual_leave_entitled" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "annual_leave_entitled" SET DEFAULT 18,
  ALTER COLUMN "annual_leave_carryover" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "annual_leave_carryover" SET DEFAULT 0,
  ALTER COLUMN "annual_leave_taken" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "annual_leave_taken" SET DEFAULT 0,
  ALTER COLUMN "annual_leave_remaining" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "annual_leave_remaining" SET DEFAULT 18;
