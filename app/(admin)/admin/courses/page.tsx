import type { Metadata } from "next";
import Link from "next/link";
import { CourseStatus, CourseSuggestionStatus } from "@prisma/client";
import {
  archiveCourse,
  reviewCourseSuggestion,
} from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage courses",
};

const notices: Record<string, string> = {
  "saved-course": "Course saved.",
  "archived-course": "Course archived and removed from public listings.",
  "invalid-course": "Check the course details and try again.",
  "invalid-suggestion": "That course proposal could not be reviewed.",
  "suggestion-already-reviewed":
    "That course proposal has already been reviewed.",
  "suggestion-approved":
    "Course proposal approved and published to the course catalogue.",
  "suggestion-rejected": "Course proposal rejected.",
};

function readableStatus(status: CourseStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const prisma = getPrismaClient();
  const [courses, suggestions, query] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ status: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        imageUrl: true,
        durationWeeks: true,
        freeBootcampEnabled: true,
        status: true,
      },
    }),
    prisma.courseSuggestion.findMany({
      where: { status: CourseSuggestionStatus.PENDING },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        durationWeeks: true,
        createdAt: true,
        suggestedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    }),
    searchParams,
  ]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · catalogue</span>
          <h1>Manage courses</h1>
          <p>Review and manage the programmes shown on the public site and application form.</p>
        </div>
        <Link className="button button--small" href="/admin/courses/new">
          Add a course
        </Link>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}
      <section
        className="dashboard-panel courses-table-panel course-suggestions-panel"
        aria-label="Course proposals awaiting review"
      >
        <div className="workspace-panel-heading">
          <div>
            <h2>Teacher course proposals</h2>
            <p>
              Approving a proposal creates a published course in the shared
              catalogue. Assign teaching access separately through a cohort.
            </p>
          </div>
          <span className="workspace-count">
            {suggestions.length} awaiting review
          </span>
        </div>
        <div className="workspace-table-wrap">
          <table className="workspace-table course-suggestions-table">
            <thead>
              <tr>
                <th scope="col">Proposal</th>
                <th scope="col">Teacher</th>
                <th scope="col">Submitted</th>
                <th scope="col"><span className="application-visually-hidden">Review actions</span></th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length === 0 ? (
                <tr>
                  <td className="courses-table-empty" colSpan={4}>
                    There are no course proposals awaiting review.
                  </td>
                </tr>
              ) : (
                suggestions.map((suggestion) => {
                  const teacherName =
                    `${suggestion.suggestedBy.firstName} ${suggestion.suggestedBy.lastName}`.trim();
                  return (
                    <tr key={suggestion.id}>
                      <td>
                        <strong>{suggestion.title}</strong>
                        <span className="course-suggestion-meta">
                          {suggestion.category} · {suggestion.durationWeeks} weeks
                        </span>
                        <p className="course-suggestion-description">
                          {suggestion.description}
                        </p>
                      </td>
                      <td>
                        {teacherName || suggestion.suggestedBy.email || "Teacher"}
                        {teacherName && suggestion.suggestedBy.email && (
                          <span className="course-suggestion-meta">
                            {suggestion.suggestedBy.email}
                          </span>
                        )}
                      </td>
                      <td>
                        {suggestion.createdAt.toLocaleDateString("en", {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        })}
                      </td>
                      <td className="courses-table-actions">
                        <form action={reviewCourseSuggestion}>
                          <input name="id" type="hidden" value={suggestion.id} />
                          <button
                            className="button button--small"
                            name="decision"
                            type="submit"
                            value="approve"
                          >
                            Approve & publish
                          </button>
                          <button
                            className="course-suggestion-reject"
                            name="decision"
                            type="submit"
                            value="reject"
                          >
                            Reject
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="dashboard-panel courses-table-panel" aria-label="Course records">
        <div className="workspace-panel-heading">
          <div>
            <h2>Course catalogue</h2>
            <p>{courses.length} {courses.length === 1 ? "course" : "courses"} total</p>
          </div>
        </div>
        <div className="workspace-table-wrap">
          <table className="workspace-table courses-table">
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Category</th>
                <th scope="col">Duration</th>
                <th scope="col">Bootcamp</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="application-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td className="courses-table-empty" colSpan={6}>
                    No courses yet. Add a course to start building the catalogue.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="course-table-name">
                        {course.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" src={course.imageUrl} />
                        ) : (
                          <span aria-hidden="true" className="course-table-placeholder">C</span>
                        )}
                        <div>
                          <Link href={`/admin/courses/${course.id}`}>{course.title}</Link>
                          <span>{course.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>{course.category}</td>
                    <td>{course.durationWeeks} weeks</td>
                    <td>
                      {course.freeBootcampEnabled ? (
                        <span className="workspace-status workspace-status--active">Available</span>
                      ) : (
                        <span className="courses-table-unavailable">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`workspace-status${course.status === CourseStatus.PUBLISHED ? " workspace-status--active" : ""}`}>
                        {readableStatus(course.status)}
                      </span>
                    </td>
                    <td className="courses-table-actions">
                      <Link className="text-link" href={`/admin/courses/${course.id}`}>
                        Edit
                      </Link>
                      {course.status !== CourseStatus.ARCHIVED && (
                        <form action={archiveCourse}>
                          <input name="id" type="hidden" value={course.id} />
                          <input name="slug" type="hidden" value={course.slug} />
                          <button className="courses-table-archive" type="submit">
                            Archive
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
