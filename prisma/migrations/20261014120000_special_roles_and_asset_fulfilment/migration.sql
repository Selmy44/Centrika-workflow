-- New special roles
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'hr_admin_officer';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'stock_procurement_officer';

-- New notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'role_updated';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'asset_assigned';

-- Fulfilment of approved asset requests by Stock & Procurement
ALTER TABLE "asset_requests"
  ADD COLUMN "fulfilled_at" TIMESTAMP(3),
  ADD COLUMN "fulfilled_by_id" INTEGER,
  ADD COLUMN "fulfilled_asset_id" INTEGER,
  ADD COLUMN "fulfillment_note" TEXT;

ALTER TABLE "asset_requests"
  ADD CONSTRAINT "asset_requests_fulfilled_by_id_fkey" FOREIGN KEY ("fulfilled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_requests"
  ADD CONSTRAINT "asset_requests_fulfilled_asset_id_fkey" FOREIGN KEY ("fulfilled_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
