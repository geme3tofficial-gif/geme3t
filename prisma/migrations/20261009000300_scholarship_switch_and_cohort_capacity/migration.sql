CREATE TABLE "application_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "scholarships_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_config_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "application_config_singleton_id_check" CHECK ("id" = 1)
);

INSERT INTO "application_config" ("id", "scholarships_enabled")
VALUES (1, true);

ALTER TABLE "cohorts"
ADD COLUMN "seat_limit" INTEGER;

ALTER TABLE "cohorts"
ADD CONSTRAINT "cohorts_seat_limit_positive_check"
CHECK ("seat_limit" IS NULL OR "seat_limit" > 0);
