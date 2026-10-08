import type { Metadata } from "next";
import { CohortStatus } from "@prisma/client";
import { saveCohort } from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage training cohorts",
};

const notices: Record<string, string> = {
  "saved-cohort": "Training cohort saved.",
  "duplicate-cohort": "That course already has a cohort with this name.",
  "invalid-cohort": "Check the course and cohort dates, then try again.",
};

function dateTimeValue(value: Date | null) {
  return value?.toISOString().slice(0, 16) ?? "";
}

function CohortFields({
  cohort,
  courses,
}: {
  cohort?: {
    id: string;
    courseId: string;
    name: string;
    startsAt: Date;
    endsAt: Date | null;
    status: CohortStatus;
  };
  courses: { id: string; title: string }[];
}) {
  return (
    <>
      {cohort && <input name="id" type="hidden" value={cohort.id} />}
      <label>
        Course
        <select defaultValue={cohort?.courseId ?? ""} name="courseId" required>
          <option disabled value="">Choose a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </label>
      <label>
        Cohort name
        <input defaultValue={cohort?.name} maxLength={120} name="name" required />
      </label>
      <label>
        Starts at (UTC)
        <input
          defaultValue={dateTimeValue(cohort?.startsAt ?? null)}
          name="startsAt"
          required
          type="datetime-local"
        />
      </label>
      <label>
        Ends at (UTC, optional)
        <input
          defaultValue={dateTimeValue(cohort?.endsAt ?? null)}
          name="endsAt"
          type="datetime-local"
        />
      </label>
      <label>
        Cohort status
        <select defaultValue={cohort?.status ?? CohortStatus.PLANNED} name="status">
          <option value={CohortStatus.PLANNED}>Planned</option>
          <option value={CohortStatus.OPEN}>Open for applications</option>
          <option value={CohortStatus.IN_PROGRESS}>In progress</option>
          <option value={CohortStatus.COMPLETED}>Completed</option>
          <option value={CohortStatus.CANCELLED}>Cancelled</option>
        </select>
      </label>
      <p className="admin-schedule-hint admin-form-wide">
        Only future cohorts marked “Open for applications” appear in the application start-date choices. Enter times in UTC.
      </p>
      <div className="admin-form-actions">
        <button className="button button--small" type="submit">
          {cohort ? "Save cohort" : "Add cohort"}
        </button>
      </div>
    </>
  );
}

export default async function AdminCohortsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const [courses, cohorts, query] = await Promise.all([
    getPrismaClient().course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    getPrismaClient().cohort.findMany({
      include: {
        course: { select: { title: true } },
        _count: { select: { sessions: true, applications: true } },
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
    }),
    searchParams,
  ]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · schedule</span>
          <h1>Training cohorts</h1>
          <p>Set course start and end dates, manage cohort status, and control the application start-date choices.</p>
        </div>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}
      {courses.length === 0 ? (
        <section className="dashboard-panel">
          <p className="campaign-empty">Add a course before creating a training cohort.</p>
        </section>
      ) : (
        <>
          <section className="dashboard-panel admin-editor-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Add a cohort</h2>
                <p>Open future cohorts become selectable start dates on the application form.</p>
              </div>
            </div>
            <form action={saveCohort} className="admin-edit-form">
              <CohortFields courses={courses} />
            </form>
          </section>
          <section className="admin-record-list" aria-label="Training cohorts">
            {cohorts.map((cohort) => (
              <article className="dashboard-panel admin-editor-panel" key={cohort.id}>
                <div className="workspace-panel-heading">
                  <div>
                    <h2>{cohort.name}</h2>
                    <p>
                      {cohort.course.title} · {cohort.startsAt.toISOString().replace("T", " ").slice(0, 16)} UTC · {cohort.status.toLowerCase()} · {cohort._count.sessions} sessions · {cohort._count.applications} applicants
                    </p>
                  </div>
                </div>
                <form action={saveCohort} className="admin-edit-form">
                  <CohortFields
                    cohort={{
                      id: cohort.id,
                      courseId: cohort.courseId,
                      name: cohort.name,
                      startsAt: cohort.startsAt,
                      endsAt: cohort.endsAt,
                      status: cohort.status,
                    }}
                    courses={courses}
                  />
                </form>
              </article>
            ))}
            {cohorts.length === 0 && (
              <p className="campaign-empty">No cohorts have been scheduled yet.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
