import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Student dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Learner workspace</span>
          <h1>Your learning</h1>
          <p>Your enrollments, progress, and upcoming sessions will appear here.</p>
        </div>
        <Link className="button button--small" href="/courses">
          Explore courses
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Courses in progress</h2>
          <p className="campaign-empty">Your course enrollments will appear after your account is connected.</p>
        </section>
        <section className="dashboard-panel">
          <h2>Coming up</h2>
          <p className="campaign-empty">Upcoming sessions will appear after your account is connected.</p>
        </section>
      </div>
    </>
  );
}
