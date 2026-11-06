-- Screen lock per sign-in session. Add-only: a new table.
-- CreateTable
CREATE TABLE "session_locks" (
    "sid" VARCHAR(64) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_locks_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "session_locks_user_id_idx" ON "session_locks"("user_id");

