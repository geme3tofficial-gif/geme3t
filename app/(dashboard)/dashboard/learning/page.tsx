import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AttendanceStatus,
  CourseStatus,
  EnrollmentStatus,
  LessonProgressStatus,
  SessionStatus,
} from "@prisma/client";
import { getLearnerSession } from "@/lib/learner-auth";
import { getPrismaClient } from "@/lib/prisma";
import { completeLesson, markSessionAttendance } from "./actions";

export const metadata: Metadata = {
  title: "My learning",
};

const notices: Record<string, string> = {
  "lesson-completed": "Your lesson progress has been saved.",
  "attendance-marked": "Your attendance was submitted for teacher validation.",
  "attendance-not-available":
    "Attendance can only be submitted for a completed session in your active cohort.",
  "invalid-attendance": "The attendance submission was invalid.",
  "invalid-learning-action": "The learning update could not be completed.",
};

function formatDate(date: Date, withTime = false) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "UTC",
  }).format(date) + (withTime ? " UTC" : "");
}

export default async function StudentLearningPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await connection();
  const session = await getLearnerSession();
  if (!session) redirect("/dashboard/sign-in");
  if (session.profile?.role === "ADMIN") redirect("/admin");
  if (session.profile?.role === "TEACHER") redirect("/teacher");

  const application = session.profile?.applications[0];
  if (!application) redirect("/dashboard/sign-in?error=application-required");
  if (application.completionRequiredFields.length > 0) redirect("/dashboard");

  const db = getPrismaClient();
  const learnerApplications = await db.scholarshipApplication.findMany({
    where: {
      applicantId: session.user.id,
      status: { notIn: ["REJECTED", "WITHDRAWN"] },
      courseId: { not: null },
      completionRequiredFields: { isEmpty: true },
      course: { status: CourseStatus.PUBLISHED },
    },
    select: { id: true, courseId: true, cohortId: true },
  });
  for (const learnerApplication of learnerApplications) {
    if (!learnerApplication.courseId) continue;
    const existingEnrollment = await db.enrollment.findUnique({
      where: { applicationId: learnerApplication.id },
      select: { id: true, status: true },
    });
    if (!existingEnrollment) {
      await db.enrollment.create({
        data: {
          learnerId: session.user.id,
          courseId: learnerApplication.courseId,
          cohortId: learnerApplication.cohortId,
          applicationId: learnerApplication.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    } else if (existingEnrollment.status === EnrollmentStatus.PENDING) {
      await db.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: EnrollmentStatus.ACTIVE },
      });
    }
  }

  const [enrollments, query] = await Promise.all([
    db.enrollment.findMany({
      where: {
        learnerId: session.user.id,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
        course: { status: CourseStatus.PUBLISHED },
      },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
        lessonProgress: {
          where: {
            status: LessonProgressStatus.COMPLETED,
            lesson: { isPublished: true },
          },
          select: { lessonId: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            modules: {
              where: { lessons: { some: { isPublished: true } } },
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                title: true,
                lessons: {
                  where: { isPublished: true },
                  orderBy: { sortOrder: "asc" },
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
        cohort: {
          select: {
            id: true,
            name: true,
            startsAt: true,
            endsAt: true,
            durationWeeks: true,
            status: true,
            learningMode: true,
            whatsappGroupUrl: true,
            teachers: {
              orderBy: { assignedAt: "asc" },
              select: {
                teacher: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            sessions: {
              orderBy: { startsAt: "asc" },
              select: {
                id: true,
                title: true,
                startsAt: true,
                endsAt: true,
                location: true,
                meetingUrl: true,
                status: true,
                module: { select: { title: true } },
                teacher: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),
    searchParams,
  ]);
  const attendanceRows = enrollments.length
    ? await db.attendanceRecord.findMany({
        where: { enrollmentId: { in: enrollments.map(({ id }) => id) } },
        select: { sessionId: true, enrollmentId: true, status: true },
      })
    : [];
  const attendanceByKey = new Map(
    attendanceRows.map((record) => [
      `${record.enrollmentId}:${record.sessionId}`,
      record.status,
    ]),
  );
  const now = new Date();

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Learner workspace</span>
          <h1>My learning</h1>
          <p>Continue your enrolled courses and follow your cohort’s progress.</p>
        </div>
        <Link className="button button--small" href="/dashboard/courses">
          Browse courses
        </Link>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}

      {enrollments.length === 0 ? (
        <section className="dashboard-panel">
          <h2>No active learning yet</h2>
          <p className="campaign-empty">
            Your learning space will show courses after your enrollment is
            approved. The published course catalogue is available to browse.
          </p>
          <Link className="text-link" href="/dashboard/courses">
            Browse published courses
          </Link>
        </section>
      ) : (
        enrollments.map((enrollment) => {
          const completedIds = new Set(
            enrollment.lessonProgress.map(({ lessonId }) => lessonId),
          );
          const allLessons = enrollment.course.modules.flatMap(
            (courseModule) => courseModule.lessons,
          );
          const coursePercent = allLessons.length
            ? Math.round((completedIds.size / allLessons.length) * 100)
            : 0;
          const activeModule = enrollment.course.modules.find((courseModule) =>
            courseModule.lessons.some((lesson) => !completedIds.has(lesson.id)),
          );
          const activeSession = enrollment.cohort?.sessions.find(
            (liveSession) =>
              liveSession.status === SessionStatus.SCHEDULED &&
              liveSession.startsAt <= now &&
              liveSession.endsAt >= now,
          ) ?? enrollment.cohort?.sessions.find(
            (liveSession) =>
              liveSession.status === SessionStatus.SCHEDULED &&
              liveSession.startsAt > now,
          ) ?? [...(enrollment.cohort?.sessions ?? [])]
            .reverse()
            .find((liveSession) => liveSession.status === SessionStatus.COMPLETED);

          return (
            <article className="dashboard-panel learner-learning-card" key={enrollment.id}>
              <header className="learner-learning-heading">
                <div className="dashboard-course-thumb">
                  <Image
                    alt=""
                    fill
                    sizes="64px"
                    src={enrollment.course.imageUrl || "/images/HERO-PIC.png"}
                  />
                </div>
                <div>
                  <span className="eyebrow">Enrolled course</span>
                  <h2>{enrollment.course.title}</h2>
                  <p>
                    {enrollment.cohort
                      ? `${enrollment.cohort.name} · started ${formatDate(enrollment.cohort.startsAt)}`
                      : `Enrolled ${formatDate(enrollment.enrolledAt)}`}
                  </p>
                </div>
                <strong className="progress-value">{coursePercent}%</strong>
              </header>
              <div aria-label={`${coursePercent}% course progress`} className="progress-track">
                <span style={{ width: `${coursePercent}%` }} />
              </div>

              <section className="learner-cohort-summary">
                <h3>Your cohort</h3>
                {enrollment.cohort ? (
                  <>
                    <dl>
                      <div><dt>Started</dt><dd>{formatDate(enrollment.cohort.startsAt)}</dd></div>
                      <div><dt>Duration</dt><dd>{enrollment.cohort.durationWeeks} weeks</dd></div>
                      <div><dt>Format</dt><dd>{enrollment.cohort.learningMode.toLowerCase()}</dd></div>
                      <div><dt>Current module</dt><dd>{activeModule?.title ?? "All modules complete"}</dd></div>
                      <div><dt>Current session</dt><dd>{activeSession?.title ?? "No sessions scheduled"}</dd></div>
                      <div>
                        <dt>Session teacher</dt>
                        <dd>
                          {activeSession?.teacher
                            ? `${activeSession.teacher.firstName} ${activeSession.teacher.lastName}`.trim()
                            : "Not assigned"}
                        </dd>
                      </div>
                    </dl>
                    {enrollment.cohort.teachers.length > 0 && (
                      <p className="learner-cohort-teachers">
                        Cohort teachers: {enrollment.cohort.teachers.map(
                          ({ teacher }) =>
                            `${teacher.firstName} ${teacher.lastName}`.trim(),
                        ).join(", ")}
                      </p>
                    )}
                    {enrollment.cohort.whatsappGroupUrl && (
                      <a
                        className="button button--small"
                        href={enrollment.cohort.whatsappGroupUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Join WhatsApp community
                      </a>
                    )}
                  </>
                ) : (
                  <p className="campaign-empty">
                    No cohort has been assigned to this enrollment yet.
                  </p>
                )}
              </section>

              <section className="learner-module-list">
                <h3>Course progress</h3>
                {enrollment.course.modules.map((courseModule, index) => {
                  const moduleComplete = courseModule.lessons.filter((lesson) =>
                    completedIds.has(lesson.id),
                  ).length;
                  return (
                    <div className="learner-module" key={courseModule.id}>
                      <div className="learner-module-heading">
                        <strong>Module {index + 1}: {courseModule.title}</strong>
                        <span>
                          {moduleComplete}/{courseModule.lessons.length} lessons
                        </span>
                      </div>
                      <ul>
                        {courseModule.lessons.map((lesson) => {
                          const isComplete = completedIds.has(lesson.id);
                          return (
                            <li key={lesson.id}>
                              <Link
                                href={`/dashboard/learning/${enrollment.id}/${lesson.id}`}
                              >
                                {lesson.title}
                              </Link>
                              <div className="learner-lesson-actions">
                                {isComplete ? (
                                  <span className="workspace-status-pill is-approved">Completed</span>
                                ) : (
                                  <form action={completeLesson}>
                                    <input
                                      name="enrollmentId"
                                      type="hidden"
                                      value={enrollment.id}
                                    />
                                    <input name="lessonId" type="hidden" value={lesson.id} />
                                    <button className="text-link" type="submit">
                                      Mark complete
                                    </button>
                                  </form>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </section>

              {enrollment.cohort && enrollment.cohort.sessions.length > 0 && (
                <section className="learner-attendance-list">
                  <h3>Sessions and attendance</h3>
                  {enrollment.cohort.sessions.map((liveSession) => {
                    const attendanceStatus = attendanceByKey.get(
                      `${enrollment.id}:${liveSession.id}`,
                    );
                    const canMark =
                      liveSession.status === SessionStatus.COMPLETED &&
                      liveSession.endsAt <= now &&
                      (!attendanceStatus ||
                        attendanceStatus === AttendanceStatus.PENDING);
                    return (
                      <div className="learner-session-row" key={liveSession.id}>
                        <div>
                          <strong>{liveSession.title}</strong>
                          <span>
                            {formatDate(liveSession.startsAt, true)}
                            {liveSession.module ? ` · ${liveSession.module.title}` : ""}
                            {liveSession.teacher
                              ? ` · ${liveSession.teacher.firstName} ${liveSession.teacher.lastName}`
                              : ""}
                          </span>
                        </div>
                        {attendanceStatus ? (
                          <span className={`workspace-status-pill is-${attendanceStatus.toLowerCase()}`}>
                            {attendanceStatus === AttendanceStatus.PENDING
                              ? "Awaiting teacher check"
                              : attendanceStatus.toLowerCase()}
                          </span>
                        ) : canMark ? (
                          <form action={markSessionAttendance}>
                            <input
                              name="enrollmentId"
                              type="hidden"
                              value={enrollment.id}
                            />
                            <input name="sessionId" type="hidden" value={liveSession.id} />
                            <button className="button button--small" type="submit">
                              Mark attendance
                            </button>
                          </form>
                        ) : (
                          <span className="workspace-status-pill">
                            {liveSession.status === SessionStatus.CANCELLED
                              ? "Cancelled"
                              : liveSession.status === SessionStatus.COMPLETED
                                ? "Not marked"
                                : "Upcoming"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </section>
              )}
            </article>
          );
        })
      )}
    </>
  );
}
