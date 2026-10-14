import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkspaceRole } from "./workspace-shell";
import { getPrismaClient } from "@/lib/prisma";

type WorkspaceSection = {
  title: string;
  description: string;
  emptyMessage?: string;
  links?: { href: string; label: string }[];
};

const adminSections: Record<string, WorkspaceSection> = {
  courses: {
    title: "Course management",
    description: "Manage courses and programme availability.",
    emptyMessage: "Course records will appear after the database-backed course manager is connected.",
  },
  cohorts: {
    title: "Training cohorts",
    description: "Manage course start and end dates and open application cohorts.",
    emptyMessage: "Create and manage training cohorts and their start dates.",
    links: [{ href: "/admin/cohorts", label: "Manage training cohorts" }],
  },
  sessions: {
    title: "Training sessions",
    description: "Schedule individual sessions and assign cohort teachers.",
    emptyMessage: "Create and manage training session schedules.",
    links: [{ href: "/admin/sessions", label: "Manage training sessions" }],
  },
  learners: {
    title: "Learner management",
    description: "Review learner profiles and support needs.",
  },
  teachers: {
    title: "Teaching team",
    description: "Manage teacher profiles and cohort assignments.",
  },
  reports: {
    title: "Reports & insights",
    description: "Review live enrollment and learning progress data.",
    emptyMessage: "Reports will appear after live learner activity is connected.",
  },
};

const teacherSections: Record<string, WorkspaceSection> = {
  classes: {
    title: "My classes",
    description: "Review your assigned cohorts and their learning progress.",
  },
  learners: {
    title: "Learner check-ins",
    description: "Review learner activity across your assigned cohorts.",
  },
  schedule: {
    title: "Teaching schedule",
    description: "Review upcoming sessions and mentor check-ins.",
  },
  resources: {
    title: "Teaching resources",
    description: "Quick links for your classes and learner support.",
    links: [
      { href: "/courses", label: "Browse the course catalogue" },
      { href: "/lms-redirect", label: "Open the learning portal" },
      { href: "/contact", label: "Contact learner support" },
      { href: "/teacher/schedule", label: "View your teaching schedule" },
    ],
  },
};

export function getWorkspaceSection(role: WorkspaceRole, slug: string) {
  return (role === "Administrator" ? adminSections : teacherSections)[slug];
}

async function getConnectedSectionContent(
  role: WorkspaceRole,
  section: string,
  userId?: string,
) {
  const prisma = getPrismaClient();

  if (role === "Administrator" && section === "teachers") {
    const teachers = await prisma.userProfile.findMany({
      where: { role: "TEACHER" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        teachingAssignments: {
          select: {
            cohort: {
              select: { name: true, course: { select: { title: true } } },
            },
          },
        },
      },
    });
    return (
      <section className="dashboard-panel workspace-data-list">
        <h2>Teacher records</h2>
        {teachers.length === 0 ? (
          <p className="campaign-empty">No teacher accounts are connected yet.</p>
        ) : (
          <div className="workspace-table-wrap">
            <table className="workspace-data-table">
              <thead>
                <tr>
                  <th scope="col">Teacher</th>
                  <th scope="col">Email</th>
                  <th scope="col">Approved course access</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <th scope="row">{teacher.firstName} {teacher.lastName}</th>
                    <td>{teacher.email ?? "—"}</td>
                    <td>
                      {teacher.teachingAssignments.length === 0
                        ? <span className="workspace-status-pill">Not assigned</span>
                        : teacher.teachingAssignments
                            .map(
                              ({ cohort }) =>
                                `${cohort.course.title} · ${cohort.name}`,
                            )
                            .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link className="text-link" href="/admin/cohorts">
          Assign course access through a cohort
        </Link>
      </section>
    );
  }

  if (role === "Administrator" && section === "learners") {
    const learners = await prisma.userProfile.findMany({
      where: { role: "STUDENT" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          select: {
            id: true,
            status: true,
            course: { select: { title: true } },
            cohort: { select: { name: true } },
          },
        },
      },
    });
    return (
      <section className="dashboard-panel workspace-data-list">
        <h2>Learner records</h2>
        {learners.length === 0 ? (
          <p className="campaign-empty">
            Learner profiles will appear after student accounts are created.
          </p>
        ) : (
          <div className="workspace-table-wrap">
            <table className="workspace-data-table">
              <thead>
                <tr>
                  <th scope="col">Learner</th>
                  <th scope="col">Email</th>
                  <th scope="col">Course and cohort</th>
                  <th scope="col">Enrollment</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner) => (
                  <tr key={learner.id}>
                    <th scope="row">{learner.firstName} {learner.lastName}</th>
                    <td>{learner.email ?? "—"}</td>
                    <td>
                      {learner.enrollments.length === 0
                        ? "No course enrollment"
                        : learner.enrollments
                            .map(
                              (enrollment) =>
                                `${enrollment.course.title}${enrollment.cohort ? ` · ${enrollment.cohort.name}` : ""}`,
                            )
                            .join(", ")}
                    </td>
                    <td>
                      {learner.enrollments.length === 0
                        ? "—"
                        : learner.enrollments
                            .map((enrollment) => enrollment.status.toLowerCase())
                            .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link className="text-link" href="/admin/applications">
          Review learner applications
        </Link>
      </section>
    );
  }

  if (role === "Teacher" && userId && section === "classes") {
    const assignments = await prisma.cohortTeachingAssignment.findMany({
      where: { teacherId: userId },
      orderBy: { cohort: { startsAt: "desc" } },
      select: {
        cohort: {
          select: {
            id: true,
            name: true,
            status: true,
            startsAt: true,
            course: { select: { title: true } },
            _count: {
              select: { enrollments: { where: { status: "ACTIVE" } } },
            },
          },
        },
      },
    });
    return (
      <section className="dashboard-panel workspace-data-list">
        <h2>Assigned classes</h2>
        {assignments.length === 0 ? (
          <p className="campaign-empty">
            No cohorts have been assigned to your teacher account yet. Ask an
            administrator to assign you under Admin → Cohorts.
          </p>
        ) : (
          <div className="workspace-table-wrap">
            <table className="workspace-data-table">
              <thead>
                <tr>
                  <th scope="col">Course</th>
                  <th scope="col">Cohort</th>
                  <th scope="col">Status</th>
                  <th scope="col">Active learners</th>
                  <th scope="col">Start date</th>
                  <th scope="col">Course content</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(({ cohort }) => (
                  <tr key={cohort.id}>
                    <td>{cohort.course.title}</td>
                    <th scope="row">{cohort.name}</th>
                    <td><span className="workspace-status-pill">{cohort.status.toLowerCase()}</span></td>
                    <td>{cohort._count.enrollments}</td>
                    <td>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(cohort.startsAt)}
                    </td>
                    <td><Link className="text-link" href="/teacher/courses">View assigned courses</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  if (role === "Teacher" && userId && section === "learners") {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        cohort: { teachers: { some: { teacherId: userId } } },
      },
      orderBy: [{ learner: { lastName: "asc" } }, { learner: { firstName: "asc" } }],
      select: {
        id: true,
        learner: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { title: true } },
        cohort: { select: { name: true } },
      },
    });
    return (
      <section className="dashboard-panel workspace-data-list">
        <h2>Enrolled learners in your assigned cohorts</h2>
        {enrollments.length === 0 ? (
          <p className="campaign-empty">
            Active learners will appear here after an administrator assigns
            cohorts and enrollments are recorded.
          </p>
        ) : (
          <div className="workspace-table-wrap">
            <table className="workspace-data-table">
              <thead>
                <tr>
                  <th scope="col">Learner</th>
                  <th scope="col">Email</th>
                  <th scope="col">Course</th>
                  <th scope="col">Cohort</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <th scope="row">{enrollment.learner.firstName} {enrollment.learner.lastName}</th>
                    <td>{enrollment.learner.email ?? "—"}</td>
                    <td>{enrollment.course.title}</td>
                    <td>{enrollment.cohort?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  if (role === "Teacher" && userId && section === "schedule") {
    const sessions = await prisma.liveSession.findMany({
      where: {
        teacherId: userId,
        status: "SCHEDULED",
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        location: true,
        meetingUrl: true,
        cohort: { select: { name: true, course: { select: { title: true } } } },
      },
    });
    return (
      <section className="dashboard-panel workspace-data-list">
        <h2>Upcoming training sessions</h2>
        {sessions.length === 0 ? (
          <p className="campaign-empty">
            No upcoming sessions are assigned to you. Ask an administrator to
            schedule a session for one of your cohorts.
          </p>
        ) : (
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.title}</strong>
                  <span>
                    {session.cohort.course.title} · {session.cohort.name} ·{" "}
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(session.startsAt)} UTC
                  </span>
                  {session.location && <span>{session.location}</span>}
                </div>
                {session.meetingUrl && (
                  <a className="text-link" href={session.meetingUrl} rel="noreferrer" target="_blank">
                    Join session
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return null;
}

export async function WorkspaceSectionPage({
  role,
  section,
  userId,
}: {
  role: WorkspaceRole;
  section: string;
  userId?: string;
}) {
  const content = getWorkspaceSection(role, section);
  if (!content) notFound();
  const connectedContent = await getConnectedSectionContent(role, section, userId);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">{role} workspace</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>
        {role === "Administrator" && (
          <Link className="button button--small" href="/admin/campaigns">
            Promo campaigns
          </Link>
        )}
      </div>
      <div className="workspace-section-grid">
        {connectedContent ?? (content.emptyMessage && (
          <section className="dashboard-panel">
            <p className="campaign-empty">{content.emptyMessage}</p>
          </section>
        ))}
        {content.links && (
          <section className="dashboard-panel">
            <h2>Quick links</h2>
            <div className="workspace-resource-links">
              {content.links.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
