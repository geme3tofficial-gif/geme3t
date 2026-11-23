-- AlterTable
ALTER TABLE "cohorts"
ADD COLUMN "learning_mode" "LearningMode" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN "whatsapp_group_url" TEXT;

-- AlterTable
ALTER TABLE "live_sessions"
ADD COLUMN "module_id" UUID;

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'PRESENT', 'ABSENT');

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "marked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_at" TIMESTAMPTZ(6),
    "validated_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_course_action_logs" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "module_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_course_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_session_id_enrollment_id_key"
ON "attendance_records"("session_id", "enrollment_id");
CREATE INDEX "attendance_records_session_id_status_idx"
ON "attendance_records"("session_id", "status");
CREATE INDEX "attendance_records_enrollment_id_marked_at_idx"
ON "attendance_records"("enrollment_id", "marked_at");
CREATE INDEX "teacher_course_action_logs_course_id_created_at_idx"
ON "teacher_course_action_logs"("course_id", "created_at");
CREATE INDEX "teacher_course_action_logs_module_id_created_at_idx"
ON "teacher_course_action_logs"("module_id", "created_at");
CREATE INDEX "teacher_course_action_logs_teacher_id_created_at_idx"
ON "teacher_course_action_logs"("teacher_id", "created_at");

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_module_id_fkey"
FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_enrollment_id_fkey"
FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_validated_by_id_fkey"
FOREIGN KEY ("validated_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_course_action_logs" ADD CONSTRAINT "teacher_course_action_logs_teacher_id_fkey"
FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_course_action_logs" ADD CONSTRAINT "teacher_course_action_logs_course_id_fkey"
FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_course_action_logs" ADD CONSTRAINT "teacher_course_action_logs_module_id_fkey"
FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EnableRowLevelSecurity
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teacher_course_action_logs" ENABLE ROW LEVEL SECURITY;
