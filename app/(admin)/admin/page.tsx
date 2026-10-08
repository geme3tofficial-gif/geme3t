import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatus, ScholarshipStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const prisma = getPrismaClient();
  const [courseCount, scholarshipCount, applicationCount] = await prisma.$transaction([
    prisma.course.count(),
    prisma.scholarship.count({
      where: { status: ScholarshipStatus.ACTIVE },
    }),
    prisma.scholarshipApplication.count({
      where: { status: ApplicationStatus.SUBMITTED },
    }),
  ]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Administration</span>
          <h1>Admin workspace</h1>
          <p>Manage courses, applications, staff, and learner activity.</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link className="button button--small" href="/admin/applications">
            Review applications
          </Link>
          <Link className="button button--small button--light" href="/admin/scholarships">
            Manage scholarships
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>New applications</h2>
              <p>Submissions waiting for an initial review.</p>
            </div>
          </div>
          <p className="admin-dashboard-count">{applicationCount}</p>
          <Link className="text-link" href="/admin/applications">
            Open application list <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Active offers</h2>
              <p>Scholarships available on the application form.</p>
            </div>
          </div>
          <p className="admin-dashboard-count">{scholarshipCount}</p>
          <Link className="text-link" href="/admin/scholarships">
            Manage offers <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>

      <div className="workspace-lower-grid">
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Course catalogue</h2>
              <p>Public course records managed from the database.</p>
            </div>
          </div>
          <p className="admin-dashboard-count">{courseCount}</p>
          <Link className="text-link" href="/admin/courses">
            Manage courses <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </>
  );
}
