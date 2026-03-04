CREATE TYPE "public"."attachment_type" AS ENUM('employee_signature', 'manager_signature', 'hr_signature', 'ceo_signature', 'supporting_document');--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "current_approval_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "leave_days_requested" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "leave_days_entitled" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "leave_days_taken" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "leave_days_remaining" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "employee_signature_file_id" integer;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "manager_signature_file_id" integer;--> statement-breakpoint
ALTER TABLE "request_approvals" ADD COLUMN "signature_file_id" integer;--> statement-breakpoint
ALTER TABLE "request_approvals" ADD COLUMN "approval_date" timestamp;--> statement-breakpoint
ALTER TABLE "request_attachments" ADD COLUMN "type" "attachment_type" DEFAULT 'supporting_document';--> statement-breakpoint
ALTER TABLE "request_attachments" ADD COLUMN "uploaded_by" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_signature_file_id_request_attachments_id_fk" FOREIGN KEY ("employee_signature_file_id") REFERENCES "public"."request_attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_manager_signature_file_id_request_attachments_id_fk" FOREIGN KEY ("manager_signature_file_id") REFERENCES "public"."request_attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_approvals" ADD CONSTRAINT "request_approvals_signature_file_id_request_attachments_id_fk" FOREIGN KEY ("signature_file_id") REFERENCES "public"."request_attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;