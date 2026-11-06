-- A short "about me" that staff write themselves (Settings > Profile), shown on their profile card.
-- Additive and nullable: no existing row changes.
ALTER TABLE "users" ADD COLUMN "bio" VARCHAR(500);
