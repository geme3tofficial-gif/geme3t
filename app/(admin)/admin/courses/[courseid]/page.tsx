import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseEditorForm } from "../course-editor-form";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit course",
};

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseid: string }>;
  searchParams: Promise<{ notice?: string; moduleNotice?: string }>;
}) {
  await requireAdmin();
  const [{ courseid }, query] = await Promise.all([params, searchParams]);
  const course = await getPrismaClient().course.findUnique({
    where: { id: courseid },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      description: true,
      imageUrl: true,
      durationWeeks: true,
      freeBootcampEnabled: true,
      status: true,
      modules: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          sortOrder: true,
          accessTypes: true,
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · catalogue</span>
          <h1>Edit course</h1>
          <p>Manage {course.title}, its public listing, and catalogue details.</p>
        </div>
        <Link className="text-link" href="/admin/courses">Back to courses</Link>
      </div>
      <CourseEditorForm
        course={course}
        moduleNotice={query.moduleNotice}
        modules={course.modules}
        notice={query.notice}
      />
    </>
  );
}
