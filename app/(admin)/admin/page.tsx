import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

const metrics = [
  { icon: "♙", value: "248", label: "Active learners" },
  { icon: "▤", value: "16", label: "Published courses" },
  { icon: "♧", value: "12", label: "Teaching staff" },
];

const courses = [
  { name: "Product Management", learners: 48, status: "Active" },
  { name: "Data Science", learners: 36, status: "Active" },
  { name: "Frontend Development", learners: 29, status: "Active" },
  { name: "Cybersecurity", learners: 24, status: "Starting soon" },
];

const activity = [
  { initials: "JD", text: "Jordan Davis enrolled in Product Management", time: "12 min ago" },
  { initials: "AM", text: "Amina Musa completed a course milestone", time: "38 min ago" },
  { initials: "EO", text: "Emeka Okafor submitted a Data Science project", time: "1 hr ago" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Administration · sample workspace</span>
          <h1>Good morning, Alex</h1>
          <p>Here’s an overview of what’s happening at GEME3T Academy.</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link className="button button--small" href="/admin/campaigns">
            Launch a campaign
          </Link>
          <Link className="button button--small button--light" href="/admin/courses">
            Manage courses
          </Link>
        </div>
      </div>

      <div className="dashboard-stats">
        {metrics.map((metric) => (
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

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Courses</h2>
              <p>Programme enrolment and status at a glance.</p>
            </div>
            <Link className="text-link" href="/admin/courses">
              Manage courses <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="workspace-table-wrap">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th scope="col">Programme</th>
                  <th scope="col">Learners</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.name}>
                    <td>{course.name}</td>
                    <td>{course.learners}</td>
                    <td>
                      <span
                        className={`workspace-status${course.status === "Active" ? " workspace-status--active" : ""}`}
                      >
                        {course.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Latest learner updates.</p>
            </div>
          </div>
          <div className="workspace-activity-list">
            {activity.map((item) => (
              <div className="workspace-activity" key={item.text}>
                <span aria-hidden="true" className="avatar">
                  {item.initials}
                </span>
                <span>
                  <strong>{item.text}</strong>
                  <span>{item.time}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="workspace-lower-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Learner support</h2>
              <p>Example learner enquiries requiring follow-up.</p>
            </div>
            <span className="workspace-count">3 open</span>
          </div>
          <div className="workspace-queue">
            <div>
              <span className="avatar" aria-hidden="true">JD</span>
              <span><strong>Jordan Davis</strong><span>Course access · 20 min ago</span></span>
              <span className="workspace-priority">New</span>
            </div>
            <div>
              <span className="avatar" aria-hidden="true">AM</span>
              <span><strong>Amina Musa</strong><span>Payment question · 1 hr ago</span></span>
              <span className="workspace-priority">Open</span>
            </div>
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Teaching team</h2>
              <p>Staff overview for this sample workspace.</p>
            </div>
          </div>
          <div className="workspace-team">
            <span className="avatar" aria-hidden="true">TS</span>
            <span><strong>Taylor Smith</strong><span>Product Management · 2 cohorts</span></span>
            <span className="workspace-status workspace-status--active">Available</span>
          </div>
          <div className="workspace-team">
            <span className="avatar" aria-hidden="true">KO</span>
            <span><strong>Kai Okafor</strong><span>Data Science · 1 cohort</span></span>
            <span className="workspace-status workspace-status--active">Available</span>
          </div>
        </section>
      </div>
    </>
  );
}
