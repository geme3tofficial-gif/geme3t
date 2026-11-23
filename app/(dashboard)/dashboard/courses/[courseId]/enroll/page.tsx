import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ApplicationStatus,
  CohortStatus,
  CourseStatus,
  EnrollmentStatus,
} from "@prisma/client";
import { getLearnerSession } from "@/lib/learner-auth";
import { getPrismaClient } from "@/lib/prisma";
import { enrollInCourse } from "../../actions";

export const metadata: Metadata = {
  title: "Enroll in a course",
};

const notices: Record<string, string> = {
  invalid: "Select an open cohort and confirm your enrollment.",
  unavailable: "This course is no longer published.",
  "already-enrolled": "You are already enrolled in this course.",
  "application-on-file":
    "An application for this course is already on file. You do not need to enroll again.",
  "cohort-unavailable":
    "That cohort is no longer open. Choose another available cohort.",
  "cohort-full":
    "That cohort has reached capacity. Choose another available cohort.",
};

function formatDate(date: Date) {
  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(date) + " UTC"
  );
}

export default async function EnrollInCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  await connection();
  const session = await getLearnerSession();
  if (!session) redirect("/dashboard/sign-in");
  if (session.profile?.role === "ADMIN") redirect("/admin");
  if (session.profile?.role === "TEACHER") redirect("/teacher");
  if (session.profile?.role !== "STUDENT") redirect("/dashboard");

  const { courseId } = await params;
  const db = getPrismaClient();
  const course = await db.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED },
    select: {
      id: true,
      title: true,
      category: true,
      description: true,
      imageUrl: true,
    },
  });
  if (!course) notFound();

  const now = new Date();
  const [cohorts, enrollment, application, query] = await Promise.all([
    db.cohort.findMany({
      where: {
        courseId: course.id,
        status: CohortStatus.OPEN,
        startsAt: { gt: now },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        name: true,
        startsAt: true,
        learningMode: true,
        seatLimit: true,
        _count: {
          select: {
            applications: {
              where: {
                status: {
                  in: [
                    ApplicationStatus.SUBMITTED,
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.ACCEPTED,
                  ],
                },
              },
            },
            enrollments: {
              where: {
                applicationId: null,
                status: {
                  in: [
                    EnrollmentStatus.PENDING,
                    EnrollmentStatus.ACTIVE,
                    EnrollmentStatus.COMPLETED,
                  ],
                },
              },
            },
          },
        },
      },
    }),
    db.enrollment.findFirst({
      where: {
        learnerId: session.user.id,
        courseId: course.id,
        status: { not: EnrollmentStatus.WITHDRAWN },
      },
      select: { status: true },
    }),
    db.scholarshipApplication.findFirst({
      where: {
        applicantId: session.user.id,
        courseId: course.id,
        status: {
          notIn: [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
        },
      },
      select: { status: true, completionRequiredFields: true },
    }),
    searchParams,
  ]);
  const availableCohorts = cohorts.filter(
    (cohort) =>
      cohort.seatLimit === null ||
      cohort._count.applications + cohort._count.enrollments <
        cohort.seatLimit,
  );
  const notice = query.notice ? notices[query.notice] : null;

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Learner workspace</span>
          <h1>Enroll in a course</h1>
          <p>Select a future cohort to add this course to your learning.</p>
        </div>
        <Link className="text-link" href="/dashboard/courses">
          Back to available courses
        </Link>
      </div>
      {notice ? (
        <p className="admin-form-error" role="alert">
          {notice}
        </p>
      ) : null}
      <section className="dashboard-panel student-course-card">
        <div className="student-course-card-image">
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 720px) 100vw, 280px"
            src={course.imageUrl || "/images/HERO-PIC.png"}
          />
        </div>
        <div className="student-course-card-body">
          <span className="eyebrow">{course.category}</span>
          <h2>{course.title}</h2>
          <p>{course.description}</p>

          {enrollment ? (
            <p>
              {enrollment.status === EnrollmentStatus.ACTIVE ||
              enrollment.status === EnrollmentStatus.COMPLETED
                ? "You are enrolled in this course."
                : "Your enrollment is pending."}
            </p>
          ) : application ? (
            <p>
              An application for this course is already on file (
              {application.status.toLowerCase().replaceAll("_", " ")}).
            </p>
          ) : availableCohorts.length === 0 ? (
            <p>No future cohorts with available seats are open for enrollment.</p>
          ) : (
            <form action={enrollInCourse} className="learner-completion-form">
              <input name="courseId" type="hidden" value={course.id} />
              <label className="learner-completion-field" htmlFor="cohortId">
                <span>Choose a cohort</span>
                <select id="cohortId" name="cohortId" required defaultValue="">
                  <option disabled value="">
                    Select an open cohort
                  </option>
                  {availableCohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name} · {formatDate(cohort.startsAt)} ·{" "}
                      {cohort.learningMode.toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="application-terms">
                <input
                  name="confirmEnrollment"
                  required
                  type="checkbox"
                  value="yes"
                />
                <span>I confirm that I want to enroll in this course and cohort.</span>
              </label>
              <button className="button button--small" type="submit">
                Confirm enrollment
              </button>
            </form>
          )}

          {enrollment &&
          (enrollment.status === EnrollmentStatus.ACTIVE ||
            enrollment.status === EnrollmentStatus.COMPLETED) ? (
            <Link className="button button--small" href="/dashboard/learning">
              Go to my learning
            </Link>
          ) : null}
          {application ? (
            <Link
              className="text-link"
              href={
                application.completionRequiredFields.length > 0
                  ? "/dashboard"
                  : "/dashboard/learning"
              }
            >
              {application.completionRequiredFields.length > 0
                ? "Complete your learner profile"
                : "View your existing course access"}
            </Link>
          ) : null}
        </div>
      </section>
    </>
  );
}
