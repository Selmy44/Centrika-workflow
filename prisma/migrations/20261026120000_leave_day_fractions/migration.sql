-- Annual leave builds up in half days (1.5 a month), so a request's day counts can be fractional.
-- Widening INTEGER to DOUBLE PRECISION keeps every existing value exactly.
ALTER TABLE "leave_requests"
  ALTER COLUMN "leave_days_requested" TYPE DOUBLE PRECISION,
  ALTER COLUMN "leave_days_entitled" TYPE DOUBLE PRECISION,
  ALTER COLUMN "leave_days_taken" TYPE DOUBLE PRECISION,
  ALTER COLUMN "leave_days_remaining" TYPE DOUBLE PRECISION;
