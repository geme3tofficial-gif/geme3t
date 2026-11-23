"use server";

import {
  ApplicationStatus,
  CohortStatus,
  CourseStatus,
  EnrollmentStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLearnerSession } from "@/lib/learner-auth";
import { getPrismaClient } from "@/lib/prisma";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function enrollInCourse(formData: FormData): Promise<never> {
  const session = await getLearnerSession();
  if (!session) redirect("/dashboard/sign-in");
  if (session.profile?.role !== "STUDENT") redirect("/dashboard");

  const courseId = formData.get("courseId");
  const cohortId = formData.get("cohortId");
  if (
    typeof courseId !== "string" ||
    !uuidPattern.test(courseId) ||
    typeof cohortId !== "string" ||
    !uuidPattern.test(cohortId) ||
    formData.get("confirmEnrollment") !== "yes"
  ) {
    const returnPath =
      typeof courseId === "string" && uuidPattern.test(courseId)
        ? `/dashboard/courses/${courseId}/enroll?notice=invalid`
        : "/dashboard/courses";
    redirect(returnPath);
  }

  const db = getPrismaClient();
  const result = await db.$transaction(
    async (transaction) => {
      const course = await transaction.course.findFirst({
        where: { id: courseId, status: CourseStatus.PUBLISHED },
        select: { id: true },
      });
      if (!course) return "unavailable" as const;

      const existingEnrollment = await transaction.enrollment.findFirst({
        where: {
          learnerId: session.user.id,
          courseId,
          status: { not: EnrollmentStatus.WITHDRAWN },
        },
        select: { id: true },
      });
      if (existingEnrollment) return "already-enrolled" as const;

      const existingApplication =
        await transaction.scholarshipApplication.findFirst({
          where: {
            applicantId: session.user.id,
            courseId,
            status: {
              notIn: [
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN,
              ],
            },
          },
          select: { id: true },
        });
      if (existingApplication) return "application-on-file" as const;

      const cohort = await transaction.cohort.findFirst({
        where: {
          id: cohortId,
          courseId,
          status: CohortStatus.OPEN,
          startsAt: { gt: new Date() },
          course: { status: CourseStatus.PUBLISHED },
        },
        select: {
          id: true,
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
      });
      if (!cohort) return "cohort-unavailable" as const;
      if (
        cohort.seatLimit !== null &&
        cohort._count.applications + cohort._count.enrollments >=
          cohort.seatLimit
      ) {
        return "cohort-full" as const;
      }

      await transaction.enrollment.create({
        data: {
          learnerId: session.user.id,
          courseId,
          cohortId: cohort.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
      return "enrolled" as const;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (result === "enrolled") {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/learning");
    redirect("/dashboard/courses?notice=enrolled");
  }

  redirect(`/dashboard/courses/${courseId}/enroll?notice=${result}`);
}
