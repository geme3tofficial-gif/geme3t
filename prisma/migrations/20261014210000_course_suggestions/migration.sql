-- CreateEnum
CREATE TYPE "CourseSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "course_suggestions" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "status" "CourseSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "suggested_by_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "course_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_suggestions_course_id_key" ON "course_suggestions"("course_id");

-- CreateIndex
CREATE INDEX "course_suggestions_status_created_at_idx" ON "course_suggestions"("status", "created_at");

-- CreateIndex
CREATE INDEX "course_suggestions_suggested_by_id_created_at_idx" ON "course_suggestions"("suggested_by_id", "created_at");

-- AddForeignKey
ALTER TABLE "course_suggestions" ADD CONSTRAINT "course_suggestions_suggested_by_id_fkey" FOREIGN KEY ("suggested_by_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_suggestions" ADD CONSTRAINT "course_suggestions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_suggestions" ADD CONSTRAINT "course_suggestions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EnableRowLevelSecurity
ALTER TABLE "course_suggestions" ENABLE ROW LEVEL SECURITY;
