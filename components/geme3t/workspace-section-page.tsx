import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkspaceRole } from "./workspace-shell";

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
    emptyMessage: "Learner records will appear after workspace data is connected.",
  },
  teachers: {
    title: "Teaching team",
    description: "Manage teacher profiles and cohort assignments.",
    emptyMessage: "Teacher records will appear after workspace data is connected.",
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
    emptyMessage: "Assigned classes will appear after teacher accounts are connected.",
  },
  learners: {
    title: "Learner check-ins",
    description: "Review learner activity across your assigned cohorts.",
    emptyMessage: "Learner activity will appear after workspace data is connected.",
  },
  schedule: {
    title: "Teaching schedule",
    description: "Review upcoming sessions and mentor check-ins.",
    emptyMessage: "Teaching sessions will appear after workspace data is connected.",
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

export function WorkspaceSectionPage({
  role,
  section,
}: {
  role: WorkspaceRole;
  section: string;
}) {
  const content = getWorkspaceSection(role, section);
  if (!content) notFound();

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
        {content.emptyMessage && (
          <section className="dashboard-panel">
            <p className="campaign-empty">{content.emptyMessage}</p>
          </section>
        )}
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
