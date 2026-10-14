import "server-only";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCourseEditor() {
  if (!getSupabasePublicConfig()) redirect("/teacher/sign-in");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Course editor session validation failed.", error.message);
    throw new Error("Could not verify your course editor session.");
  }
  if (!data.user) redirect("/teacher/sign-in");

  const profile = await getPrismaClient().userProfile.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });
  if (profile?.role !== UserRole.ADMIN && profile?.role !== UserRole.TEACHER) {
    redirect("/teacher/sign-in?error=teacher-required");
  }

  return { role: profile.role, userId: data.user.id };
}

export async function requireCourseEditorForCourse(courseId: string) {
  const editor = await requireCourseEditor();
  await assertCourseEditorCourseAccess(editor, courseId);
  return editor;
}

export async function assertCourseEditorCourseAccess(
  editor: Awaited<ReturnType<typeof requireCourseEditor>>,
  courseId: string,
) {
  if (editor.role === UserRole.ADMIN) return;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      courseId,
    )
  ) {
    redirect("/teacher/courses?notice=course-not-assigned");
  }

  const assignment = await getPrismaClient().cohortTeachingAssignment.findFirst({
    where: {
      teacherId: editor.userId,
      cohort: { courseId },
    },
    select: { cohortId: true },
  });
  if (!assignment) {
    redirect("/teacher/courses?notice=course-not-assigned");
  }
}
