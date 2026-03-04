-- Add default values to leave_requests columns
ALTER TABLE "public"."leave_requests" ALTER COLUMN "leave_days_requested" SET DEFAULT 0;
ALTER TABLE "public"."leave_requests" ALTER COLUMN "leave_days_entitled" SET DEFAULT 0;
ALTER TABLE "public"."leave_requests" ALTER COLUMN "leave_days_taken" SET DEFAULT 0;
ALTER TABLE "public"."leave_requests" ALTER COLUMN "leave_days_remaining" SET DEFAULT 0;
