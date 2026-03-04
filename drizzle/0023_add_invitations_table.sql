-- Create invitations table for admin/HR user invitation system
CREATE TABLE IF NOT EXISTS "invitations" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "email" varchar(320) NOT NULL,
  "token" varchar(255) NOT NULL UNIQUE,
  "role" "role" DEFAULT 'user' NOT NULL,
  "name" text,
  "created_by" integer NOT NULL,
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations"("email");
CREATE INDEX IF NOT EXISTS "invitations_token_idx" ON "invitations"("token");
CREATE INDEX IF NOT EXISTS "invitations_status_idx" ON "invitations"("status");
