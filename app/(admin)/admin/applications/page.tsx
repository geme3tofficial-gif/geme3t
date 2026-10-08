import type { Metadata } from "next";
import { ApplicationTable, type ApplicationRow } from "./application-table";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Scholarship applications",
};

export default async function AdminApplicationsPage() {
  await requireAdmin();
  const records = await getPrismaClient().scholarshipApplication.findMany({
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      gender: true,
      country: true,
      otherCountry: true,
      location: true,
      employmentStatus: true,
      educationLevel: true,
      scholarshipInterest: true,
      supportType: true,
      specializedFocus: true,
      specializedGoal: true,
      mentorSupport: true,
      scholarshipName: true,
      scholarship: {
        select: {
          name: true,
          sponsor: true,
          tuitionPercent: true,
          amount: true,
          currency: true,
        },
      },
      scholarshipPercent: true,
      scholarshipAmount: true,
      scholarshipCurrency: true,
      courseName: true,
      course: {
        select: { title: true, category: true, durationWeeks: true },
      },
      learningMode: true,
      cohort: { select: { name: true } },
      preferredStartDate: true,
      techExperience: true,
      jobPlacementSupport: true,
      termsAcceptedAt: true,
      status: true,
      submittedAt: true,
    },
  });

  const applications: ApplicationRow[] = records.map((record) => ({
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone,
    gender: record.gender,
    country: record.country,
    otherCountry: record.otherCountry,
    location: record.location,
    employmentStatus: record.employmentStatus,
    educationLevel: record.educationLevel,
    scholarshipInterest: record.scholarshipInterest,
    supportType: record.supportType,
    specializedFocus: record.specializedFocus,
    specializedGoal: record.specializedGoal,
    mentorSupport: record.mentorSupport,
    scholarshipName:
      record.scholarshipName ?? record.scholarship?.name ?? null,
    scholarshipSponsor: record.scholarship?.sponsor ?? null,
    scholarshipPercent:
      record.scholarshipPercent ?? record.scholarship?.tuitionPercent ?? null,
    scholarshipAmount:
      record.scholarshipAmount?.toString() ??
      record.scholarship?.amount?.toString() ??
      null,
    scholarshipCurrency:
      record.scholarshipCurrency ?? record.scholarship?.currency ?? null,
    courseName: record.course?.title ?? record.courseName,
    courseCategory: record.course?.category ?? null,
    courseDurationWeeks: record.course?.durationWeeks ?? null,
    learningMode: record.learningMode,
    cohortName: record.cohort?.name ?? null,
    preferredStartDate: record.preferredStartDate?.toISOString() ?? null,
    techExperience: record.techExperience,
    jobPlacementSupport: record.jobPlacementSupport,
    termsAcceptedAt: record.termsAcceptedAt.toISOString(),
    status: record.status,
    submittedAt: record.submittedAt.toISOString(),
  }));

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · admissions</span>
          <h1>Scholarship applications</h1>
          <p>Search, filter, and review new applications and each applicant’s selections.</p>
        </div>
      </div>
      <ApplicationTable applications={applications} />
    </>
  );
}
