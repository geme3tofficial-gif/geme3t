import type { Metadata } from "next";
import { connection } from "next/server";
import { ScholarshipApplication } from "@/components/geme3t/scholarship-application";
import { getPublishedCourses } from "@/lib/course-data";
import { getActiveScholarshipOptions } from "@/lib/scholarship-data";
import { CohortStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "GEME3T free tech bootcamp",
  description:
    "Apply for the GEME3T free tech bootcamp and be part of the generation that is transforming tomorrow .",
};

export default async function ApplyPage() {
  await connection();
  const [courses, scholarships, cohorts] = await Promise.all([
    getPublishedCourses(),
    getActiveScholarshipOptions(),
    getPrismaClient().cohort.findMany({
      where: {
        status: CohortStatus.OPEN,
        startsAt: { gt: new Date() },
        course: { status: "PUBLISHED" },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        name: true,
        startsAt: true,
        course: { select: { title: true } },
      },
    }),
  ]);

  return (
    <ScholarshipApplication
      courseOptions={courses.map((course) => course.title)}
      scholarshipOptions={scholarships}
      cohortOptions={cohorts.map((cohort) => ({
        value: cohort.id,
        courseTitle: cohort.course.title,
        label: `${cohort.name} · ${new Intl.DateTimeFormat("en", {
          dateStyle: "long",
          timeZone: "UTC",
        }).format(cohort.startsAt)} UTC`,
      }))}
    />
  );
}
