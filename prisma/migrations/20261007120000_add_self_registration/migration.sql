-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'user_registered';

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE IF NOT EXISTS "email_verifications" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "purpose" VARCHAR(32) NOT NULL DEFAULT 'registration',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_verifications_email_purpose_idx" ON "email_verifications"("email", "purpose");
