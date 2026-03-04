-- Migration: Cleanup duplicate head_of_department entries and enforce one HOD per department
-- 1) Demote all but the earliest head_of_department in each department to role 'user'
-- 2) Add a unique index to ensure only one head_of_department per department

-- Demote duplicates, choosing the earliest created_at per department to keep
WITH hods AS (
  SELECT id,
         COALESCE(NULLIF(TRIM(department), ''), '__NO_DEPT__') AS dept_key,
         created_at,
         ROW_NUMBER() OVER (PARTITION BY COALESCE(NULLIF(TRIM(department), ''), '__NO_DEPT__') ORDER BY created_at ASC, id ASC) AS rn
  FROM users
  WHERE role = 'head_of_department'
)
UPDATE users u
SET role = 'user', updated_at = now()
FROM hods h
WHERE u.id = h.id AND h.rn > 1;

-- Create a unique index to prevent future duplicates. We coalesce empty/NULL departments
-- into a sentinel value so NULL departments count as the same group and don't allow multiple HODs.
-- Note: Postgres supports expression indexes; ensure this runs on the correct DB version.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'unique_hod_per_department'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX unique_hod_per_department ON users ((COALESCE(NULLIF(TRIM(department), ''''), ''__NO_DEPT__''))) WHERE role = ''head_of_department''';
  END IF;
END$$;
