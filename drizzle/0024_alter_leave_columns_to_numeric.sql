-- Alter leave_requests table columns from integer to numeric to support decimal values (1.5 days per month)
ALTER TABLE "leave_requests" 
  ALTER COLUMN "leave_days_requested" TYPE numeric(5, 2) USING "leave_days_requested"::numeric(5, 2),
  ALTER COLUMN "leave_days_entitled" TYPE numeric(5, 2) USING "leave_days_entitled"::numeric(5, 2),
  ALTER COLUMN "leave_days_taken" TYPE numeric(5, 2) USING "leave_days_taken"::numeric(5, 2),
  ALTER COLUMN "leave_days_remaining" TYPE numeric(5, 2) USING "leave_days_remaining"::numeric(5, 2);

-- Alter leave_balances table columns from integer to numeric to support decimal values
ALTER TABLE "leave_balances" 
  ALTER COLUMN "annual_leave_entitled" TYPE numeric(5, 2) USING "annual_leave_entitled"::numeric(5, 2),
  ALTER COLUMN "annual_leave_carryover" TYPE numeric(5, 2) USING "annual_leave_carryover"::numeric(5, 2),
  ALTER COLUMN "annual_leave_taken" TYPE numeric(5, 2) USING "annual_leave_taken"::numeric(5, 2),
  ALTER COLUMN "annual_leave_remaining" TYPE numeric(5, 2) USING "annual_leave_remaining"::numeric(5, 2);
