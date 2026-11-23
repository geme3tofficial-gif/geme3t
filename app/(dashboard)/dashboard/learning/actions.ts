"use server";

import { EnrollmentStatus, LessonProgressStatus, SessionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLearnerSession } from "@/lib/learner-auth";
import { getPrismaClient } from "@/lib/prisma";

function readId(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

async function requireStudentId() {
  const session = await getLearnerSession();
  if (!session || session.profile?.role !== "STUDENT") {
    redirect("/dashboard/sign-in");
  }
  return session.user.id;
}

export async function completeLesson(formData: FormData) {
  const learnerId = await requireStudentId();
  const enrollmentId = readId(formData, "enrollmentId");
  const lessonId = readId(formData, "lessonId");
  if (!enrollmentId || !lessonId) {
    redirect("/dashboard/learning?notice=invalid-learning-action");
  }

  const db = getPrismaClient();
  const result = await db.$transaction(async (transaction) => {
    const enrollment = await transaction.enrollment.findFirst({
      where: {
        id: enrollmentId,
        learnerId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
        course: { status: "PUBLISHED" },
      },
      select: { id: true, courseId: true },
    });
    if (!enrollment) return false;
    const lesson = await transaction.lesson.findFirst({
      where: {
        id: lessonId,
        isPublished: true,
        module: { courseId: enrollment.courseId },
      },
      select: { id: true },
    });
    if (!lesson) return false;

    await transaction.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        status: LessonProgressStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      update: {
        status: LessonProgressStatus.COMPLETED,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    const [totalLessons, completedLessons] = await Promise.all([
      transaction.lesson.count({
        where: {
          isPublished: true,
          module: { courseId: enrollment.courseId },
        },
      }),
      transaction.lesson.count({
        where: {
          isPublished: true,
          module: { courseId: enrollment.courseId },
          progress: {
            some: {
              enrollmentId,
              status: LessonProgressStatus.COMPLETED,
            },
          },
        },
      }),
    ]);
    const courseCompleted =
      totalLessons > 0 && totalLessons === completedLessons;
    await transaction.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: courseCompleted
          ? EnrollmentStatus.COMPLETED
          : EnrollmentStatus.ACTIVE,
        completedAt: courseCompleted ? new Date() : null,
      },
    });
    return true;
  });

  if (!result) redirect("/dashboard/learning?notice=invalid-learning-action");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/learning");
  redirect("/dashboard/learning?notice=lesson-completed");
}

export async function markSessionAttendance(formData: FormData) {
  const learnerId = await requireStudentId();
  const enrollmentId = readId(formData, "enrollmentId");
  const sessionId = readId(formData, "sessionId");
  if (!enrollmentId || !sessionId) {
    redirect("/dashboard/learning?notice=invalid-attendance");
  }

  const now = new Date();
  const db = getPrismaClient();
  const marked = await db.$transaction(async (transaction) => {
    const enrollment = await transaction.enrollment.findFirst({
      where: {
        id: enrollmentId,
        learnerId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
      },
      select: { id: true, cohortId: true },
    });
    if (!enrollment?.cohortId) return false;

    const liveSession = await transaction.liveSession.findFirst({
      where: {
        id: sessionId,
        cohortId: enrollment.cohortId,
        status: SessionStatus.COMPLETED,
        endsAt: { lte: now },
      },
      select: { id: true },
    });
    if (!liveSession) return false;

    const existing = await transaction.attendanceRecord.findUnique({
      where: { sessionId_enrollmentId: { sessionId, enrollmentId } },
      select: { status: true },
    });
    if (existing && existing.status !== "PENDING") return false;
    await transaction.attendanceRecord.upsert({
      where: { sessionId_enrollmentId: { sessionId, enrollmentId } },
      create: { sessionId, enrollmentId },
      update: { markedAt: now },
    });
    return true;
  });

  if (!marked) redirect("/dashboard/learning?notice=attendance-not-available");
  revalidatePath("/dashboard/learning");
  redirect("/dashboard/learning?notice=attendance-marked");
}
