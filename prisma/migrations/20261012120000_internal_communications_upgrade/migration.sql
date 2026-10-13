-- Internal communications upgrade: categories, priority, pinning, acknowledgements,
-- threaded comment replies, comment like/dislike, post reactions and read receipts.

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "category" VARCHAR(30) NOT NULL DEFAULT 'general',
ADD COLUMN     "edited_at" TIMESTAMP(3),
ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
ADD COLUMN     "requires_ack" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "announcement_comments" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "edited_at" TIMESTAMP(3),
ADD COLUMN     "parent_id" INTEGER;

-- AlterTable (existing rows were likes, so they keep the "like" default)
ALTER TABLE "announcement_likes" ADD COLUMN     "reaction" VARCHAR(20) NOT NULL DEFAULT 'like';

-- AlterTable
ALTER TABLE "announcement_comment_likes" ADD COLUMN     "reaction" VARCHAR(10) NOT NULL DEFAULT 'like';

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_user_id_key" ON "announcement_reads"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "announcement_comments_announcement_id_parent_id_idx" ON "announcement_comments"("announcement_id", "parent_id");

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "announcement_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
