CREATE TABLE "form_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "form_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_id" integer NOT NULL,
	"form_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "form_submissions_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_requested" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_entitled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_taken" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_days_remaining" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;