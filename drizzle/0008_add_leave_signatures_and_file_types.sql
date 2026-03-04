-- Add attachment type enum
CREATE TYPE "public"."attachment_type" AS ENUM('employee_signature', 'manager_signature', 'hr_signature', 'ceo_signature', 'supporting_document');

-- Modify request_attachments table
ALTER TABLE "public"."request_attachments" ADD COLUMN "type" "public"."attachment_type" DEFAULT 'supporting_document';
ALTER TABLE "public"."request_attachments" ADD COLUMN "uploaded_by" integer NOT NULL;
ALTER TABLE "public"."request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");

-- Modify leave_requests table to add leave balance and signature tracking
ALTER TABLE "public"."leave_requests" ADD COLUMN "leave_days_requested" integer;
ALTER TABLE "public"."leave_requests" ADD COLUMN "leave_days_entitled" integer;
ALTER TABLE "public"."leave_requests" ADD COLUMN "leave_days_taken" integer;
ALTER TABLE "public"."leave_requests" ADD COLUMN "leave_days_remaining" integer;
ALTER TABLE "public"."leave_requests" ADD COLUMN "employee_signature_file_id" integer;
ALTER TABLE "public"."leave_requests" ADD COLUMN "manager_signature_file_id" integer;
ALTER TABLE "public"."leave_requests" ADD CONSTRAINT "leave_requests_employee_signature_fk" FOREIGN KEY ("employee_signature_file_id") REFERENCES "public"."request_attachments"("id");
ALTER TABLE "public"."leave_requests" ADD CONSTRAINT "leave_requests_manager_signature_fk" FOREIGN KEY ("manager_signature_file_id") REFERENCES "public"."request_attachments"("id");

-- Modify request_approvals table to add signature and approval date
ALTER TABLE "public"."request_approvals" ADD COLUMN "signature_file_id" integer;
ALTER TABLE "public"."request_approvals" ADD COLUMN "approval_date" timestamp;
ALTER TABLE "public"."request_approvals" ADD CONSTRAINT "request_approvals_signature_fk" FOREIGN KEY ("signature_file_id") REFERENCES "public"."request_attachments"("id");
