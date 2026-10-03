import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Teacher dashboard",
};

const classes = [
  {
    course: "Product Management",
    cohort: "October cohort",
    learners: 24,
    progress: 72,
    next: "Product discovery workshop",
  },
  {
    course: "Product Management",
    cohort: "September cohort",
    learners: 18,
    progress: 46,
    next: "Roadmapping essentials",
  },
  {
    course: "Career Foundations",
    cohort: "October cohort",
    learners: 31,
    progress: 28,
    next: "Portfolio review",
  },
];

const learners = [
  { initials: "JD", name: "Jordan Davis", course: "Product Management", note: "Project submitted" },
  { initials: "AM", name: "Amina Musa", course: "Product Management", note: "Check-in due" },
  { initials: "EO", name: "Emeka Okafor", course: "Career Foundations", note: "On track" },
];

export default function TeacherDashboardPage() {
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Teaching workspace · sample account</span>
          <h1>Welcome back, Taylor</h1>
          <p>Your classes, learner updates, and upcoming sessions in one place.</p>
        </div>
        <Link className="button button--small" href="/teacher/schedule">
          View schedule
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span aria-hidden="true" className="feature-icon">▤</span>
          <span><strong>3</strong><span>Active classes</span></span>
        </div>
        <div className="dashboard-stat">
          <span aria-hidden="true" className="feature-icon">♙</span>
          <span><strong>73</strong><span>Learners supported</span></span>
        </div>
        <div className="dashboard-stat">
          <span aria-hidden="true" className="feature-icon">✓</span>
          <span><strong>8</strong><span>Submissions to review</span></span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>My classes</h2>
              <p>Class progress and your next teaching topic.</p>
            </div>
          </div>
          <div className="workspace-class-list">
            {classes.map((item) => (
              <article className="workspace-class" key={`${item.course}-${item.cohort}`}>
                <div className="workspace-class-title">
                  <span>
                    <strong>{item.course}</strong>
                    <span>{item.cohort} · {item.learners} learners</span>
                  </span>
                  <span className="progress-value">{item.progress}%</span>
                </div>
                <div
                  aria-label={`${item.progress}% class progress`}
                  className="progress-track"
                  role="img"
                >
                  <span style={{ width: `${item.progress}%` }} />
                </div>
                <p>Next: {item.next}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Upcoming sessions</h2>
              <p>Your teaching schedule.</p>
            </div>
          </div>
          <div className="schedule-item">
            <div className="schedule-date"><strong>05</strong><span>Oct</span></div>
            <div><strong>Product discovery workshop</strong><span>Monday · 10:00 AM</span></div>
          </div>
          <div className="schedule-item">
            <div className="schedule-date"><strong>06</strong><span>Oct</span></div>
            <div><strong>Mentor office hours</strong><span>Tuesday · 1:00 PM</span></div>
          </div>
          <div className="schedule-item">
            <div className="schedule-date"><strong>08</strong><span>Oct</span></div>
            <div><strong>Career foundations check-in</strong><span>Thursday · 11:30 AM</span></div>
          </div>
        </section>
      </div>

      <div className="workspace-lower-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Learner check-ins</h2>
              <p>Recent activity across your classes.</p>
            </div>
            <span className="workspace-count">3 updates</span>
          </div>
          <div className="workspace-activity-list">
            {learners.map((learner) => (
              <div className="workspace-activity" key={learner.name}>
                <span aria-hidden="true" className="avatar">{learner.initials}</span>
                <span>
                  <strong>{learner.name}</strong>
                  <span>{learner.course} · {learner.note}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Teaching resources</h2>
              <p>Quick links for your teaching day.</p>
            </div>
          </div>
          <div className="workspace-resource-links">
            <Link href="/courses">Browse course catalogue <span aria-hidden="true">→</span></Link>
            <Link href="/contact">Contact learner support <span aria-hidden="true">→</span></Link>
            <Link href="/lms-redirect">Open learning portal <span aria-hidden="true">→</span></Link>
          </div>
          <div className="dashboard-announcement">
            <strong>Sample dashboard preview</strong>
            <p>Class, learner, and session details are example data only.</p>
          </div>
        </section>
      </div>
    </>
  );
}
