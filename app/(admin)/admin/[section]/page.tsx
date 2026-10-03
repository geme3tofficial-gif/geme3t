import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceSectionPage, getWorkspaceSection } from "@/components/geme3t/workspace-section-page";

const sections = ["courses", "learners", "teachers", "reports"];

type AdminSectionProps = {
  params: Promise<{ section: string }>;
};

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: AdminSectionProps): Promise<Metadata> {
  const { section } = await params;
  const content = getWorkspaceSection("Administrator", section);
  return content ? { title: content.title } : {};
}

export default async function AdminSectionRoute({
  params,
}: AdminSectionProps) {
  const { section } = await params;
  if (!getWorkspaceSection("Administrator", section)) notFound();
  return <WorkspaceSectionPage role="Administrator" section={section} />;
}
