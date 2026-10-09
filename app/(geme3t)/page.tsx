import { connection } from "next/server";
import { HomePage } from "@/components/geme3t/page-sections";
import { getPublishedCourses } from "@/lib/course-data";
import { getPrismaClient } from "@/lib/prisma";

export default async function Home() {
  await connection();
  const [courses, config] = await Promise.all([
    getPublishedCourses(),
    getPrismaClient().applicationConfig.findUnique({
      where: { id: 1 },
      select: { scholarshipsEnabled: true },
    }),
  ]);
  return (
    <HomePage
      courses={courses}
      scholarshipsEnabled={config?.scholarshipsEnabled ?? true}
    />
  );
}
