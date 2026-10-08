-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScholarshipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "LearningMode" AS ENUM ('ONLINE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('PLANNED', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LessonKind" AS ENUM ('VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'LIVE');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "duration_weeks" INTEGER NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sponsor" TEXT,
    "description" TEXT,
    "tuition_percent" INTEGER,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "ScholarshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_applications" (
    "id" UUID NOT NULL,
    "applicant_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "other_country" TEXT,
    "location" TEXT NOT NULL,
    "employment_status" TEXT NOT NULL,
    "education_level" TEXT NOT NULL,
    "scholarship_interest" BOOLEAN NOT NULL,
    "scholarship_id" UUID,
    "scholarship_name" TEXT,
    "course_id" UUID,
    "course_name" TEXT NOT NULL,
    "learning_mode" "LearningMode" NOT NULL,
    "preferred_start_date" DATE,
    "tech_experience" TEXT NOT NULL,
    "job_placement_support" BOOLEAN NOT NULL,
    "terms_accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scholarship_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "status" "CohortStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_teaching_assignments" (
    "cohort_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_teaching_assignments_pkey" PRIMARY KEY ("cohort_id","teacher_id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "cohort_id" UUID,
    "application_id" UUID,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "LessonKind" NOT NULL DEFAULT 'ARTICLE',
    "content_url" TEXT,
    "duration_minutes" INTEGER,
    "sort_order" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "teacher_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "meeting_url" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_campaigns" (
    "id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "course_id" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_percent" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "redemption_limit" INTEGER,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promo_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_redemptions" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "learner_id" UUID,
    "email" TEXT,
    "redeemed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_category_idx" ON "courses"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "scholarships_name_key" ON "scholarships"("name");

-- CreateIndex
CREATE INDEX "scholarship_applications_status_submitted_at_idx" ON "scholarship_applications"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "scholarship_applications_email_idx" ON "scholarship_applications"("email");

-- CreateIndex
CREATE INDEX "cohorts_status_starts_at_idx" ON "cohorts"("status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_course_id_name_key" ON "cohorts"("course_id", "name");

-- CreateIndex
CREATE INDEX "cohort_teaching_assignments_teacher_id_idx" ON "cohort_teaching_assignments"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_application_id_key" ON "enrollments"("application_id");

-- CreateIndex
CREATE INDEX "enrollments_learner_id_status_idx" ON "enrollments"("learner_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_cohort_id_status_idx" ON "enrollments"("cohort_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_course_id_sort_order_key" ON "course_modules"("course_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_module_id_sort_order_key" ON "lessons"("module_id", "sort_order");

-- CreateIndex
CREATE INDEX "lesson_progress_enrollment_id_status_idx" ON "lesson_progress"("enrollment_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollment_id_lesson_id_key" ON "lesson_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE INDEX "live_sessions_cohort_id_starts_at_idx" ON "live_sessions"("cohort_id", "starts_at");

-- CreateIndex
CREATE INDEX "live_sessions_teacher_id_starts_at_idx" ON "live_sessions"("teacher_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "promo_campaigns_code_key" ON "promo_campaigns"("code");

-- CreateIndex
CREATE INDEX "promo_campaigns_status_starts_at_ends_at_idx" ON "promo_campaigns"("status", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "promo_redemptions_campaign_id_redeemed_at_idx" ON "promo_redemptions"("campaign_id", "redeemed_at");

-- CreateIndex
CREATE UNIQUE INDEX "promo_redemptions_campaign_id_learner_id_key" ON "promo_redemptions"("campaign_id", "learner_id");

-- AddForeignKey
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_applications" ADD CONSTRAINT "scholarship_applications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_teaching_assignments" ADD CONSTRAINT "cohort_teaching_assignments_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_teaching_assignments" ADD CONSTRAINT "cohort_teaching_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "scholarship_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_campaigns" ADD CONSTRAINT "promo_campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_campaigns" ADD CONSTRAINT "promo_campaigns_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "promo_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scholarships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scholarship_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cohorts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cohort_teaching_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "live_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promo_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promo_redemptions" ENABLE ROW LEVEL SECURITY;
