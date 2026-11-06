-- Special leave: new leave types. Add-only, so every existing request keeps its type.
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'emergency';
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'authorized_absence';
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'remote';
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'circumstantial';
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'study';
