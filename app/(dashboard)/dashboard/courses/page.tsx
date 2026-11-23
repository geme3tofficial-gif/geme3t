import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ApplicationStatus,
  CourseStatus,
  EnrollmentStatus,
} from "@prisma/client";
import { getLearnerSession } from "@/lib/learner-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Available courses",
};

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await connection();
  const session = await getLearnerSession();
  if (!session) redirect("/dashboard/sign-in");
  if (session.profile?.role === "ADMIN") redirect("/admin");
  if (session.profile?.role === "TEACHER") redirect("/teacher");

  const db = getPrismaClient();
  const courses = await db.course.findMany({
    where: { status: CourseStatus.PUBLISHED },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      description: true,
      imageUrl: true,
      durationWeeks: true,
      _count: { select: { modules: true } },
    },
  });
  const courseIds = courses.map((course) => course.id);
  const [enrollments, applications] = courseIds.length
    ? await Promise.all([
        db.enrollment.findMany({
          where: {
            learnerId: session.user.id,
            courseId: { in: courseIds },
            status: { not: EnrollmentStatus.WITHDRAWN },
          },
          orderBy: { enrolledAt: "desc" },
          select: { courseId: true, status: true },
        }),
        db.scholarshipApplication.findMany({
          where: {
            applicantId: session.user.id,
            courseId: { in: courseIds },
            status: {
              notIn: [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
            },
          },
          orderBy: { submittedAt: "desc" },
          select: { courseId: true, status: true },
        }),
      ])
    : [[], []];
  const enrollmentByCourse = new Map(
    enrollments
      .slice()
      .reverse()
      .map((enrollment) => [enrollment.courseId, enrollment]),
  );
  const applicationByCourse = new Map(
    applications
      .slice()
      .reverse()
      .map((application) => [application.courseId, application]),
  );
  const query = await searchParams;

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Learner workspace</span>
          <h1>Available courses</h1>
          <p>Explore every course published by the academy.</p>
        </div>
      </div>
      {query.notice === "enrolled" ? (
        <p className="admin-form-notice" role="status">
          You are enrolled. Your new course is available in My learning.
        </p>
      ) : null}
      {courses.length === 0 ? (
        <section className="dashboard-panel">
          <p className="campaign-empty">
            There are no published courses available right now.
          </p>
        </section>
      ) : (
        <section aria-label="Published courses" className="dashboard-panel student-course-catalogue">
          {courses.map((course) => (
            <article className="student-course-card" key={course.id}>
              <div className="student-course-card-image">
                <Image
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 280px"
                  src={course.imageUrl || "/images/HERO-PIC.png"}
                />
              </div>
              <div className="student-course-card-body">
                <span className="eyebrow">{course.category}</span>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                <span className="student-course-card-meta">
                  {course.durationWeeks} weeks · {course._count.modules} modules
                </span>
                <div className="course-editor-heading-links">
                  <Link className="text-link" href={`/${course.slug}`}>
                    Course details
                  </Link>
                  {(() => {
                    const enrollment = enrollmentByCourse.get(course.id);
                    if (
                      enrollment?.status === EnrollmentStatus.ACTIVE ||
                      enrollment?.status === EnrollmentStatus.COMPLETED
                    ) {
                      return (
                        <Link
                          className="button button--small"
                          href="/dashboard/learning"
                        >
                          Go to my learning
                        </Link>
                      );
                    }
                    if (enrollment) {
                      return (
                        <Link
                          className="text-link"
                          href={`/dashboard/courses/${course.id}/enroll`}
                        >
                          Enrollment pending
                        </Link>
                      );
                    }
                    if (applicationByCourse.has(course.id)) {
                      return (
                        <Link
                          className="text-link"
                          href={`/dashboard/courses/${course.id}/enroll`}
                        >
                          Application on file
                        </Link>
                      );
                    }
                    return (
                      <Link
                        className="button button--small"
                        href={`/dashboard/courses/${course.id}/enroll`}
                      >
                        Enroll in this course
                      </Link>
                    );
                  })()}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
