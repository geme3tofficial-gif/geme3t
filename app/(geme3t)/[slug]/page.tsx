import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { PublicPage, getPageDescription } from "@/components/geme3t/public-page";
import { getCourse, getPageTitle, sitePages } from "@/lib/site-data";
import { getPublishedCourseBySlug, getPublishedCourses } from "@/lib/course-data";

type SlugProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return sitePages.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SlugProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "contact-us") return { title: "Contact" };
  const knownCourse = getCourse(slug);
  if (knownCourse || !(sitePages as readonly string[]).includes(slug)) {
    await connection();
    const course = await getPublishedCourseBySlug(slug);
    if (course) {
      return {
        title: course.title,
        description: course.description,
      };
    }
    if (knownCourse) return {};
  }

  if ((sitePages as readonly string[]).includes(slug)) {
    return {
      title: getPageTitle(slug),
      description: getPageDescription(slug),
    };
  }
  return {};
}

export default async function PublicRoute({ params }: SlugProps) {
  const { slug } = await params;

  if (slug === "contact-us") redirect("/contact");
  if ((sitePages as readonly string[]).includes(slug)) {
    if (slug === "courses") {
      await connection();
      const courses = await getPublishedCourses();
      return <PublicPage courses={courses} slug={slug} />;
    }
    if (getCourse(slug)) {
      await connection();
      const course = await getPublishedCourseBySlug(slug);
      if (!course) notFound();
      return <PublicPage course={course} slug={slug} />;
    }
    return <PublicPage slug={slug} />;
  }

  await connection();
  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();
  return <PublicPage course={course} slug={slug} />;
}
