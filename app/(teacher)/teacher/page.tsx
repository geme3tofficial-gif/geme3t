import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Teacher dashboard",
};

export default function TeacherDashboardPage() {
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Teaching workspace</span>
          <h1>Teaching overview</h1>
          <p>Your assigned classes, learner updates, and sessions will appear here.</p>
        </div>
        <Link className="button button--small" href="/teacher/schedule">
          View schedule
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>My classes</h2>
              <p>Classes assigned to your teacher profile.</p>
            </div>
          </div>
          <p className="campaign-empty">Assigned classes will appear after teacher accounts are connected.</p>
        </section>

        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Upcoming sessions</h2>
              <p>Scheduled sessions for your cohorts.</p>
            </div>
          </div>
          <p className="campaign-empty">Scheduled sessions will appear after workspace data is connected.</p>
        </section>
      </div>

      <div className="workspace-lower-grid">
        <section className="dashboard-panel">
          <h2>Learner check-ins</h2>
          <p className="campaign-empty">Learner activity will appear after workspace data is connected.</p>
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
