-- Attendance (clock in/out, breaks) and short leave. Add-only: new tables and types, nothing existing changes.

-- CreateEnum
CREATE TYPE "AttendanceEventKind" AS ENUM ('tea_break', 'lunch_break', 'personal_break', 'short_leave');

-- CreateEnum
CREATE TYPE "ShortLeaveStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'short_leave_requested';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'short_leave_decided';

-- CreateTable
CREATE TABLE "attendance_days" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "clock_in" TIMESTAMP(3) NOT NULL,
    "clock_out" TIMESTAMP(3),
    "auto_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_events" (
    "id" SERIAL NOT NULL,
    "day_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kind" "AttendanceEventKind" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "short_leave_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_leaves" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ShortLeaveStatus" NOT NULL DEFAULT 'pending',
    "approver_id" INTEGER,
    "decided_at" TIMESTAMP(3),
    "decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_days_date_idx" ON "attendance_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_days_user_id_date_key" ON "attendance_days"("user_id", "date");

-- CreateIndex
CREATE INDEX "attendance_events_day_id_idx" ON "attendance_events"("day_id");

-- CreateIndex
CREATE INDEX "short_leaves_user_id_date_idx" ON "short_leaves"("user_id", "date");

-- CreateIndex
CREATE INDEX "short_leaves_approver_id_status_idx" ON "short_leaves"("approver_id", "status");

-- AddForeignKey
ALTER TABLE "attendance_days" ADD CONSTRAINT "attendance_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "attendance_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_short_leave_id_fkey" FOREIGN KEY ("short_leave_id") REFERENCES "short_leaves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_leaves" ADD CONSTRAINT "short_leaves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_leaves" ADD CONSTRAINT "short_leaves_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

