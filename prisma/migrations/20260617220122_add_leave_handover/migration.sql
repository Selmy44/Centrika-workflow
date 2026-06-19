-- AlterEnum
ALTER TYPE "AttachmentType" ADD VALUE 'handover_document';

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "handover_person_email" VARCHAR(320),
ADD COLUMN     "handover_person_id" INTEGER,
ADD COLUMN     "handover_responsibilities" TEXT;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_handover_person_id_fkey" FOREIGN KEY ("handover_person_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
