-- Migration: Add backup and coverage information fields to leave requests
-- This tracks who covers the employee's work during leave and how to contact them

ALTER TABLE leave_requests
  ADD COLUMN backup_person_name VARCHAR(255),
  ADD COLUMN backup_person_phone VARCHAR(20);

-- Create index for backup person lookups
CREATE INDEX idx_leave_requests_backup_person ON leave_requests(backup_person_name);

-- Add comment to explain the fields
COMMENT ON COLUMN leave_requests.backup_person_name IS 'Name of the person covering the employee''s work during leave';
COMMENT ON COLUMN leave_requests.backup_person_phone IS 'Phone number of the backup person for contact during leave';
