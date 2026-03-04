-- Add the missing uploaded_by column to request_attachments table
-- This column is defined in the Drizzle schema but was never migrated to the database
ALTER TABLE "request_attachments" ADD COLUMN "uploaded_by" integer;

-- Backfill existing rows: set uploaded_by to the request owner's user_id
UPDATE "request_attachments" ra
SET "uploaded_by" = r."user_id"
FROM "requests" r
WHERE ra."request_id" = r."id"
  AND ra."uploaded_by" IS NULL;

-- Now make the column NOT NULL as the schema expects
ALTER TABLE "request_attachments" ALTER COLUMN "uploaded_by" SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE;
