-- Allow decimal monetary amounts (e.g. 1000.50). Existing whole-number values convert losslessly.
-- AlterTable
ALTER TABLE "expenditure_requests" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "asset_requests" ALTER COLUMN "estimated_cost" SET DATA TYPE DECIMAL(18,2);
