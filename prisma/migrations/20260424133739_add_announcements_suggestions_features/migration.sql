-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'announcement_posted';
ALTER TYPE "NotificationType" ADD VALUE 'new_suggestion';
ALTER TYPE "NotificationType" ADD VALUE 'feedback_reply';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "announcement_id" INTEGER,
ADD COLUMN     "suggestion_id" INTEGER,
ALTER COLUMN "request_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "suggestions" ADD COLUMN     "target_roles" "Role"[],
ADD COLUMN     "target_user_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "title" VARCHAR(255);

-- CreateTable
CREATE TABLE "suggestion_replies" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_attachments" (
    "id" SERIAL NOT NULL,
    "suggestion_id" INTEGER,
    "reply_id" INTEGER,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_key" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_read_statuses" (
    "id" SERIAL NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_read_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_comments" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_read_statuses_suggestion_id_user_id_key" ON "suggestion_read_statuses"("suggestion_id", "user_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_replies" ADD CONSTRAINT "suggestion_replies_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_replies" ADD CONSTRAINT "suggestion_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_attachments" ADD CONSTRAINT "suggestion_attachments_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_attachments" ADD CONSTRAINT "suggestion_attachments_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "suggestion_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_read_statuses" ADD CONSTRAINT "suggestion_read_statuses_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_read_statuses" ADD CONSTRAINT "suggestion_read_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
