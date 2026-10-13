-- Asset condition, notes and stock-take verification
ALTER TABLE "assets"
  ADD COLUMN "condition" VARCHAR(20) NOT NULL DEFAULT 'good',
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "last_verified_at" TIMESTAMP(3),
  ADD COLUMN "last_verified_by_id" INTEGER;

ALTER TABLE "assets"
  ADD CONSTRAINT "assets_last_verified_by_id_fkey" FOREIGN KEY ("last_verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
