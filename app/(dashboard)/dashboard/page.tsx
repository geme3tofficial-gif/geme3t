import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LearnerCompletionForm } from "./learner-completion-form";
import { getLearnerSession } from "@/lib/learner-auth";
import {
  isOnboardingFieldKey,
  onboardingFieldDefinitions,
  type OnboardingFieldKey,
} from "@/lib/onboarding-fields";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Student dashboard",
};

export default async function DashboardPage() {
  await connection();
  const session = await getLearnerSession();
  if (!session) redirect("/dashboard/sign-in");
  if (session.profile?.role === "ADMIN") redirect("/admin");
  if (session.profile?.role === "TEACHER") redirect("/teacher");

  const application = session.profile?.applications[0];
  if (!application) redirect("/dashboard/sign-in?error=application-required");

  const missingKeys = application.completionRequiredFields.filter(
    (key): key is OnboardingFieldKey => isOnboardingFieldKey(key),
  );
  const fields = onboardingFieldDefinitions.filter(
    (field) =>
      missingKeys.includes(field.key) ||
      (field.key === "otherCountry" && missingKeys.includes("country")),
  );
  const cohorts = missingKeys.includes("startDate") && application.courseId
    ? await getPrismaClient().cohort.findMany({
        where: {
          courseId: application.courseId,
          status: "OPEN",
          startsAt: { gt: new Date() },
        },
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          name: true,
          startsAt: true,
          seatLimit: true,
          _count: {
            select: {
              applications: {
                where: {
                  status: { in: ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED"] },
                },
              },
            },
          },
        },
      })
    : [];
  const cohortOptions = cohorts
    .filter(
      (cohort) =>
        cohort.seatLimit === null ||
        cohort._count.applications < cohort.seatLimit,
    )
    .map((cohort) => ({
      id: cohort.id,
      label: `${cohort.name} · ${new Intl.DateTimeFormat("en", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(cohort.startsAt)} UTC`,
    }));
  const initialValues: Partial<Record<OnboardingFieldKey, string>> = {
    gender: application.gender === "Not provided" ? "" : application.gender,
    country: application.country === "Not provided" ? "" : application.country,
    otherCountry: application.otherCountry ?? "",
    location: application.location === "Not provided" ? "" : application.location,
    status:
      application.employmentStatus === "Not provided"
        ? ""
        : application.employmentStatus,
    education:
      application.educationLevel === "Not provided"
        ? ""
        : application.educationLevel,
    learningMode:
      missingKeys.includes("learningMode")
        ? ""
        : application.learningMode === "ONLINE"
        ? "Online"
        : application.learningMode === "ONSITE"
          ? "Physical (on-site)"
          : "Hybrid (both online & physical)",
    startDate: application.cohortId ?? "",
    experience:
      application.techExperience === "Not provided"
        ? ""
        : application.techExperience,
    jobSupport: missingKeys.includes("jobSupport")
      ? ""
      : application.jobPlacementSupport
        ? "Yes, definitely"
        : "Not at the moment",
    specializedFocus: application.specializedFocus ?? "",
    specializedGoal: application.specializedGoal ?? "",
    mentorSupport: application.mentorSupport ?? "",
  };

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Learner workspace</span>
          <h1>Welcome, {application.firstName}</h1>
          <p>
            Your learner profile and enrollment details are ready to manage
            here.
          </p>
        </div>
        <Link className="button button--small" href="/courses">
          Explore courses
        </Link>
      </div>

      <section className="dashboard-panel learner-enrollment-panel">
        <h2>Your enrollment</h2>
        <div className="dashboard-course">
          <div className="dashboard-course-thumb">
            {application.courseId ? (
              <Image
                alt=""
                fill
                sizes="64px"
                src={application.course?.imageUrl || "/images/HERO-PIC.png"}
              />
            ) : null}
          </div>
          <div>
            <h3>{application.courseName}</h3>
            <p>{application.email} · {application.phone}</p>
          </div>
          <span className="progress-value">
            {missingKeys.length === 0 ? "Profile complete" : "Profile incomplete"}
          </span>
        </div>
      </section>

      {missingKeys.length > 0 ? (
        <section className="dashboard-panel learner-completion-panel">
          <span className="eyebrow">One more step</span>
          <h2>Complete your learner profile</h2>
          <p>
            Fill in the profile details that were skipped during enrollment.
            The learning portal will unlock once these required details are
            saved.
          </p>
          <LearnerCompletionForm
            cohorts={cohortOptions}
            fields={fields}
            initialValues={initialValues}
          />
        </section>
      ) : (
        <section className="dashboard-panel learner-access-panel">
          <span className="eyebrow">You’re ready</span>
          <h2>Your learner profile is complete</h2>
          <p>You can now continue to the GEME3T learning portal.</p>
          <Link className="button button--small" href="/lms-redirect">
            Open learning portal <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}
    </>
  );
}
