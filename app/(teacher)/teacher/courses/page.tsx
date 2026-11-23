import type { Metadata } from "next";
import Link from "next/link";
import { CourseStatus } from "@prisma/client";
import { submitCourseSuggestion } from "@/app/(admin)/admin/actions";
import { requireCourseEditor } from "@/lib/course-editor-auth";
import { getPrismaClient } from "@/lib/prisma";
import { calculateTeacherCourseProgress } from "@/lib/teacher-course-progress";
import { TeacherCourseDialog } from "./teacher-course-dialog";

export const metadata: Metadata = {
  title: "Manage course content",
};

const notices: Record<string, string> = {
  "course-not-assigned":
    "You do not have access to that course. Ask an administrator to assign you to one of its cohorts.",
  "invalid-suggestion":
    "Check the course proposal details and try again. Duration must be between 1 and 100 weeks.",
  "suggestion-submitted":
    "Your course proposal has been sent to an administrator for review.",
  "teacher-required": "Only teacher accounts can submit course proposals.",
  "cohort-application-submitted":
    "Your request to teach the cohort has been sent to an administrator.",
  "cohort-application-exists":
    "You already have a pending request or an approved assignment for that cohort.",
  "cohort-no-longer-available":
    "That cohort is no longer available for teaching requests.",
  "invalid-cohort-application":
    "Choose a valid cohort before expressing interest.",
};

function readableSuggestionStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function TeacherCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; course?: string }>;
}) {
  const { userId } = await requireCourseEditor();
  const prisma = getPrismaClient();
  const [assignedCourses, catalogueCourses, categories, suggestions, query] =
    await Promise.all([
      prisma.course.findMany({
        where: {
          cohorts: {
            some: { teachers: { some: { teacherId: userId } } },
          },
        },
        orderBy: [{ status: "asc" }, { title: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          status: true,
          modules: {
            select: {
              id: true,
              lessons: {
                where: { isPublished: true },
                select: { id: true },
              },
            },
          },
          cohorts: {
            where: { teachers: { some: { teacherId: userId } } },
            select: {
              enrollments: {
                where: { status: { in: ["ACTIVE", "COMPLETED"] } },
                select: {
                  lessonProgress: {
                    where: { status: "COMPLETED" },
                    select: { lessonId: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.course.findMany({
        where: {
          status: CourseStatus.PUBLISHED,
          cohorts: {
            none: { teachers: { some: { teacherId: userId } } },
          },
        },
        orderBy: { title: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          description: true,
          durationWeeks: true,
          modules: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              _count: { select: { lessons: true } },
            },
          },
          cohorts: {
            where: {
              status: { in: ["PLANNED", "OPEN"] },
              startsAt: { gt: new Date() },
            },
            orderBy: { startsAt: "asc" },
            select: {
              id: true,
              name: true,
              startsAt: true,
              status: true,
              teacherApplications: {
                where: { teacherId: userId },
                select: { status: true },
              },
            },
          },
        },
      }),
      prisma.course.findMany({
        where: { status: CourseStatus.PUBLISHED },
        distinct: ["category"],
        orderBy: { category: "asc" },
        select: { category: true },
      }),
      prisma.courseSuggestion.findMany({
        where: { suggestedById: userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
          course: { select: { slug: true } },
        },
      }),
      searchParams,
    ]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Teaching workspace</span>
          <h1>Course content</h1>
          <p>
            Edit courses assigned to you, explore the published catalogue, or
            propose a course for administrator review.
          </p>
        </div>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}

      <section className="dashboard-panel teacher-course-list">
        <div className="workspace-panel-heading">
          <div>
            <h2>Courses assigned to me</h2>
            <p>These are the courses you can preview and edit.</p>
          </div>
          <span className="workspace-count">{assignedCourses.length} courses</span>
        </div>
        {assignedCourses.length === 0 ? (
          <p className="campaign-empty">
            No courses have been assigned to you yet. An administrator can
            assign course access from the cohort settings.
          </p>
        ) : (
          <ul>
            {assignedCourses.map((course) => {
              const learners = course.cohorts.flatMap(({ enrollments }) => enrollments);
              const lessonIds = course.modules.flatMap(({ lessons }) =>
                lessons.map(({ id }) => id),
              );
              const progress = calculateTeacherCourseProgress(lessonIds, learners);
              return (
                <li key={course.id}>
                  <div>
                    <strong>{course.title}</strong>
                    <span>
                        {course.category} · {course.modules.length} modules ·{" "}
                        {course.status.toLowerCase()}
                    </span>
                    <div className="teacher-course-progress">
                        <div className="teacher-course-progress-heading">
                          <span>Average learner progress</span>
                          <strong>{progress}%</strong>
                        </div>
                        <div
                          aria-label={`${progress}% average learner progress`}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={progress}
                          className="progress-track"
                          role="progressbar"
                        >
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <span>
                          {learners.length
                            ? `${learners.length} active or completed learners`
                            : "No learners enrolled yet"}
                        </span>
                    </div>
                  </div>
                  <div className="course-editor-heading-links">
                    <Link
                        className="text-link"
                        href={`/teacher/courses/${course.id}/preview`}
                    >
                        Preview
                    </Link>
                    {course.status === CourseStatus.PUBLISHED && (
                        <Link
                          className="text-link"
                          href={`/${course.slug}`}
                          target="_blank"
                        >
                          Applicant page
                        </Link>
                    )}
                    <Link
                        className="text-link"
                        href={`/teacher/courses/${course.id}`}
                    >
                      Edit content
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dashboard-panel teacher-course-list teacher-catalogue-panel">
        <div className="workspace-panel-heading">
          <div>
            <h2>Published course catalogue</h2>
            <p>
              Open a course to review its modules and request assignment to an
              available cohort. An administrator must approve your request
              before you can manage its learners or content.
            </p>
          </div>
          <span className="workspace-count">{catalogueCourses.length} courses</span>
        </div>
        {catalogueCourses.length === 0 ? (
          <p className="campaign-empty">
            There are no other published courses available right now. You can
            suggest a new course below.
          </p>
        ) : (
          <ul>
            {catalogueCourses.map((course) => (
              <li key={course.id}>
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.category} · Published</span>
                </div>
                <div className="course-editor-heading-links">
                  <TeacherCourseDialog
                    course={course}
                    initiallyOpen={query.course === course.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-panel teacher-suggestion-panel">
        <div className="workspace-panel-heading">
          <div>
            <h2>Suggest a course</h2>
            <p>
              Proposals are private until an administrator approves them. Once
              approved, the course is published in the shared catalogue.
            </p>
          </div>
        </div>
        <form action={submitCourseSuggestion} className="teacher-suggestion-form">
          <label>
            Course title
            <input
              autoComplete="off"
              maxLength={120}
              name="title"
              required
            />
          </label>
          <label>
            Existing category
            <select defaultValue="" name="category" required>
              <option disabled value="">Choose a category</option>
              {categories.map(({ category }) => (
                <option key={category} value={category}>{category}</option>
              ))}
              <option value="__new__">Create a new category</option>
            </select>
          </label>
          <label>
            New category
            <input
              maxLength={80}
              name="newCategory"
              placeholder="Use only when creating a new category"
            />
          </label>
          <p className="teacher-suggestion-hint">
            Choose an existing category, or select “Create a new category” and
            enter a new one.
          </p>
          <label>
            Course description
            <textarea maxLength={2000} name="description" required rows={5} />
          </label>
          <label>
            Duration (weeks)
            <input
              max={100}
              min={1}
              name="durationWeeks"
              required
              type="number"
              defaultValue={12}
            />
          </label>
          <button className="button button--small" type="submit">
            Submit course proposal
          </button>
        </form>
      </section>

      <section className="dashboard-panel courses-table-panel teacher-suggestions-table">
        <div className="workspace-panel-heading">
          <div>
            <h2>My course proposals</h2>
            <p>Track administrator review of your submitted suggestions.</p>
          </div>
          <span className="workspace-count">{suggestions.length} proposals</span>
        </div>
        <div className="workspace-table-wrap">
          <table className="workspace-table">
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Category</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length === 0 ? (
                <tr>
                  <td className="courses-table-empty" colSpan={4}>
                    You have not submitted a course proposal yet.
                  </td>
                </tr>
              ) : (
                suggestions.map((suggestion) => (
                  <tr key={suggestion.id}>
                    <td>
                      {suggestion.course ? (
                        <Link href={`/${suggestion.course.slug}`}>
                          {suggestion.title}
                        </Link>
                      ) : suggestion.title}
                    </td>
                    <td>{suggestion.category}</td>
                    <td>
                      {suggestion.createdAt.toLocaleDateString("en", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>
                      <span
                        className={`workspace-status${suggestion.status === "APPROVED" ? " workspace-status--active" : ""}`}
                      >
                        {readableSuggestionStatus(suggestion.status)}
                      </span>
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
