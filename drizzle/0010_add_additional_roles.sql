-- Add support for users with multiple roles
-- e.g., Doreen (HR head + Admin department head)
-- e.g., Patrick (Finance head + Expenditure approval)
ALTER TABLE "users" ADD COLUMN "additional_roles" text;
