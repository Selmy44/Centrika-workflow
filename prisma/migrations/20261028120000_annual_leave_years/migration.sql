-- Annual leave by leave year (employment anniversary to anniversary): earned, brought in, taken,
-- rejected, and what carried over or reset when the year closed. Written by the ledger.
CREATE TABLE "annual_leave_years" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "year_number" INTEGER NOT NULL,
    "starts_on" VARCHAR(10) NOT NULL,
    "ends_on" VARCHAR(10) NOT NULL,
    "earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carried_from_rejected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carried_from_waiting" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hr_adjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rejected_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carried_out" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "forfeited" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "annual_leave_years_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "annual_leave_years_user_id_year_number_key" ON "annual_leave_years"("user_id", "year_number");

ALTER TABLE "annual_leave_years" ADD CONSTRAINT "annual_leave_years_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
