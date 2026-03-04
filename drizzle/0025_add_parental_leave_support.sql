-- AlterEnum
ALTER TYPE "leave_type" ADD VALUE 'parental';

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN "parental_leave_type" varchar(20);
