import type { Metadata } from "next";
import { SessionStatus } from "@prisma/client";
import { saveTrainingSession } from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage training sessions",
};

const notices: Record<string, string> = {
  "saved-session": "Training session saved.",
  "invalid-session": "Check the cohort, teacher, session details, and time range.",
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
  };
  cohorts: { id: string; name: string; course: { title: string } }[];
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
      include: { course: { select: { title: true } } },
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
                      {session.cohort.course.title} · {session.cohort.name} · {session.startsAt.toISOString().replace("T", " ").slice(0, 16)}–{session.endsAt.toISOString().replace("T", " ").slice(11, 16)} UTC · {session.teacher ? `${session.teacher.firstName} ${session.teacher.lastName}` : "Unassigned"} · {session.status.toLowerCase()}
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
