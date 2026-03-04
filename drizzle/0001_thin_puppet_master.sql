ALTER TYPE "public"."role" ADD VALUE 'hr';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'head_of_department';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'ceo_md';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manager_id" integer;