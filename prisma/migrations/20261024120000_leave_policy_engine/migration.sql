-- Leave policy engine: per-type rules, HR's holiday calendar and policy settings, RSSB maternity claims,
-- time-off-in-lieu credits. Add-only: new types, nullable columns and new tables; nothing existing changes.

-- CreateEnum
CREATE TYPE "MaternityClaimStatus" AS ENUM ('not_filed', 'submitted', 'approved', 'paid', 'rejected');

-- AlterEnum
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'work_injury';
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'compensatory';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'leave_reminder';

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "day_unit" VARCHAR(20),
ADD COLUMN     "event_date" VARCHAR(10),
ADD COLUMN     "expected_delivery_date" VARCHAR(10),
ADD COLUMN     "extends_request_id" INTEGER,
ADD COLUMN     "leave_subtype" VARCHAR(50),
ADD COLUMN     "recall_reason" TEXT,
ADD COLUMN     "recalled_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public_holidays" (
    "id" SERIAL NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'national',
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policy_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB NOT NULL,
    "updated_by_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_policy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maternity_claims" (
    "id" SERIAL NOT NULL,
    "leave_request_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "leave_start" VARCHAR(10) NOT NULL,
    "leave_end" VARCHAR(10) NOT NULL,
    "rssb_start" VARCHAR(10) NOT NULL,
    "rssb_end" VARCHAR(10) NOT NULL,
    "rssb_days" INTEGER NOT NULL,
    "extension_days" INTEGER NOT NULL DEFAULT 0,
    "due_date" VARCHAR(10) NOT NULL,
    "target_date" VARCHAR(10) NOT NULL,
    "status" "MaternityClaimStatus" NOT NULL DEFAULT 'not_filed',
    "monthly_salary" DECIMAL(18,2),
    "expected_amount" DECIMAL(18,2),
    "amount_paid" DECIMAL(18,2),
    "rssb_reference" VARCHAR(100),
    "filed_at" VARCHAR(10),
    "approved_at" VARCHAR(10),
    "paid_at" VARCHAR(10),
    "notes" TEXT,
    "reminders_sent" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maternity_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_credits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "earned_on" VARCHAR(10) NOT NULL,
    "expires_on" VARCHAR(10) NOT NULL,
    "granted_by_id" INTEGER NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_credit_uses" (
    "id" SERIAL NOT NULL,
    "credit_id" INTEGER NOT NULL,
    "leave_request_id" INTEGER NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_credit_uses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "public_holidays_date_key" ON "public_holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "maternity_claims_leave_request_id_key" ON "maternity_claims"("leave_request_id");

-- CreateIndex
CREATE INDEX "maternity_claims_status_idx" ON "maternity_claims"("status");

-- CreateIndex
CREATE INDEX "leave_credits_user_id_idx" ON "leave_credits"("user_id");

-- CreateIndex
CREATE INDEX "leave_credit_uses_leave_request_id_idx" ON "leave_credit_uses"("leave_request_id");

-- AddForeignKey
ALTER TABLE "maternity_claims" ADD CONSTRAINT "maternity_claims_leave_request_id_fkey" FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maternity_claims" ADD CONSTRAINT "maternity_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_credits" ADD CONSTRAINT "leave_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_credit_uses" ADD CONSTRAINT "leave_credit_uses_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "leave_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_credit_uses" ADD CONSTRAINT "leave_credit_uses_leave_request_id_fkey" FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the Rwandan public holidays for 2025–2027 (HR maintains the table from here; 2027 Eid dates are estimates)
INSERT INTO "public_holidays" ("date", "name", "kind", "confirmed", "updated_at") VALUES
    ('2025-01-01', 'New Year''s Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-01-02', 'Day after New Year''s Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-02-01', 'National Heroes'' Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-03-31', 'Eid al-Fitr', 'national', true, CURRENT_TIMESTAMP),
    ('2025-04-07', 'Genocide against the Tutsi Memorial Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-04-18', 'Good Friday', 'national', true, CURRENT_TIMESTAMP),
    ('2025-04-21', 'Easter Monday', 'national', true, CURRENT_TIMESTAMP),
    ('2025-05-01', 'Labour Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-06-06', 'Eid al-Adha', 'national', true, CURRENT_TIMESTAMP),
    ('2025-07-01', 'Independence Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-07-04', 'Liberation Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-08-01', 'Umuganura Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-08-15', 'Assumption Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-12-25', 'Christmas Day', 'national', true, CURRENT_TIMESTAMP),
    ('2025-12-26', 'Boxing Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-01-01', 'New Year''s Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-01-02', 'Day after New Year''s Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-02-01', 'National Heroes'' Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-03-20', 'Eid al-Fitr', 'national', true, CURRENT_TIMESTAMP),
    ('2026-04-03', 'Good Friday', 'national', true, CURRENT_TIMESTAMP),
    ('2026-04-06', 'Easter Monday', 'national', true, CURRENT_TIMESTAMP),
    ('2026-04-07', 'Genocide against the Tutsi Memorial Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-05-01', 'Labour Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-05-27', 'Eid al-Adha', 'national', true, CURRENT_TIMESTAMP),
    ('2026-07-01', 'Independence Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-07-04', 'Liberation Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-08-07', 'Umuganura Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-08-15', 'Assumption Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-12-25', 'Christmas Day', 'national', true, CURRENT_TIMESTAMP),
    ('2026-12-26', 'Boxing Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-01-01', 'New Year''s Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-01-02', 'Day after New Year''s Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-02-01', 'National Heroes'' Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-03-10', 'Eid al-Fitr', 'national', false, CURRENT_TIMESTAMP),
    ('2027-03-26', 'Good Friday', 'national', true, CURRENT_TIMESTAMP),
    ('2027-03-29', 'Easter Monday', 'national', true, CURRENT_TIMESTAMP),
    ('2027-04-07', 'Genocide against the Tutsi Memorial Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-05-01', 'Labour Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-05-17', 'Eid al-Adha', 'national', false, CURRENT_TIMESTAMP),
    ('2027-07-01', 'Independence Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-07-04', 'Liberation Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-08-06', 'Umuganura Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-08-15', 'Assumption Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-12-25', 'Christmas Day', 'national', true, CURRENT_TIMESTAMP),
    ('2027-12-26', 'Boxing Day', 'national', true, CURRENT_TIMESTAMP)
ON CONFLICT ("date") DO NOTHING;

-- Existing maternity/paternity requests: record the sub-type and the unit they were counted in
UPDATE "leave_requests" SET "leave_subtype" = "parental_leave_type"::text
WHERE "leave_type" = 'parental' AND "parental_leave_type" IS NOT NULL AND "leave_subtype" IS NULL;
