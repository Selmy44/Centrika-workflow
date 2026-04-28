-- CreateTable
CREATE TABLE "announcement_likes" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_comment_likes" (
    "id" SERIAL NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_likes" (
    "id" SERIAL NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_reply_likes" (
    "id" SERIAL NOT NULL,
    "reply_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_reply_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_likes_announcement_id_user_id_key" ON "announcement_likes"("announcement_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_comment_likes_comment_id_user_id_key" ON "announcement_comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_likes_suggestion_id_user_id_key" ON "suggestion_likes"("suggestion_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_reply_likes_reply_id_user_id_key" ON "suggestion_reply_likes"("reply_id", "user_id");

-- AddForeignKey
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comment_likes" ADD CONSTRAINT "announcement_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "announcement_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comment_likes" ADD CONSTRAINT "announcement_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_likes" ADD CONSTRAINT "suggestion_likes_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_likes" ADD CONSTRAINT "suggestion_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_reply_likes" ADD CONSTRAINT "suggestion_reply_likes_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "suggestion_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_reply_likes" ADD CONSTRAINT "suggestion_reply_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
