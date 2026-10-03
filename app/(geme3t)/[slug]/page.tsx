import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PublicPage, getPageDescription, hasPublicPage } from "@/components/geme3t/public-page";
import { getPageTitle, sitePages } from "@/lib/site-data";

type SlugProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return sitePages.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SlugProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "contact-us") return { title: "Contact" };
  if (!hasPublicPage(slug)) return {};
  return {
    title: getPageTitle(slug),
    description: getPageDescription(slug),
  };
}

export default async function PublicRoute({ params }: SlugProps) {
  const { slug } = await params;

  if (slug === "contact-us") redirect("/contact");
  if (!hasPublicPage(slug)) notFound();

  return <PublicPage slug={slug} />;
}
