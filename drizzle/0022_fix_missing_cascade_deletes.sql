-- Add CASCADE DELETE to missing request-type foreign keys
-- This fixes the issue where users couldn't be deleted because their requests couldn't be deleted

-- 1. Fix leave_requests foreign key
ALTER TABLE "leave_requests"
  DROP CONSTRAINT IF EXISTS "leave_requests_request_id_requests_id_fk";
ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_request_id_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;

-- 2. Fix car_requests foreign key
ALTER TABLE "car_requests"
  DROP CONSTRAINT IF EXISTS "car_requests_request_id_requests_id_fk";
ALTER TABLE "car_requests"
  ADD CONSTRAINT "car_requests_request_id_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;

-- 3. Fix expenditure_requests foreign key
ALTER TABLE "expenditure_requests"
  DROP CONSTRAINT IF EXISTS "expenditure_requests_request_id_requests_id_fk";
ALTER TABLE "expenditure_requests"
  ADD CONSTRAINT "expenditure_requests_request_id_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;
