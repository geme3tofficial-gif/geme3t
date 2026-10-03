import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/site-data";

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="course-card">
      <Link
        aria-label={`Explore ${course.title}`}
        className="course-image"
        href={`/${course.slug}`}
      >
        <Image
          alt=""
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 1050px) 50vw, 33vw"
          src={course.image}
        />
      </Link>
      <div className="course-card-body">
        <span className="course-category">{course.category}</span>
        <h3>
          <Link href={`/${course.slug}`}>{course.title}</Link>
        </h3>
        <p>{course.description}</p>
        <Link className="text-link" href={`/${course.slug}`}>
          Explore programme <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
