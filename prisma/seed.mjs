import {
  CourseStatus,
  PrismaClient,
  ScholarshipStatus,
} from "@prisma/client";
import catalog from "../lib/catalog-data.json" with { type: "json" };

const prisma = new PrismaClient();

async function main() {
  for (const course of catalog.courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        category: course.category,
        description: course.description,
        imageUrl: course.image,
        durationWeeks: course.durationWeeks,
        status: CourseStatus.PUBLISHED,
      },
      create: {
        slug: course.slug,
        title: course.title,
        category: course.category,
        description: course.description,
        imageUrl: course.image,
        durationWeeks: course.durationWeeks,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  for (const scholarship of catalog.scholarships) {
    await prisma.scholarship.upsert({
      where: { name: scholarship.name },
      update: {
        sponsor: scholarship.sponsor,
        tuitionPercent: scholarship.tuitionPercent,
        status: ScholarshipStatus.ACTIVE,
      },
      create: {
        ...scholarship,
        status: ScholarshipStatus.ACTIVE,
      },
    });
  }

  console.info(
    `Seeded ${catalog.courses.length} published courses and ${catalog.scholarships.length} active scholarships.`,
  );
}

main()
  .catch((error) => {
    console.error("Database seeding failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
