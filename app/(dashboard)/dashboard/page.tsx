import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { courses } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Student dashboard",
};

const enrolled = [
  { slug: "product-management", progress: 68, next: "Product discovery" },
  { slug: "data-science", progress: 34, next: "Working with datasets" },
];

export default function DashboardPage() {
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Sample learner account · Friday, October 2, 2026</span>
          <h1>Welcome back, Jordan 👋</h1>
          <p>You’re making steady progress. Keep up the great work.</p>
        </div>
        <Link className="button button--small" href="/courses">
          Explore courses
        </Link>
      </div>
      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span aria-hidden="true" className="feature-icon">▤</span>
          <span>
            <strong>2</strong>
            <span>Courses in progress</span>
          </span>
        </div>
        <div className="dashboard-stat">
          <span aria-hidden="true" className="feature-icon">✓</span>
          <span>
            <strong>18</strong>
            <span>Lessons completed</span>
          </span>
        </div>
        <div className="dashboard-stat">
          <span aria-hidden="true" className="feature-icon">◷</span>
          <span>
            <strong>6.5 hrs</strong>
            <span>Learning this week</span>
          </span>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Pick up where you left off</h2>
          <div className="dashboard-courses">
            {enrolled.map((item) => {
              const course = courses.find((entry) => entry.slug === item.slug);
              if (!course) return null;
              return (
                <article className="dashboard-course" key={item.slug}>
                  <div className="dashboard-course-thumb">
                    <Image
                      alt=""
                      fill
                      sizes="64px"
                      src={course.image}
                    />
                  </div>
                  <div>
                    <h3>{course.title}</h3>
                    <p>Next up: {item.next}</p>
                    <div
                      aria-label={`${item.progress}% complete`}
                      className="progress-track"
                      role="img"
                    >
                      <span style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                  <span className="progress-value">{item.progress}%</span>
                </article>
              );
            })}
          </div>
        </section>
        <section className="dashboard-panel">
          <h2>Coming up</h2>
          <div className="schedule-item">
            <div className="schedule-date">
              <strong>06</strong>
              <span>Oct</span>
            </div>
            <div>
              <strong>Product mentor check-in</strong>
              <span>Tuesday · 10:00 AM</span>
            </div>
          </div>
          <div className="schedule-item">
            <div className="schedule-date">
              <strong>08</strong>
              <span>Oct</span>
            </div>
            <div>
              <strong>Data Science live session</strong>
              <span>Thursday · 2:30 PM</span>
            </div>
          </div>
          <div className="dashboard-announcement">
            <strong>Your next milestone is close</strong>
            <p>
              Finish the Product Discovery module to unlock your next project.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
