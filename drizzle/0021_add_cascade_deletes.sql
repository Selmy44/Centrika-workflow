-- Drop existing foreign key constraints and recreate them with CASCADE DELETE
-- This ensures that when a user is deleted, all related records are automatically deleted

-- 1. Requests table - cascade delete requests when user is deleted
ALTER TABLE "requests" 
  DROP CONSTRAINT IF EXISTS "requests_user_id_users_id_fk";
ALTER TABLE "requests"
  ADD CONSTRAINT "requests_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 2. Requests table - set null for initialApproverId
ALTER TABLE "requests"
  DROP CONSTRAINT IF EXISTS "requests_initial_approver_id_users_id_fk";
ALTER TABLE "requests"
  DROP CONSTRAINT IF EXISTS "requests_initial_approver_id_fkey";
ALTER TABLE "requests"
  ADD CONSTRAINT "requests_initial_approver_id_users_id_fk"
    FOREIGN KEY ("initial_approver_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- 3. Request Approvals table - cascade delete approvals for both requestId and approverId
ALTER TABLE "request_approvals"
  DROP CONSTRAINT IF EXISTS "request_approvals_request_id_requests_id_fk";
ALTER TABLE "request_approvals"
  ADD CONSTRAINT "request_approvals_request_id_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;

ALTER TABLE "request_approvals"
  DROP CONSTRAINT IF EXISTS "request_approvals_approver_id_users_id_fk";
ALTER TABLE "request_approvals"
  ADD CONSTRAINT "request_approvals_approver_id_users_id_fk"
    FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 4. Request Attachments table - cascade delete attachments for requestId only
ALTER TABLE "request_attachments"
  DROP CONSTRAINT IF EXISTS "request_attachments_request_id_requests_id_fk";
ALTER TABLE "request_attachments"
  ADD CONSTRAINT "request_attachments_request_id_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;

-- 5. Leave Balances table - cascade delete leave balances when user is deleted
ALTER TABLE "leave_balances"
  DROP CONSTRAINT IF EXISTS "leave_balances_user_id_users_id_fk";
ALTER TABLE "leave_balances"
  DROP CONSTRAINT IF EXISTS "leave_balances_user_id_fkey1";
ALTER TABLE "leave_balances"
  ADD CONSTRAINT "leave_balances_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 6. Password Reset Tokens table - cascade delete tokens when user is deleted
ALTER TABLE "password_reset_tokens"
  DROP CONSTRAINT IF EXISTS "password_reset_tokens_user_id_users_id_fk";
ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 7. Notifications table - cascade delete notifications for all three user references
ALTER TABLE "notifications"
  DROP CONSTRAINT IF EXISTS "notifications_user_id_users_id_fk",
  ADD CONSTRAINT "notifications_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "notifications"
  DROP CONSTRAINT IF EXISTS "notifications_request_id_requests_id_fk",
  ADD CONSTRAINT "notifications_request_id_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;

ALTER TABLE "notifications"
  DROP CONSTRAINT IF EXISTS "notifications_triggered_by_user_id_users_id_fk",
  ADD CONSTRAINT "notifications_triggered_by_user_id_users_id_fk"
    FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 8. Form Submissions table - cascade delete when request is deleted
ALTER TABLE "form_submissions"
  DROP CONSTRAINT IF EXISTS "form_submissions_request_id_requests_id_fk",
  ADD CONSTRAINT "form_submissions_request_id_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE;
