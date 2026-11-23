import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { CourseEditorForm } from "@/app/(admin)/admin/courses/course-editor-form";
import {
  completeTeacherCourseSession,
  markCohortStudentAttendance,
  saveTeacherCourseSession,
} from "@/app/(teacher)/teacher/actions";
import {
  requireCourseEditorForCourse,
} from "@/lib/course-editor-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit course content",
};

const notices: Record<string, string> = {
  "session-saved": "Training session saved.",
  "invalid-session": "Check the session details, dates, and selected module.",
  "session-not-editable": "Only your scheduled sessions can be edited.",
  "session-completed": "Session marked complete. Students can now submit attendance for teacher review.",
  "session-not-completable": "Only an assigned teacher can complete a scheduled session after its end time.",
  "attendance-validated": "Attendance has been validated.",
  "attendance-marked": "Student attendance has been recorded.",
  "invalid-attendance": "The attendance update was invalid.",
  "attendance-already-validated": "That attendance record has already been reviewed.",
  "attendance-not-ready": "Attendance can only be reviewed after a completed session.",
};

function dateTimeValue(value: Date) {
  return value.toISOString().slice(0, 16);
}

export default async function TeacherCourseEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseid: string }>;
  searchParams: Promise<{ moduleNotice?: string; notice?: string }>;
}) {
  const [{ courseid }, query] = await Promise.all([params, searchParams]);
  const editor = await requireCourseEditorForCourse(courseid);
  const db = getPrismaClient();
  const [course, cohorts, actionLogs] = await Promise.all([
    db.course.findUnique({
      where: { id: courseid },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        description: true,
        imageUrl: true,
        durationWeeks: true,
        freeBootcampEnabled: true,
        status: true,
        modules: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            sortOrder: true,
            accessTypes: true,
            lessons: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                title: true,
                sortOrder: true,
                isPublished: true,
                contentItems: {
                  orderBy: { sortOrder: "asc" },
                  select: {
                    id: true,
                    kind: true,
                    title: true,
                    body: true,
                    url: true,
                    fileName: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.cohort.findMany({
      where: {
        courseId: courseid,
        ...(editor.role === UserRole.TEACHER
          ? { teachers: { some: { teacherId: editor.userId } } }
          : {}),
      },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        name: true,
        startsAt: true,
        status: true,
        teachers: {
          orderBy: { assignedAt: "asc" },
          select: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        enrollments: {
          where: { status: { in: ["ACTIVE", "COMPLETED"] } },
          orderBy: { enrolledAt: "asc" },
          select: {
            id: true,
            learner: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        sessions: {
          orderBy: { startsAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            startsAt: true,
            endsAt: true,
            location: true,
            meetingUrl: true,
            status: true,
            teacherId: true,
            teacher: { select: { firstName: true, lastName: true } },
            module: { select: { id: true, title: true } },
            attendance: {
              orderBy: { markedAt: "asc" },
              select: {
                id: true,
                status: true,
                enrollmentId: true,
              },
            },
          },
        },
      },
    }),
    db.teacherCourseActionLog.findMany({
      where: { courseId: courseid },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        details: true,
        teacher: { select: { firstName: true, lastName: true, email: true } },
        module: { select: { title: true } },
      },
    }),
  ]);
  if (!course) notFound();

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Teaching workspace · course content</span>
          <h1>{course.title}</h1>
          <p>
            Edit modules, subtopics, lesson text, YouTube videos, and
            attachments. Course publication and listing status can only be
            changed by an administrator.
          </p>
        </div>
        <div className="course-editor-heading-links">
          <Link className="text-link" href={`/teacher/courses/${course.id}/preview`}>Preview course</Link>
          <Link className="text-link" href="/teacher/courses">Back to courses</Link>
        </div>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}
      <CourseEditorForm
        course={course}
        moduleNotice={query.moduleNotice}
        modulePresentation="modal"
        modules={course.modules}
        showCourseDetails={false}
      />
      <section className="dashboard-panel teacher-course-sessions">
        <div className="workspace-panel-heading">
          <div>
            <h2>Sessions and teaching team</h2>
            <p>
              Review cohort assignments and session teachers. Your course
              changes are restricted to cohorts approved for your account.
            </p>
          </div>
        </div>
        {cohorts.length === 0 ? (
          <p className="campaign-empty">No cohorts are assigned to this course.</p>
        ) : cohorts.map((cohort) => (
          <section className="teacher-course-cohort" key={cohort.id}>
            <div className="workspace-panel-heading">
              <div>
                <h3>{cohort.name}</h3>
                <p>
                  Started {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  }).format(cohort.startsAt)} · {cohort.status.toLowerCase()}
                </p>
              </div>
            </div>
            <p className="learner-cohort-teachers">
              Approved teaching team: {cohort.teachers.length
                ? cohort.teachers.map(({ teacher }) =>
                    `${teacher.firstName} ${teacher.lastName}`.trim(),
                  ).join(", ")
                : "No teachers assigned"}
            </p>
            {cohort.sessions.length ? (
              <ul className="teacher-course-session-list">
                {cohort.sessions.map((liveSession) => (
                  <li key={liveSession.id}>
                    <div className="teacher-course-session-heading">
                      <div>
                        <strong>{liveSession.title}</strong>
                        <span>
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "UTC",
                          }).format(liveSession.startsAt)} UTC ·{" "}
                          {liveSession.module?.title ?? "Module not selected"} ·{" "}
                          {liveSession.teacher
                            ? `${liveSession.teacher.firstName} ${liveSession.teacher.lastName}`.trim()
                            : "Teacher not assigned"} · {liveSession.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    {editor.role === UserRole.TEACHER &&
                      liveSession.status === "SCHEDULED" &&
                      liveSession.endsAt <= new Date() && (
                        <form action={completeTeacherCourseSession}>
                          <input
                            name="courseId"
                            type="hidden"
                            value={course.id}
                          />
                          <input
                            name="sessionId"
                            type="hidden"
                            value={liveSession.id}
                          />
                          <button
                            className="button button--small"
                            type="submit"
                          >
                            Mark session complete
                          </button>
                        </form>
                      )}
                    {liveSession.status === "SCHEDULED" &&
                      liveSession.teacherId === editor.userId &&
                      editor.role === UserRole.TEACHER && (
                        <details className="teacher-course-session-editor">
                          <summary>Edit this session</summary>
                          <form action={saveTeacherCourseSession} className="admin-edit-form">
                            <input name="courseId" type="hidden" value={course.id} />
                            <input name="cohortId" type="hidden" value={cohort.id} />
                            <input name="sessionId" type="hidden" value={liveSession.id} />
                            <label>
                              Module
                              <select defaultValue={liveSession.module?.id ?? ""} name="moduleId">
                                <option value="">No module</option>
                                {course.modules.map((courseModule) => (
                                  <option key={courseModule.id} value={courseModule.id}>
                                    {courseModule.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Session title
                              <input defaultValue={liveSession.title} maxLength={160} name="title" required />
                            </label>
                            <label>
                              Starts at (UTC)
                              <input defaultValue={dateTimeValue(liveSession.startsAt)} name="startsAt" required type="datetime-local" />
                            </label>
                            <label>
                              Ends at (UTC)
                              <input defaultValue={dateTimeValue(liveSession.endsAt)} name="endsAt" required type="datetime-local" />
                            </label>
                            <label>
                              Location
                              <input defaultValue={liveSession.location ?? ""} maxLength={200} name="location" />
                            </label>
                            <label>
                              Meeting URL
                              <input defaultValue={liveSession.meetingUrl ?? ""} maxLength={500} name="meetingUrl" type="url" />
                            </label>
                            <label className="admin-form-wide">
                              Description
                              <textarea defaultValue={liveSession.description ?? ""} maxLength={2000} name="description" rows={2} />
                            </label>
                            <div className="admin-form-actions">
                              <button className="button button--small" type="submit">Save session</button>
                            </div>
                          </form>
                        </details>
                      )}
                    {editor.role === UserRole.TEACHER && (
                      <div className="teacher-attendance-review">
                        <strong>Class roll call</strong>
                        {liveSession.status !== "COMPLETED" ? (
                          <p className="campaign-empty">
                            Mark attendance after this session is completed.
                          </p>
                        ) : cohort.enrollments.length === 0 ? (
                          <p className="campaign-empty">
                            No active students are enrolled in this cohort.
                          </p>
                        ) : (
                          cohort.enrollments.map((enrollment) => {
                            const record = liveSession.attendance.find(
                              (item) => item.enrollmentId === enrollment.id,
                            );
                            const learnerName =
                              `${enrollment.learner.firstName} ${enrollment.learner.lastName}`.trim();
                            return (
                              <div className="learner-session-row" key={enrollment.id}>
                                <span>
                                  {learnerName || enrollment.learner.email || "Student"}
                                  {learnerName && enrollment.learner.email
                                    ? ` · ${enrollment.learner.email}`
                                    : ""}
                                </span>
                                <div className="teacher-roll-call-actions">
                                  {record && (
                                    <span
                                      className={`workspace-status-pill is-${record.status.toLowerCase()}`}
                                    >
                                      {record.status === "PENDING"
                                        ? "Awaiting teacher check"
                                        : record.status.toLowerCase()}
                                    </span>
                                  )}
                                  <form action={markCohortStudentAttendance}>
                                    <input
                                      name="sessionId"
                                      type="hidden"
                                      value={liveSession.id}
                                    />
                                    <input
                                      name="enrollmentId"
                                      type="hidden"
                                      value={enrollment.id}
                                    />
                                    <button
                                      aria-label={`Mark ${learnerName || "student"} present`}
                                      className="button button--small"
                                      name="decision"
                                      type="submit"
                                      value="PRESENT"
                                    >
                                      Present
                                    </button>
                                    <button
                                      aria-label={`Mark ${learnerName || "student"} absent`}
                                      className="course-suggestion-reject"
                                      name="decision"
                                      type="submit"
                                      value="ABSENT"
                                    >
                                      Absent
                                    </button>
                                  </form>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="campaign-empty">No sessions have been scheduled.</p>
            )}
            {editor.role === UserRole.TEACHER && (
              <details className="teacher-course-session-editor">
                <summary>Schedule a session for this cohort</summary>
                <form action={saveTeacherCourseSession} className="admin-edit-form">
                  <input name="courseId" type="hidden" value={course.id} />
                  <input name="cohortId" type="hidden" value={cohort.id} />
                  <label>
                    Module
                    <select defaultValue="" name="moduleId">
                      <option value="">No module</option>
                      {course.modules.map((courseModule) => (
                        <option key={courseModule.id} value={courseModule.id}>
                          {courseModule.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Session title
                    <input maxLength={160} name="title" required />
                  </label>
                  <label>
                    Starts at (UTC)
                    <input name="startsAt" required type="datetime-local" />
                  </label>
                  <label>
                    Ends at (UTC)
                    <input name="endsAt" required type="datetime-local" />
                  </label>
                  <label>
                    Location
                    <input maxLength={200} name="location" />
                  </label>
                  <label>
                    Meeting URL
                    <input maxLength={500} name="meetingUrl" type="url" />
                  </label>
                  <label className="admin-form-wide">
                    Description
                    <textarea maxLength={2000} name="description" rows={2} />
                  </label>
                  <div className="admin-form-actions">
                    <button className="button button--small" type="submit">Schedule session</button>
                  </div>
                </form>
              </details>
            )}
          </section>
        ))}
      </section>
      <section className="dashboard-panel teacher-course-action-log">
        <div className="workspace-panel-heading">
          <div>
            <h2>Course activity log</h2>
            <p>Recent teacher changes to course modules, lessons, and sessions.</p>
          </div>
          <span className="workspace-count">{actionLogs.length} actions</span>
        </div>
        {actionLogs.length === 0 ? (
          <p className="campaign-empty">No teacher changes have been recorded yet.</p>
        ) : (
          <ul>
            {actionLogs.map((log, index) => (
              <li key={`${log.createdAt.toISOString()}-${log.entityId ?? index}`}>
                <div>
                  <strong>{log.action.replaceAll("_", " ").toLowerCase()}</strong>
                  <span>
                    {log.module?.title ?? log.entityType.toLowerCase()} ·{" "}
                    {`${log.teacher.firstName} ${log.teacher.lastName}`.trim() ||
                      log.teacher.email ||
                      "Teacher"} ·{" "}
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(log.createdAt)} UTC
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
