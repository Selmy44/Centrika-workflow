-- How each attendance day started and ended, and an HR note. Add-only; existing days keep their times.
ALTER TABLE "attendance_days" ADD COLUMN     "clock_in_method" VARCHAR(10) NOT NULL DEFAULT 'manual',
ADD COLUMN     "clock_out_method" VARCHAR(10),
ADD COLUMN     "note" TEXT;

-- Label days already recorded: closed by the system, or by the person
UPDATE "attendance_days" SET "clock_out_method" = CASE WHEN "auto_closed" THEN 'system' ELSE 'manual' END WHERE "clock_out" IS NOT NULL;
