-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'request_returned';

-- AlterTable
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "returned_at" TIMESTAMP(3);
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "return_reason" TEXT;
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "returned_by_id" INTEGER;
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "returned_by_name" VARCHAR(255);
