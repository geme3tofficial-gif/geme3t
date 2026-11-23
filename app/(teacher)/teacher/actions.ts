"use server";

import {
  AttendanceStatus,
  SessionStatus,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCourseEditor } from "@/lib/course-editor-auth";
import { getPrismaClient } from "@/lib/prisma";

function readText(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function readOptionalText(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= maxLength ? trimmed : undefined;
}

function isHttpUrl(value: string) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readUtcDateTime(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}:00Z`);
  if (!Number.isFinite(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== Number(value.slice(0, 4)) ||
    date.getUTCMonth() + 1 !== Number(value.slice(5, 7)) ||
    date.getUTCDate() !== Number(value.slice(8, 10)) ||
    date.getUTCHours() !== Number(value.slice(11, 13)) ||
    date.getUTCMinutes() !== Number(value.slice(14, 16))
  ) {
    return null;
  }
  return date;
}

export async function saveTeacherCourseSession(formData: FormData) {
  const editor = await requireCourseEditor();
  if (editor.role !== UserRole.TEACHER) redirect("/teacher/courses");

  const courseId = readText(formData, "courseId", 36);
  const cohortId = readText(formData, "cohortId", 36);
  const sessionId = readText(formData, "sessionId", 36);
  const moduleId = readOptionalText(formData, "moduleId", 36);
  const title = readText(formData, "title", 160);
  const description = readOptionalText(formData, "description", 2000);
  const startsAt = readUtcDateTime(formData, "startsAt");
  const endsAt = readUtcDateTime(formData, "endsAt");
  const location = readOptionalText(formData, "location", 200);
  const meetingUrl = readOptionalText(formData, "meetingUrl", 500);
  if (
    !courseId ||
    !isUuid(courseId) ||
    !cohortId ||
    !isUuid(cohortId) ||
    (formData.has("sessionId") && (!sessionId || !isUuid(sessionId))) ||
    (moduleId !== null && (!moduleId || !isUuid(moduleId))) ||
    !title ||
    description === undefined ||
    !startsAt ||
    !endsAt ||
    endsAt <= startsAt ||
    (!sessionId && startsAt <= new Date()) ||
    location === undefined ||
    meetingUrl === undefined ||
    (meetingUrl !== null && !isHttpUrl(meetingUrl))
  ) {
    redirect(`/teacher/courses/${courseId || ""}?notice=invalid-session`);
  }

  const db = getPrismaClient();
  const cohort = await db.cohort.findFirst({
    where: {
      id: cohortId,
      courseId,
      teachers: { some: { teacherId: editor.userId } },
    },
    select: { id: true },
  });
  if (!cohort) redirect(`/teacher/courses/${courseId}?notice=course-not-assigned`);

  if (moduleId) {
    const courseModule = await db.courseModule.findFirst({
      where: { id: moduleId, courseId },
      select: { id: true },
    });
    if (!courseModule) redirect(`/teacher/courses/${courseId}?notice=invalid-session`);
  }

  const existing = sessionId
    ? await db.liveSession.findFirst({
        where: { id: sessionId, cohortId },
        select: { id: true, teacherId: true, status: true },
      })
    : null;
  if (
    sessionId &&
    (!existing ||
      (existing.teacherId !== null && existing.teacherId !== editor.userId) ||
      existing.status !== SessionStatus.SCHEDULED)
  ) {
    redirect(`/teacher/courses/${courseId}?notice=session-not-editable`);
  }

  await db.$transaction(async (transaction) => {
    const saved = existing
      ? await transaction.liveSession.update({
          where: { id: existing.id },
          data: {
            teacherId: editor.userId,
            moduleId,
            title,
            description,
            startsAt,
            endsAt,
            location,
            meetingUrl,
          },
          select: { id: true },
        })
      : await transaction.liveSession.create({
          data: {
            cohortId,
            moduleId,
            teacherId: editor.userId,
            title,
            description,
            startsAt,
            endsAt,
            location,
            meetingUrl,
          },
          select: { id: true },
        });
    await transaction.teacherCourseActionLog.create({
      data: {
        teacherId: editor.userId,
        courseId,
        moduleId,
        action: existing ? "UPDATE_SESSION" : "CREATE_SESSION",
        entityType: "LIVE_SESSION",
        entityId: saved.id,
        details: { title, cohortId, startsAt: startsAt.toISOString() },
      },
    });
  });

  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath("/teacher");
  revalidatePath("/dashboard/learning");
  revalidatePath("/admin/sessions");
  redirect(`/teacher/courses/${courseId}?notice=session-saved`);
}

export async function startTeacherClassSession(formData: FormData) {
  const editor = await requireCourseEditor();
  if (editor.role !== UserRole.TEACHER) redirect("/teacher/classes");

  const cohortId = readText(formData, "cohortId", 36);
  const title = readText(formData, "title", 160);
  const moduleId = readOptionalText(formData, "moduleId", 36);
  const location = readOptionalText(formData, "location", 200);
  const meetingUrl = readOptionalText(formData, "meetingUrl", 500);
  const durationValue = formData.get("durationMinutes");
  const durationMinutes =
    typeof durationValue === "string" ? Number(durationValue) : NaN;
  if (
    !cohortId ||
    !isUuid(cohortId) ||
    !title ||
    (moduleId !== null && (!moduleId || !isUuid(moduleId))) ||
    location === undefined ||
    meetingUrl === undefined ||
    (meetingUrl !== null && !isHttpUrl(meetingUrl)) ||
    ![30, 60, 90, 120].includes(durationMinutes)
  ) {
    redirect("/teacher/classes?notice=invalid-session");
  }

  const db = getPrismaClient();
  const cohort = await db.cohort.findFirst({
    where: {
      id: cohortId,
      teachers: { some: { teacherId: editor.userId } },
    },
    select: {
      id: true,
      courseId: true,
    },
  });
  if (!cohort) redirect("/teacher/classes?notice=invalid-session");

  if (moduleId) {
    const courseModule = await db.courseModule.findFirst({
      where: { id: moduleId, courseId: cohort.courseId },
      select: { id: true },
    });
    if (!courseModule) redirect("/teacher/classes?notice=invalid-session");
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const overlappingSession = await db.liveSession.findFirst({
    where: {
      cohortId,
      status: SessionStatus.SCHEDULED,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });
  if (overlappingSession) {
    redirect("/teacher/classes?notice=session-already-active");
  }

  await db.$transaction(async (transaction) => {
    const session = await transaction.liveSession.create({
      data: {
        cohortId,
        moduleId,
        teacherId: editor.userId,
        title,
        location,
        meetingUrl,
        startsAt,
        endsAt,
      },
      select: { id: true },
    });
    await transaction.teacherCourseActionLog.create({
      data: {
        teacherId: editor.userId,
        courseId: cohort.courseId,
        moduleId,
        action: "CREATE_SESSION",
        entityType: "LIVE_SESSION",
        entityId: session.id,
        details: {
          title,
          cohortId,
          startsAt: startsAt.toISOString(),
          durationMinutes,
          manuallyStarted: true,
        },
      },
    });
  });

  revalidatePath("/teacher/classes");
  revalidatePath(`/teacher/courses/${cohort.courseId}`);
  revalidatePath("/teacher/schedule");
  revalidatePath("/dashboard/learning");
  revalidatePath("/admin/sessions");
  redirect("/teacher/classes?notice=session-started");
}

export async function completeTeacherCourseSession(formData: FormData) {
  const editor = await requireCourseEditor();
  if (editor.role !== UserRole.TEACHER) redirect("/teacher/courses");

  const sessionId = readText(formData, "sessionId", 36);
  const courseId = readText(formData, "courseId", 36);
  if (
    !sessionId ||
    !isUuid(sessionId) ||
    !courseId ||
    !isUuid(courseId)
  ) {
    redirect("/teacher/courses?notice=invalid-session");
  }

  const db = getPrismaClient();
  const liveSession = await db.liveSession.findFirst({
    where: {
      id: sessionId,
      cohort: {
        courseId,
        teachers: { some: { teacherId: editor.userId } },
      },
    },
    select: {
      id: true,
      cohortId: true,
      moduleId: true,
      startsAt: true,
      endsAt: true,
      status: true,
    },
  });
  if (
    !liveSession ||
    liveSession.status !== SessionStatus.SCHEDULED ||
    liveSession.startsAt > new Date() ||
    liveSession.endsAt > new Date()
  ) {
    redirect(`/teacher/courses/${courseId}?notice=session-not-completable`);
  }

  const completed = await db.$transaction(async (transaction) => {
    const updated = await transaction.liveSession.updateMany({
      where: {
        id: liveSession.id,
        status: SessionStatus.SCHEDULED,
        endsAt: { lte: new Date() },
      },
      data: { status: SessionStatus.COMPLETED },
    });
    if (updated.count === 0) return false;

    await transaction.teacherCourseActionLog.create({
      data: {
        teacherId: editor.userId,
        courseId,
        moduleId: liveSession.moduleId,
        action: "COMPLETE_SESSION",
        entityType: "LIVE_SESSION",
        entityId: liveSession.id,
        details: { cohortId: liveSession.cohortId },
      },
    });
    return true;
  });
  if (!completed) {
    redirect(`/teacher/courses/${courseId}?notice=session-not-completable`);
  }

  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath("/dashboard/learning");
  revalidatePath("/admin/sessions");
  redirect(`/teacher/courses/${courseId}?notice=session-completed`);
}

export async function validateAttendance(formData: FormData) {
  const editor = await requireCourseEditor();
  const returnToClasses =
    editor.role === UserRole.TEACHER &&
    formData.get("returnTo") === "teacher-classes";
  const attendanceId = readText(formData, "attendanceId", 36);
  const decision = formData.get("decision");
  if (
    !attendanceId ||
    !isUuid(attendanceId) ||
    (decision !== AttendanceStatus.PRESENT &&
      decision !== AttendanceStatus.ABSENT)
  ) {
    redirect(
      editor.role === UserRole.ADMIN
        ? "/admin/sessions?notice=invalid-attendance"
        : returnToClasses
          ? "/teacher/classes?notice=invalid-attendance"
          : "/teacher/courses?notice=invalid-attendance",
    );
  }

  const db = getPrismaClient();
  const record = await db.attendanceRecord.findUnique({
    where: { id: attendanceId },
    select: {
      id: true,
      status: true,
      session: {
        select: {
          id: true,
          endsAt: true,
          status: true,
          cohortId: true,
          cohort: { select: { courseId: true } },
        },
      },
    },
  });
  if (
    !record ||
    record.status !== AttendanceStatus.PENDING ||
    record.session.status !== SessionStatus.COMPLETED ||
    record.session.endsAt > new Date()
  ) {
    redirect(
      editor.role === UserRole.ADMIN
        ? "/admin/sessions?notice=attendance-not-ready"
        : returnToClasses
          ? "/teacher/classes?notice=attendance-not-ready"
          : "/teacher/courses?notice=attendance-not-ready",
    );
  }
  if (editor.role === UserRole.TEACHER) {
    const assignment = await db.cohortTeachingAssignment.findUnique({
      where: {
        cohortId_teacherId: {
          cohortId: record.session.cohortId,
          teacherId: editor.userId,
        },
      },
      select: { cohortId: true },
    });
    if (!assignment) {
      redirect(
        `/teacher/courses/${record.session.cohort.courseId}?notice=attendance-not-ready`,
      );
    }
  }

  const updated = await db.attendanceRecord.updateMany({
    where: { id: attendanceId, status: AttendanceStatus.PENDING },
    data: {
      status: decision,
      validatedById: editor.userId,
      validatedAt: new Date(),
    },
  });
  if (updated.count === 0) {
    redirect(
      editor.role === UserRole.ADMIN
        ? "/admin/sessions?notice=attendance-already-validated"
        : returnToClasses
          ? "/teacher/classes?notice=attendance-already-validated"
          : `/teacher/courses/${record.session.cohort.courseId}?notice=attendance-already-validated`,
    );
  }

  revalidatePath("/admin/sessions");
  revalidatePath("/teacher/courses");
  revalidatePath(`/teacher/courses/${record.session.cohort.courseId}`);
  revalidatePath("/teacher/classes");
  revalidatePath("/dashboard/learning");
  redirect(
    editor.role === UserRole.ADMIN
      ? "/admin/sessions?notice=attendance-validated"
      : returnToClasses
        ? "/teacher/classes?notice=attendance-validated"
        : `/teacher/courses/${record.session.cohort.courseId}?notice=attendance-validated`,
  );
}

export async function markCohortStudentAttendance(formData: FormData) {
  const editor = await requireCourseEditor();
  if (editor.role !== UserRole.TEACHER) redirect("/teacher/courses");

  const sessionId = readText(formData, "sessionId", 36);
  const enrollmentId = readText(formData, "enrollmentId", 36);
  const decision = formData.get("decision");
  if (
    !sessionId ||
    !isUuid(sessionId) ||
    !enrollmentId ||
    !isUuid(enrollmentId) ||
    (decision !== AttendanceStatus.PRESENT &&
      decision !== AttendanceStatus.ABSENT)
  ) {
    redirect("/teacher/courses?notice=invalid-attendance");
  }

  const db = getPrismaClient();
  const liveSession = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      cohortId: true,
      moduleId: true,
      endsAt: true,
      status: true,
      cohort: { select: { courseId: true } },
    },
  });
  if (
    !liveSession ||
    liveSession.status !== SessionStatus.COMPLETED ||
    liveSession.endsAt > new Date()
  ) {
    redirect("/teacher/courses?notice=attendance-not-ready");
  }

  const [assignment, enrollment] = await Promise.all([
    db.cohortTeachingAssignment.findUnique({
      where: {
        cohortId_teacherId: {
          cohortId: liveSession.cohortId,
          teacherId: editor.userId,
        },
      },
      select: { cohortId: true },
    }),
    db.enrollment.findFirst({
      where: {
        id: enrollmentId,
        cohortId: liveSession.cohortId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      select: { id: true },
    }),
  ]);
  if (!assignment || !enrollment) {
    redirect(
      `/teacher/courses/${liveSession.cohort.courseId}?notice=attendance-not-ready`,
    );
  }

  const now = new Date();
  await db.$transaction(async (transaction) => {
    const record = await transaction.attendanceRecord.upsert({
      where: {
        sessionId_enrollmentId: { sessionId, enrollmentId },
      },
      create: {
        sessionId,
        enrollmentId,
        status: decision,
        markedAt: now,
        validatedAt: now,
        validatedById: editor.userId,
      },
      update: {
        status: decision,
        markedAt: now,
        validatedAt: now,
        validatedById: editor.userId,
      },
      select: { id: true },
    });
    await transaction.teacherCourseActionLog.create({
      data: {
        teacherId: editor.userId,
        courseId: liveSession.cohort.courseId,
        moduleId: liveSession.moduleId,
        action: "MARK_ATTENDANCE",
        entityType: "ATTENDANCE_RECORD",
        entityId: record.id,
        details: { sessionId, enrollmentId, status: decision },
      },
    });
  });

  revalidatePath(`/teacher/courses/${liveSession.cohort.courseId}`);
  revalidatePath("/dashboard/learning");
  revalidatePath("/admin/sessions");
  redirect(
    `/teacher/courses/${liveSession.cohort.courseId}?notice=attendance-marked`,
  );
}
