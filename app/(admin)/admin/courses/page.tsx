import type { Metadata } from "next";
import { CourseStatus } from "@prisma/client";
import { archiveCourse, saveCourse } from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage courses",
};

const notices: Record<string, string> = {
  "saved-course": "Course saved.",
  "archived-course": "Course archived and removed from public listings.",
  "duplicate-course": "That URL slug is already in use.",
  "invalid-course": "Check the course details and try again.",
};

function CourseFields({
  course,
}: {
  course?: {
    id: string;
    slug: string;
    title: string;
    category: string;
    description: string;
    imageUrl: string | null;
    durationWeeks: number;
    status: CourseStatus;
  };
}) {
  return (
    <>
      {course && <input name="id" type="hidden" value={course.id} />}
      <label>
        Course name
        <input defaultValue={course?.title} maxLength={120} name="title" required />
      </label>
      <label>
        URL slug
        <input
          defaultValue={course?.slug}
          maxLength={80}
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="course-name"
          required
        />
      </label>
      <label>
        Category
        <input
          defaultValue={course?.category}
          maxLength={80}
          name="category"
          required
        />
      </label>
      <label>
        Duration (weeks)
        <input
          defaultValue={course?.durationWeeks ?? 16}
          max={100}
          min={1}
          name="durationWeeks"
          required
          type="number"
        />
      </label>
      <label className="admin-form-wide">
        Description
        <textarea
          defaultValue={course?.description}
          maxLength={2000}
          name="description"
          required
          rows={3}
        />
      </label>
      <label className="admin-form-wide">
        Course image URL
        <input
          defaultValue={course?.imageUrl ?? ""}
          maxLength={500}
          name="imageUrl"
          placeholder="/frontend/wp-content/uploads/..."
          required
        />
      </label>
      <label>
        Listing status
        <select defaultValue={course?.status ?? CourseStatus.PUBLISHED} name="status">
          <option value={CourseStatus.DRAFT}>Draft</option>
          <option value={CourseStatus.PUBLISHED}>Published</option>
          <option value={CourseStatus.ARCHIVED}>Archived</option>
        </select>
      </label>
      <div className="admin-form-actions">
        <button className="button button--small" type="submit">
          {course ? "Save course" : "Add course"}
        </button>
      </div>
    </>
  );
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const [courses, query] = await Promise.all([
    getPrismaClient().course.findMany({
      orderBy: [{ status: "asc" }, { title: "asc" }],
    }),
    searchParams,
  ]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · catalogue</span>
          <h1>Manage courses</h1>
          <p>Edit the programmes shown on the public site and application form.</p>
        </div>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}
      <section className="dashboard-panel admin-editor-panel">
        <div className="workspace-panel-heading">
          <div>
            <h2>Add a course</h2>
            <p>Published courses appear in the public catalogue and application choices.</p>
          </div>
        </div>
        <form action={saveCourse} className="admin-edit-form">
          <CourseFields />
        </form>
      </section>
      <section className="admin-record-list" aria-label="Course records">
        {courses.map((course) => (
          <article className="dashboard-panel admin-editor-panel" key={course.id}>
            <div className="workspace-panel-heading">
              <div>
                <h2>{course.title}</h2>
                <p>{course.category} · {course.durationWeeks} weeks · {course.status.toLowerCase()}</p>
              </div>
              <form action={archiveCourse}>
                <input name="id" type="hidden" value={course.id} />
                <input name="slug" type="hidden" value={course.slug} />
                <button
                  className="button button--small button--light"
                  disabled={course.status === CourseStatus.ARCHIVED}
                  type="submit"
                >
                  Archive
                </button>
              </form>
            </div>
            <form action={saveCourse} className="admin-edit-form">
              <CourseFields course={course} />
            </form>
          </article>
        ))}
      </section>
    </>
  );
}
