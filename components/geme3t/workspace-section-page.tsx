import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkspaceRole } from "./workspace-shell";

type WorkspaceSection = {
  title: string;
  description: string;
  columns?: string[];
  rows?: string[][];
  metrics?: { value: string; label: string; icon: string }[];
  links?: { href: string; label: string }[];
  note?: string;
};

const adminSections: Record<string, WorkspaceSection> = {
  courses: {
    title: "Course management",
    description: "Review course enrolments and programme status.",
    columns: ["Programme", "Category", "Learners", "Status"],
    rows: [
      ["Product Management", "Product", "48", "Active"],
      ["Data Science", "Data & AI", "36", "Active"],
      ["Frontend Development", "Engineering", "29", "Active"],
      ["Cybersecurity", "Engineering", "24", "Starting soon"],
      ["AI & Automation", "Data & AI", "18", "Active"],
    ],
    links: [
      { href: "/courses", label: "View public course catalogue" },
      { href: "/admin/campaigns", label: "Create a course promotion" },
    ],
    note: "Course and learner figures are sample workspace data.",
  },
  learners: {
    title: "Learner management",
    description: "Review a sample of learners and their current support needs.",
    columns: ["Learner", "Programme", "Progress", "Latest update"],
    rows: [
      ["Jordan Davis", "Product Management", "68%", "Project submitted"],
      ["Amina Musa", "Data Science", "54%", "Check-in due"],
      ["Emeka Okafor", "Frontend Development", "81%", "On track"],
      ["Nora James", "Cybersecurity", "32%", "Needs follow-up"],
    ],
    note: "Learner profiles and activity are example data only.",
  },
  teachers: {
    title: "Teaching team",
    description: "Review teaching assignments and availability.",
    columns: ["Teacher", "Specialty", "Active cohorts", "Availability"],
    rows: [
      ["Taylor Smith", "Product Management", "2", "Available"],
      ["Kai Okafor", "Data Science", "1", "Available"],
      ["Morgan James", "Frontend Development", "2", "In session"],
      ["Riley Ade", "Cybersecurity", "1", "Available"],
    ],
    note: "Staff assignments are example data only.",
  },
  reports: {
    title: "Reports & insights",
    description: "A sample snapshot of activity across the learning platform.",
    metrics: [
      { value: "248", label: "Active learners", icon: "♙" },
      { value: "72%", label: "Average course progress", icon: "↗" },
      { value: "86%", label: "Learners on track", icon: "✓" },
    ],
    columns: ["Programme", "Enrolled learners", "Average progress"],
    rows: [
      ["Product Management", "48", "72%"],
      ["Data Science", "36", "64%"],
      ["Frontend Development", "29", "78%"],
      ["Cybersecurity", "24", "51%"],
    ],
    note: "Report figures are illustrative and are not connected to live analytics.",
  },
};

const teacherSections: Record<string, WorkspaceSection> = {
  classes: {
    title: "My classes",
    description: "Review your current cohorts and their learning progress.",
    columns: ["Programme", "Cohort", "Learners", "Progress", "Next topic"],
    rows: [
      ["Product Management", "October cohort", "24", "72%", "Product discovery"],
      ["Product Management", "September cohort", "18", "46%", "Roadmapping"],
      ["Career Foundations", "October cohort", "31", "28%", "Portfolio review"],
    ],
    note: "Class and cohort information is sample workspace data.",
  },
  learners: {
    title: "Learner check-ins",
    description: "Keep track of recent learner activity across your classes.",
    columns: ["Learner", "Programme", "Progress", "Latest update"],
    rows: [
      ["Jordan Davis", "Product Management", "68%", "Project submitted"],
      ["Amina Musa", "Product Management", "54%", "Check-in due"],
      ["Emeka Okafor", "Career Foundations", "81%", "On track"],
      ["Nora James", "Career Foundations", "32%", "Needs follow-up"],
    ],
    note: "Learner profiles and progress are example data only.",
  },
  schedule: {
    title: "Teaching schedule",
    description: "An example of your upcoming sessions and mentor check-ins.",
    columns: ["Date", "Session", "Class", "Time"],
    rows: [
      ["Monday, Oct 5", "Product discovery workshop", "October cohort", "10:00 AM"],
      ["Tuesday, Oct 6", "Mentor office hours", "Product Management", "1:00 PM"],
      ["Thursday, Oct 8", "Career foundations check-in", "October cohort", "11:30 AM"],
    ],
    note: "Schedule entries are sample data. No calendar is connected.",
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
    note: "Connect your learning platform to provide course materials and live class resources here.",
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
          <span className="eyebrow">{role} workspace · sample data</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>
        {role === "Administrator" && (
          <Link className="button button--small" href="/admin/campaigns">
            Promo campaigns
          </Link>
        )}
      </div>
      {content.metrics && (
        <div className="dashboard-stats">
          {content.metrics.map((metric) => (
            <div className="dashboard-stat" key={metric.label}>
              <span aria-hidden="true" className="feature-icon">
                {metric.icon}
              </span>
              <span>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="workspace-section-grid">
        {content.columns && content.rows && (
          <section className="dashboard-panel">
            <div className="workspace-table-wrap">
              <table className="workspace-table">
                <thead>
                  <tr>
                    {content.columns.map((column) => (
                      <th key={column} scope="col">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {content.rows.map((row) => (
                    <tr key={row.join("-")}>
                      {row.map((value, index) => (
                        <td key={`${row[0]}-${content.columns?.[index]}`}>
                          {index === row.length - 1 &&
                          ["Active", "Available", "On track"].includes(value) ? (
                            <span className="workspace-status workspace-status--active">
                              {value}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        {content.note && (
          <p className="workspace-data-note">{content.note}</p>
        )}
      </div>
    </>
  );
}
