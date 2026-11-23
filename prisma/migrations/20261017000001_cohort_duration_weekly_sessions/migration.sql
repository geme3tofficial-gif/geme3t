ALTER TABLE "cohorts"
ADD COLUMN "duration_weeks" INTEGER NOT NULL DEFAULT 12;

UPDATE "cohorts"
SET "duration_weeks" = GREATEST(
    1,
    LEAST(
        100,
        CEIL(EXTRACT(EPOCH FROM ("ends_at" - "starts_at")) / 604800)::INTEGER
    )
)
WHERE "ends_at" IS NOT NULL;
