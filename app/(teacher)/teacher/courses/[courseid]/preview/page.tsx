import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCurriculum } from "@/components/geme3t/course-curriculum";
import { requireCourseEditorForCourse } from "@/lib/course-editor-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Course preview",
};

export default async function TeacherCoursePreviewPage({
  params,
}: {
  params: Promise<{ courseid: string }>;
}) {
  const { courseid } = await params;
  await requireCourseEditorForCourse(courseid);
  const course = await getPrismaClient().course.findUnique({
    where: { id: courseid },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      status: true,
      modules: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          sortOrder: true,
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              sortOrder: true,
              isPublished: true,
              contentItems: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  kind: true,
                  title: true,
                  body: true,
                  url: true,
                  fileName: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!course) notFound();

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Teaching workspace · course preview</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          {course.status !== "PUBLISHED" && (
            <p className="admin-notice">This course is not published. Only teachers can see this preview.</p>
          )}
        </div>
        <div className="course-editor-heading-links">
          <Link className="text-link" href={`/teacher/courses/${course.id}`}>Edit content</Link>
          <Link className="text-link" href="/teacher/courses">Back to courses</Link>
          {course.status === "PUBLISHED" && (
            <Link className="text-link" href={`/${course.slug}`} target="_blank">Open applicant page</Link>
          )}
        </div>
      </div>
      <CourseCurriculum heading="Preview the course modules" modules={course.modules} />
    </>
  );
}
