import {
  CohortStatus,
  CourseStatus,
  SessionStatus,
  TeacherCohortApplicationStatus,
} from "@prisma/client";
import { applyToTeachCohort } from "@/app/(admin)/admin/actions";
import { getPrismaClient } from "@/lib/prisma";

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(value);
}

function formatSessionDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function formatCohortDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

export async function AvailableTeachingCohorts({
  userId,
}: {
  userId: string;
}) {
  const now = new Date();
  const cohorts = await getPrismaClient().cohort.findMany({
    where: {
      status: { in: [CohortStatus.PLANNED, CohortStatus.OPEN] },
      startsAt: { gt: now },
      course: { status: CourseStatus.PUBLISHED },
      teachers: { none: { teacherId: userId } },
    },
    orderBy: [{ startsAt: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      startsAt: true,
      endsAt: true,
      status: true,
      course: { select: { title: true, category: true } },
      teachers: {
        select: {
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
      teacherApplications: {
        where: { teacherId: userId },
        select: { status: true },
      },
      _count: { select: { teacherApplications: true } },
      sessions: {
        where: {
          status: SessionStatus.SCHEDULED,
          startsAt: { gte: now },
        },
        orderBy: { startsAt: "asc" },
        take: 3,
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return (
    <section className="dashboard-panel available-cohorts-panel">
      <div className="workspace-panel-heading">
        <div>
          <h2>Available teaching cohorts</h2>
          <p>
            Explore upcoming cohorts for published courses. Apply to teach;
            administrators review applications before granting course access.
          </p>
        </div>
        <span className="workspace-count">{cohorts.length} available</span>
      </div>
      {cohorts.length === 0 ? (
        <p className="campaign-empty">
          There are no upcoming cohorts available for published courses right
          now. Check back when an administrator schedules one.
        </p>
      ) : (
        <div className="available-cohorts-grid">
          {cohorts.map((cohort) => {
            const application = cohort.teacherApplications[0];
            const assignedTeacherNames = cohort.teachers
              .map(({ teacher }) =>
                `${teacher.firstName} ${teacher.lastName}`.trim(),
              )
              .filter(Boolean);

            return (
              <article className="available-cohort-card" key={cohort.id}>
                <div className="available-cohort-heading">
                  <div>
                    <span className="eyebrow">{cohort.course.category}</span>
                    <h3>{cohort.course.title}</h3>
                    <p>{cohort.name}</p>
                  </div>
                  <span className="workspace-status">
                    {cohort.status === CohortStatus.OPEN ? "Open" : "Planned"}
                  </span>
                </div>
                <dl className="available-cohort-facts">
                  <div>
                    <dt>Cohort dates</dt>
                    <dd>
                      {formatCohortDateTime(cohort.startsAt)} UTC
                      {cohort.endsAt
                        ? ` – ${formatCohortDateTime(cohort.endsAt)} UTC`
                        : " – End date to be confirmed"}
                    </dd>
                  </div>
                  <div>
                    <dt>Teacher applications</dt>
                    <dd>{cohort._count.teacherApplications}</dd>
                  </div>
                  <div>
                    <dt>Assigned teachers</dt>
                    <dd>
                      {assignedTeacherNames.length > 0
                        ? assignedTeacherNames.join(", ")
                        : "None assigned yet"}
                    </dd>
                  </div>
                </dl>
                <div className="available-cohort-sessions">
                  <h4>Upcoming teaching sessions</h4>
                  {cohort.sessions.length === 0 ? (
                    <p>Session times have not been scheduled yet.</p>
                  ) : (
                    <ul>
                      {cohort.sessions.map((session) => {
                        const hour = session.startsAt.getUTCHours();
                        const timeLabel =
                          hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
                        const sessionTeacher =
                          `${session.teacher?.firstName ?? ""} ${session.teacher?.lastName ?? ""}`.trim();
                        return (
                          <li key={session.id}>
                            <strong>
                              {timeLabel} · {session.title}
                            </strong>
                            <span>
                              {formatSessionDate(session.startsAt)} ·{" "}
                              {formatTime(session.startsAt)}–{formatTime(session.endsAt)} UTC
                            </span>
                            <span>
                              Facilitator: {sessionTeacher || "To be confirmed"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="available-cohort-apply">
                  {application?.status ===
                  TeacherCohortApplicationStatus.PENDING ? (
                    <span className="workspace-status">
                      Application pending review
                    </span>
                  ) : application?.status ===
                    TeacherCohortApplicationStatus.APPROVED ? (
                    <span className="workspace-status workspace-status--active">
                      Application approved
                    </span>
                  ) : (
                    <>
                      {application?.status ===
                        TeacherCohortApplicationStatus.REJECTED && (
                        <span className="workspace-status">
                          Previous application rejected
                        </span>
                      )}
                      <form action={applyToTeachCohort}>
                        <input name="cohortId" type="hidden" value={cohort.id} />
                        <button className="button button--small" type="submit">
                          {application?.status ===
                          TeacherCohortApplicationStatus.REJECTED
                            ? "Apply again"
                            : "Apply to teach"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
