import type { Metadata } from "next";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AvailableTeachingCohorts } from "@/components/geme3t/available-teaching-cohorts";
import { requireCourseEditor } from "@/lib/course-editor-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Teacher dashboard",
};

const notices: Record<string, string> = {
  "cohort-application-submitted":
    "Your application to teach the cohort has been submitted for administrator review.",
  "cohort-application-exists":
    "You already have an active application for this cohort.",
  "cohort-no-longer-available":
    "That cohort is no longer open for teacher applications.",
  "invalid-cohort-application":
    "The cohort application could not be submitted.",
  "teacher-required": "Only teacher accounts can apply to teach a cohort.",
};

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { role, userId } = await requireCourseEditor();
  const { notice } = await searchParams;
  const prisma = getPrismaClient();
  const [courses, cohorts, sessions] = await Promise.all([
    prisma.course.findMany({
      where: {
        cohorts: { some: { teachers: { some: { teacherId: userId } } } },
      },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.cohort.findMany({
      where: { teachers: { some: { teacherId: userId } } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        course: { select: { title: true } },
        _count: {
          select: { enrollments: { where: { status: "ACTIVE" } } },
        },
      },
    }),
    prisma.liveSession.findMany({
      where: {
        teacherId: userId,
        status: "SCHEDULED",
        startsAt: { gte: new Date() },
        cohort: { teachers: { some: { teacherId: userId } } },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        startsAt: true,
        cohort: { select: { name: true, course: { select: { title: true } } } },
      },
    }),
  ]);
  const learnerCount = cohorts.reduce(
    (count, cohort) => count + cohort._count.enrollments,
    0,
  );

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Teaching workspace</span>
          <h1>Teaching overview</h1>
          <p>Review the courses and cohorts assigned to your teacher account.</p>
        </div>
        <Link className="button button--small" href="/teacher/courses">
          Manage course content
        </Link>
      </div>
      {notice && notices[notice] && (
        <p className="admin-notice" role="status">{notices[notice]}</p>
      )}

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>My classes</h2>
              <p>Courses become available here when an administrator grants access through a cohort.</p>
            </div>
            <Link className="text-link" href="/teacher/courses">View courses</Link>
          </div>
          {courses.length === 0 ? (
            <p className="campaign-empty">
              No courses have been assigned yet. Ask an administrator to add
              you under Admin → Cohorts.
            </p>
          ) : (
            <ul className="teacher-dashboard-assignments">
              {cohorts.slice(0, 4).map((cohort) => (
                <li key={cohort.id}>
                  <strong>{cohort.course.title} · {cohort.name}</strong>
                  <span>{cohort.status.toLowerCase()} · {cohort._count.enrollments} active learners</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Upcoming sessions</h2>
              <p>Scheduled sessions for your cohorts.</p>
            </div>
          </div>
          {sessions.length === 0 ? (
            <p className="campaign-empty">
              No upcoming sessions are scheduled for your assigned cohorts.
            </p>
          ) : (
            <ul className="teacher-dashboard-assignments">
              {sessions.map((session) => (
                <li key={session.id}>
                  <strong>{session.title}</strong>
                  <span>
                    {session.cohort.course.title} · {session.cohort.name} ·{" "}
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    }).format(session.startsAt)} UTC
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {role === UserRole.TEACHER && (
        <AvailableTeachingCohorts userId={userId} />
      )}

      <div className="workspace-lower-grid">
        <section className="dashboard-panel">
          <h2>Learner check-ins</h2>
          <p className="campaign-empty">
            {learnerCount} active {learnerCount === 1 ? "learner is" : "learners are"} enrolled in your assigned cohorts.
          </p>
        </section>
        <section className="dashboard-panel">
          <h2>Teaching resources</h2>
          <div className="workspace-resource-links">
            <Link href="/courses">Browse course catalogue <span aria-hidden="true">→</span></Link>
            <Link href="/contact">Contact learner support <span aria-hidden="true">→</span></Link>
            <Link href="/lms-redirect">Open learning portal <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </div>
    </>
  );
}
