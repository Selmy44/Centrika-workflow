-- Votes on internal communications: one poll per communication, its options, and one vote per person.

-- CreateTable
CREATE TABLE "announcement_polls" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "question" VARCHAR(300) NOT NULL,
    "preset" VARCHAR(20) NOT NULL DEFAULT 'yes_no',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "allow_change_vote" BOOLEAN NOT NULL DEFAULT true,
    "results_visibility" VARCHAR(20) NOT NULL DEFAULT 'always',
    "closes_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "last_reminded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_poll_options" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "tone" VARCHAR(10) NOT NULL DEFAULT 'neutral',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "announcement_poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_poll_votes" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "option_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_polls_announcement_id_key" ON "announcement_polls"("announcement_id");

-- CreateIndex
CREATE INDEX "announcement_poll_options_poll_id_idx" ON "announcement_poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "announcement_poll_votes_option_id_idx" ON "announcement_poll_votes"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_poll_votes_poll_id_user_id_key" ON "announcement_poll_votes"("poll_id", "user_id");

-- AddForeignKey
ALTER TABLE "announcement_polls" ADD CONSTRAINT "announcement_polls_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_poll_options" ADD CONSTRAINT "announcement_poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "announcement_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_poll_votes" ADD CONSTRAINT "announcement_poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "announcement_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_poll_votes" ADD CONSTRAINT "announcement_poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "announcement_poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_poll_votes" ADD CONSTRAINT "announcement_poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

