CREATE TYPE "public"."mfa_method" AS ENUM('email', 'sms', 'totp');--> statement-breakpoint
ALTER TYPE "public"."approval_status" ADD VALUE 'cancelled';--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "form_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"form_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "form_submissions_request_id_unique" UNIQUE("request_id")
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
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_requested" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_entitled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_taken" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_remaining" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_methods" ADD CONSTRAINT "mfa_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_sessions" ADD CONSTRAINT "mfa_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;