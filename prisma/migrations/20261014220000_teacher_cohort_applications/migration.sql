-- CreateEnum
CREATE TYPE "TeacherCohortApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "teacher_cohort_applications" (
    "id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "status" "TeacherCohortApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "teacher_cohort_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_cohort_applications_cohort_id_teacher_id_key" ON "teacher_cohort_applications"("cohort_id", "teacher_id");

-- CreateIndex
CREATE INDEX "teacher_cohort_applications_status_applied_at_idx" ON "teacher_cohort_applications"("status", "applied_at");

-- CreateIndex
CREATE INDEX "teacher_cohort_applications_teacher_id_applied_at_idx" ON "teacher_cohort_applications"("teacher_id", "applied_at");

-- AddForeignKey
ALTER TABLE "teacher_cohort_applications" ADD CONSTRAINT "teacher_cohort_applications_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_cohort_applications" ADD CONSTRAINT "teacher_cohort_applications_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_cohort_applications" ADD CONSTRAINT "teacher_cohort_applications_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EnableRowLevelSecurity
ALTER TABLE "teacher_cohort_applications" ENABLE ROW LEVEL SECURITY;
