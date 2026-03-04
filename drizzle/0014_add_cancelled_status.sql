-- Add 'cancelled' to approval_status enum
ALTER TYPE approval_status ADD VALUE 'cancelled' AFTER 'rejected';
