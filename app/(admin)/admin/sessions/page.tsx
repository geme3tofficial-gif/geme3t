import type { Metadata } from "next";
import { AttendanceStatus, SessionStatus } from "@prisma/client";
import { saveTrainingSession } from "@/app/(admin)/admin/actions";
import { validateAttendance } from "@/app/(teacher)/teacher/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage training sessions",
};

const notices: Record<string, string> = {
  "saved-session": "Training session saved.",
  "invalid-session": "Check the cohort, teacher, session details, and time range.",
  "attendance-validated": "Attendance has been validated.",
  "attendance-already-validated": "That attendance record has already been reviewed.",
  "attendance-not-ready": "Attendance can only be reviewed after a completed session.",
  "invalid-attendance": "The attendance review was invalid.",
};

function dateTimeValue(value: Date | null) {
  return value?.toISOString().slice(0, 16) ?? "";
}

function SessionFields({
  session,
  cohorts,
  teachers,
}: {
  session?: {
    id: string;
    cohortId: string;
    teacherId: string | null;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    location: string | null;
    meetingUrl: string | null;
    status: SessionStatus;
    moduleId: string | null;
  };
  cohorts: {
    id: string;
    name: string;
    course: {
      title: string;
      modules: { id: string; title: string }[];
    };
  }[];
  teachers: { id: string; firstName: string; lastName: string; email: string | null }[];
}) {
  return (
    <>
      {session && <input name="id" type="hidden" value={session.id} />}
      <label>
        Training cohort
        <select defaultValue={session?.cohortId ?? ""} name="cohortId" required>
          <option disabled value="">Choose a cohort</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.course.title} · {cohort.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Module (optional)
        <select defaultValue={session?.moduleId ?? ""} name="moduleId">
          <option value="">No module</option>
          {cohorts
            .flatMap((cohort) =>
              cohort.course.modules.map((courseModule) => ({
                ...courseModule,
                cohortName: cohort.name,
                courseTitle: cohort.course.title,
              })),
            )
            .map((courseModule) => (
              <option key={courseModule.id} value={courseModule.id}>
                {courseModule.courseTitle} · {courseModule.cohortName} ·{" "}
                {courseModule.title}
              </option>
            ))}
        </select>
      </label>
      <label>
        Teacher (optional)
        <select defaultValue={session?.teacherId ?? ""} name="teacherId">
          <option value="">Unassigned</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.firstName} {teacher.lastName}{teacher.email ? ` · ${teacher.email}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        Session title
        <input defaultValue={session?.title} maxLength={160} name="title" required />
      </label>
      <label>
        Starts at (UTC)
        <input
          defaultValue={dateTimeValue(session?.startsAt ?? null)}
          name="startsAt"
          required
          type="datetime-local"
        />
      </label>
      <label>
        Ends at (UTC)
        <input
          defaultValue={dateTimeValue(session?.endsAt ?? null)}
          name="endsAt"
          required
          type="datetime-local"
        />
      </label>
      <label>
        Location (optional)
        <input defaultValue={session?.location ?? ""} maxLength={200} name="location" />
      </label>
      <label className="admin-form-wide">
        Meeting URL (optional)
        <input
          defaultValue={session?.meetingUrl ?? ""}
          maxLength={500}
          name="meetingUrl"
          placeholder="https://..."
          type="url"
        />
      </label>
      <label className="admin-form-wide">
        Description (optional)
        <textarea
          defaultValue={session?.description ?? ""}
          maxLength={2000}
          name="description"
          rows={2}
        />
      </label>
      <label>
        Session status
        <select defaultValue={session?.status ?? SessionStatus.SCHEDULED} name="status">
          <option value={SessionStatus.SCHEDULED}>Scheduled</option>
          <option value={SessionStatus.COMPLETED}>Completed</option>
          <option value={SessionStatus.CANCELLED}>Cancelled</option>
        </select>
      </label>
      <p className="admin-schedule-hint admin-form-wide">
        Enter session start and end times in UTC.
      </p>
      <div className="admin-form-actions">
        <button className="button button--small" type="submit">
          {session ? "Save session" : "Schedule session"}
        </button>
      </div>
    </>
  );
}

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const [cohorts, teachers, sessions, query] = await Promise.all([
    getPrismaClient().cohort.findMany({
      include: {
        course: {
          select: {
            title: true,
            modules: {
              orderBy: { sortOrder: "asc" },
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { startsAt: "asc" },
    }),
    getPrismaClient().userProfile.findMany({
      where: { role: "TEACHER" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    getPrismaClient().liveSession.findMany({
      include: {
        cohort: { include: { course: { select: { title: true } } } },
        teacher: { select: { firstName: true, lastName: true } },
        module: { select: { title: true } },
        attendance: {
          orderBy: { markedAt: "asc" },
          select: {
            id: true,
            status: true,
            enrollment: {
              select: {
                learner: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
            validatedBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { startsAt: "desc" },
    }),
    searchParams,
  ]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · schedule</span>
          <h1>Training sessions</h1>
          <p>Schedule training sessions, assign a cohort and teacher, and manage session times and status.</p>
        </div>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}
      {cohorts.length === 0 ? (
        <section className="dashboard-panel">
          <p className="campaign-empty">Create a training cohort before scheduling sessions.</p>
        </section>
      ) : (
        <>
          <section className="dashboard-panel admin-editor-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Schedule a session</h2>
                <p>Set a start and end time and optionally assign a teacher.</p>
              </div>
            </div>
            <form action={saveTrainingSession} className="admin-edit-form">
              <SessionFields cohorts={cohorts} teachers={teachers} />
            </form>
          </section>
          <section className="admin-record-list" aria-label="Training sessions">
            {sessions.map((session) => (
              <article className="dashboard-panel admin-editor-panel" key={session.id}>
                <div className="workspace-panel-heading">
                  <div>
                    <h2>{session.title}</h2>
                    <p>
                      {session.cohort.course.title} · {session.cohort.name} · {session.module?.title ?? "No module"} · {session.startsAt.toISOString().replace("T", " ").slice(0, 16)}–{session.endsAt.toISOString().replace("T", " ").slice(11, 16)} UTC · {session.teacher ? `${session.teacher.firstName} ${session.teacher.lastName}` : "Unassigned"} · {session.status.toLowerCase()}
                    </p>
                  </div>
                </div>
                <form action={saveTrainingSession} className="admin-edit-form">
                  <SessionFields
                    cohorts={cohorts}
                    session={session}
                    teachers={teachers}
                  />
                </form>
                {session.attendance.length > 0 && (
                  <section className="teacher-attendance-review">
                    <h3>Attendance validation</h3>
                    {session.attendance.map((record) => (
                      <div className="learner-session-row" key={record.id}>
                        <span>
                          {record.enrollment.learner.firstName}{" "}
                          {record.enrollment.learner.lastName}
                          {record.enrollment.learner.email
                            ? ` · ${record.enrollment.learner.email}`
                            : ""}
                        </span>
                        {record.status === AttendanceStatus.PENDING ? (
                          <form action={validateAttendance}>
                            <input name="attendanceId" type="hidden" value={record.id} />
                            <button className="button button--small" name="decision" type="submit" value={AttendanceStatus.PRESENT}>
                              Validate present
                            </button>
                            <button className="course-suggestion-reject" name="decision" type="submit" value={AttendanceStatus.ABSENT}>
                              Mark absent
                            </button>
                          </form>
                        ) : (
                          <span className={`workspace-status-pill is-${record.status.toLowerCase()}`}>
                            {record.status.toLowerCase()}
                            {record.validatedBy
                              ? ` · ${record.validatedBy.firstName} ${record.validatedBy.lastName}`
                              : ""}
                          </span>
                        )}
                      </div>
                    ))}
                  </section>
                )}
              </article>
            ))}
            {sessions.length === 0 && (
              <p className="campaign-empty">No training sessions are scheduled yet.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
