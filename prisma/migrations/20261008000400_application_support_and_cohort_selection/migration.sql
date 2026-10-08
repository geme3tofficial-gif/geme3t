CREATE TYPE "ApplicationSupportType" AS ENUM ('SELF_FUNDED', 'SCHOLARSHIP', 'SPECIALIZED_MENTORSHIP');

ALTER TABLE "scholarship_applications"
ADD COLUMN "support_type" "ApplicationSupportType" NOT NULL DEFAULT 'SELF_FUNDED',
ADD COLUMN "specialized_focus" TEXT,
ADD COLUMN "specialized_goal" TEXT,
ADD COLUMN "mentor_support" TEXT,
ADD COLUMN "cohort_id" UUID;

CREATE INDEX "scholarship_applications_cohort_id_idx"
ON "scholarship_applications"("cohort_id");

ALTER TABLE "scholarship_applications"
ADD CONSTRAINT "scholarship_applications_cohort_id_fkey"
FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
