import { connection } from "next/server";
import { HomePage } from "@/components/geme3t/page-sections";
import { getPublishedCourses } from "@/lib/course-data";

export default async function Home() {
  await connection();
  const courses = await getPublishedCourses();
  return <HomePage courses={courses} />;
}
