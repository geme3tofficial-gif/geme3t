import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceSectionPage, getWorkspaceSection } from "@/components/geme3t/workspace-section-page";
import { requireCourseEditor } from "@/lib/course-editor-auth";

const sections = ["classes", "learners", "schedule", "resources"];

type TeacherSectionProps = {
  params: Promise<{ section: string }>;
};

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: TeacherSectionProps): Promise<Metadata> {
  const { section } = await params;
  const content = getWorkspaceSection("Teacher", section);
  return content ? { title: content.title } : {};
}

export default async function TeacherSectionRoute({
  params,
}: TeacherSectionProps) {
  const { userId } = await requireCourseEditor();
  const { section } = await params;
  if (!getWorkspaceSection("Teacher", section)) notFound();
  return <WorkspaceSectionPage role="Teacher" section={section} userId={userId} />;
}
