import "server-only";

import { CourseStatus } from "@prisma/client";
import type { Course } from "@/lib/site-data";
import { getPrismaClient } from "@/lib/prisma";

function toCourse(course: {
  slug: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string | null;
  durationWeeks: number;
  modules?: Course["modules"];
}): Course {
  return {
    slug: course.slug,
    title: course.title,
    category: course.category,
    description: course.description,
    image: course.imageUrl ?? "/images/banner.png",
    duration: `${course.durationWeeks} weeks`,
    ...(course.modules ? { modules: course.modules } : {}),
  };
}

export async function getPublishedCourses(): Promise<Course[]> {
  const courses = await getPrismaClient().course.findMany({
    where: { status: CourseStatus.PUBLISHED },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: {
      slug: true,
      title: true,
      category: true,
      description: true,
      imageUrl: true,
      durationWeeks: true,
    },
  });

  return courses.map(toCourse);
}

export async function getPublishedCourseBySlug(slug: string) {
  const course = await getPrismaClient().course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    select: {
      slug: true,
      title: true,
      category: true,
      description: true,
      imageUrl: true,
      durationWeeks: true,
      modules: {
        where: { lessons: { some: { isPublished: true } } },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          sortOrder: true,
          lessons: {
            where: { isPublished: true },
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

  return course ? toCourse(course) : null;
}
