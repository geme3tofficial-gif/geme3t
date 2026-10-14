import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseEditorForm } from "@/app/(admin)/admin/courses/course-editor-form";
import {
  requireCourseEditorForCourse,
} from "@/lib/course-editor-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit course content",
};

export default async function TeacherCourseEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseid: string }>;
  searchParams: Promise<{ moduleNotice?: string }>;
}) {
  const [{ courseid }, query] = await Promise.all([params, searchParams]);
  await requireCourseEditorForCourse(courseid);
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
          <span className="eyebrow">Teaching workspace · course content</span>
          <h1>{course.title}</h1>
          <p>
            Edit modules, subtopics, lesson text, YouTube videos, and
            attachments. Course publication and listing status can only be
            changed by an administrator.
          </p>
        </div>
        <div className="course-editor-heading-links">
          <Link className="text-link" href={`/teacher/courses/${course.id}/preview`}>Preview course</Link>
          <Link className="text-link" href="/teacher/courses">Back to courses</Link>
        </div>
      </div>
      <CourseEditorForm
        course={course}
        moduleNotice={query.moduleNotice}
        modulePresentation="modal"
        modules={course.modules}
        showCourseDetails={false}
      />
    </>
  );
}
