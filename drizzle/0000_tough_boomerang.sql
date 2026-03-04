CREATE TYPE "public"."approval_level" AS ENUM('head_of_department', 'hr', 'head_of_finance', 'ceo_md', 'final');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."attachment_type" AS ENUM('employee_signature', 'manager_signature', 'hr_signature', 'ceo_signature', 'supporting_document');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('annual', 'sick', 'personal', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."mfa_method" AS ENUM('email', 'sms', 'totp');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('request_submitted', 'request_approved', 'request_rejected', 'approval_needed', 'approval_completed');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('leave', 'car', 'expenditure');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'hr', 'head_of_department', 'head_of_finance', 'ceo_md');--> statement-breakpoint
CREATE TABLE "car_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "car_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"destination" varchar(255) NOT NULL,
	"purpose" text,
	"departure_date" varchar(10) NOT NULL,
	"departure_time" varchar(5),
	"passengers" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenditure_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expenditure_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'RWF' NOT NULL,
	"department" varchar(255),
	"category" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "form_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"form_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "form_submissions_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leave_balances_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"year" integer NOT NULL,
	"annual_leave_entitled" integer DEFAULT 18 NOT NULL,
	"annual_leave_carryover" integer DEFAULT 0 NOT NULL,
	"annual_leave_taken" integer DEFAULT 0 NOT NULL,
	"annual_leave_remaining" integer DEFAULT 18 NOT NULL,
	"sick_leave" integer DEFAULT 10 NOT NULL,
	"personal_leave" integer DEFAULT 3 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leave_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"leave_type" "leave_type" NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"reason" text,
	"leave_days_requested" integer,
	"leave_days_entitled" integer,
	"leave_days_taken" integer,
	"leave_days_remaining" integer,
	"employee_signature_file_id" integer,
	"manager_signature_file_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "magic_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "mfa_methods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_methods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"method" "mfa_method" NOT NULL,
	"phone_number" varchar(20),
	"is_enabled" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"backup_codes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfa_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"login_method" varchar(64) NOT NULL,
	"is_mfa_verified" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mfa_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"request_id" integer NOT NULL,
	"triggered_by_user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "otp_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"code" varchar(6) NOT NULL,
	"method" "mfa_method" NOT NULL,
	"destination" varchar(320),
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "password_reset_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "request_approvals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "request_approvals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"approver_id" integer NOT NULL,
	"approval_level" "approval_level" NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"comments" text,
	"signature_file_id" integer,
	"approval_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_attachments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "request_attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_key" varchar(255) NOT NULL,
	"mime_type" varchar(100),
	"type" "attachment_type" DEFAULT 'supporting_document',
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"type" "request_type" NOT NULL,
	"status" "request_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"current_approval_level" "approval_level" DEFAULT 'head_of_department' NOT NULL,
	"initial_approver_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"password" text,
	"login_method" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"additional_roles" text,
	"department" varchar(255),
	"position" varchar(255),
	"staff_id" varchar(50),
	"date_of_employment" varchar(10),
	"manager_id" integer,
	"profile_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
ALTER TABLE "car_requests" ADD CONSTRAINT "car_requests_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenditure_requests" ADD CONSTRAINT "expenditure_requests_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_signature_file_id_request_attachments_id_fk" FOREIGN KEY ("employee_signature_file_id") REFERENCES "public"."request_attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_manager_signature_file_id_request_attachments_id_fk" FOREIGN KEY ("manager_signature_file_id") REFERENCES "public"."request_attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_methods" ADD CONSTRAINT "mfa_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_sessions" ADD CONSTRAINT "mfa_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_approvals" ADD CONSTRAINT "request_approvals_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_approvals" ADD CONSTRAINT "request_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_approvals" ADD CONSTRAINT "request_approvals_signature_file_id_request_attachments_id_fk" FOREIGN KEY ("signature_file_id") REFERENCES "public"."request_attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_initial_approver_id_users_id_fk" FOREIGN KEY ("initial_approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;