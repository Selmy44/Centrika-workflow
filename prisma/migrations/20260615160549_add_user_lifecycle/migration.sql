-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deactivated_at" TIMESTAMP(3),
ADD COLUMN     "deactivation_reason" TEXT;

-- CreateTable
CREATE TABLE "user_audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "target_user_id" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "reason" TEXT,
    "before_state" TEXT,
    "after_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
