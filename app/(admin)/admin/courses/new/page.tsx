import type { Metadata } from "next";
import Link from "next/link";
import { CourseEditorForm } from "../course-editor-form";

export const metadata: Metadata = {
  title: "Add a course",
};

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const query = await searchParams;

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · catalogue</span>
          <h1>Add a course</h1>
          <p>Create a programme for the GEME3T Academy catalogue.</p>
        </div>
        <Link className="text-link" href="/admin/courses">Back to courses</Link>
      </div>
      <CourseEditorForm notice={query.notice} />
    </>
  );
}
