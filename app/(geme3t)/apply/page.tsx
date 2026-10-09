import type { Metadata } from "next";
import { connection } from "next/server";
import { ScholarshipApplication } from "@/components/geme3t/scholarship-application";
import { getActiveScholarshipOptions } from "@/lib/scholarship-data";
import { CohortStatus, CourseStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import {
  defaultOnboardingFieldSettings,
  isOnboardingAudience,
  isOnboardingFieldKey,
} from "@/lib/onboarding-fields";

export const metadata: Metadata = {
  title: "Enroll with GEME3T Academy",
  description:
    "Choose a GEME3T Academy course and take your next step in technology.",
};

export default async function ApplyPage() {
  await connection();
  const now = new Date();
  const [courses, scholarshipOffers, config, cohorts, fieldRows, promoCampaigns] = await Promise.all([
    getPrismaClient().course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: { id: true, title: true, freeBootcampEnabled: true },
    }),
    getActiveScholarshipOptions(),
    getPrismaClient().applicationConfig.findUnique({
      where: { id: 1 },
      select: { scholarshipsEnabled: true },
    }),
    getPrismaClient().cohort.findMany({
      where: {
        status: CohortStatus.OPEN,
        startsAt: { gt: new Date() },
        course: { status: CourseStatus.PUBLISHED },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        name: true,
        courseId: true,
        startsAt: true,
        seatLimit: true,
        course: { select: { title: true } },
        _count: {
          select: {
            applications: {
              where: {
                status: {
                  in: ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED"],
                },
              },
            },
          },
        },
      },
    }),
    getPrismaClient().onboardingFieldSetting.findMany(),
    getPrismaClient().promoCampaign.findMany({
      where: {
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        discountPercent: true,
        course: { select: { title: true } },
        redemptionLimit: true,
        _count: { select: { redemptions: true } },
      },
    }),
  ]);

  const availableCohorts = cohorts.filter(
    (cohort) =>
      cohort.seatLimit === null ||
      cohort._count.applications < cohort.seatLimit,
  );
  const scholarshipCourseIds = new Set(
    availableCohorts.map((cohort) => cohort.courseId),
  );
  const scholarshipsEnabled = config?.scholarshipsEnabled ?? true;
  const fieldSettings =
    fieldRows.length > 0
      ? fieldRows.flatMap(({ fieldKey, audiences }) =>
          isOnboardingFieldKey(fieldKey)
            ? [{
                fieldKey,
                audiences: audiences.filter(isOnboardingAudience),
              }]
            : [],
        )
      : defaultOnboardingFieldSettings();
  const activePromoOptions = promoCampaigns
    .filter(
      (campaign) =>
        campaign.redemptionLimit === null ||
        campaign._count.redemptions < campaign.redemptionLimit,
    )
    .map((campaign) => ({
      value: campaign.code,
      courseTitle: campaign.course?.title ?? null,
      discountPercent: campaign.discountPercent,
    }));

  return (
    <ScholarshipApplication
      courseOptions={courses.map((course) => course.title)}
      scholarshipCourseOptions={courses
        .filter(
          (course) =>
            course.freeBootcampEnabled && scholarshipCourseIds.has(course.id),
        )
        .map((course) => course.title)}
      scholarshipsEnabled={scholarshipsEnabled}
      scholarshipOptions={scholarshipsEnabled ? scholarshipOffers : []}
      promoOptions={activePromoOptions}
      fieldSettings={fieldSettings}
      cohortOptions={availableCohorts.map((cohort) => ({
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
