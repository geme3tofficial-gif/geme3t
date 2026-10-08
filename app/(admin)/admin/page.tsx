import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export default function AdminDashboardPage() {
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Administration</span>
          <h1>Admin workspace</h1>
          <p>Manage courses, applications, staff, and learner activity.</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link className="button button--small" href="/admin/campaigns">
            Promo campaigns
          </Link>
          <Link className="button button--small button--light" href="/admin/courses">
            Manage courses
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Courses</h2>
              <p>Course records from the platform database.</p>
            </div>
          </div>
          <p className="campaign-empty">Course records will appear after the database-backed course manager is connected.</p>
          <Link className="text-link" href="/admin/courses">
            Manage courses <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Recent learner and course updates.</p>
            </div>
          </div>
          <p className="campaign-empty">Learner activity will appear after database-backed workspace access is enabled.</p>
        </section>
      </div>

      <div className="workspace-lower-grid">
        <section className="dashboard-panel">
          <h2>Learner support</h2>
          <p className="campaign-empty">Learner support requests will appear after workspace data is connected.</p>
        </section>
        <section className="dashboard-panel">
          <h2>Teaching team</h2>
          <p className="campaign-empty">Teacher profiles will appear after workspace data is connected.</p>
        </section>
      </div>
    </>
  );
}
