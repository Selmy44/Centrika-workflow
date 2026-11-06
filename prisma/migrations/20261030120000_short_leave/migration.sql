-- Short leave: a few hours away during the working day, requested and approved like other leave.
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'short_leave';

ALTER TABLE "leave_requests"
  ADD COLUMN "start_time" VARCHAR(5),
  ADD COLUMN "end_time" VARCHAR(5),
  ADD COLUMN "hours_requested" DOUBLE PRECISION;
