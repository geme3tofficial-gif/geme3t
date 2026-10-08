"use server";

import {
  ApplicationSupportType,
  CohortStatus,
  CourseStatus,
  Prisma,
  ScholarshipStatus,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { normalizeWhatsAppNumber } from "@/lib/phone";

const learningModes = {
  Online: "ONLINE",
  "Physical (on-site)": "ONSITE",
  "Hybrid (both online & physical)": "HYBRID",
} as const;

function isLearningMode(value: string): value is keyof typeof learningModes {
  return Object.hasOwn(learningModes, value);
}

function readRequiredText(
  answers: Record<string, string>,
  key: string,
  maxLength: number,
) {
  const value = answers[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

export async function submitScholarshipApplication(
  answers: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return {
      success: false,
      message: "Check your answers and accept the terms before submitting.",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      message:
        "Your application was not saved. Configure Supabase and apply the database migrations before submitting.",
    };
  }

  const firstName = readRequiredText(answers, "firstName", 80);
  const lastName = readRequiredText(answers, "lastName", 80);
  const email = readRequiredText(answers, "email", 254)?.toLowerCase();
  const phoneInput = readRequiredText(answers, "phone", 32);
  const gender = readRequiredText(answers, "gender", 80);
  const country = readRequiredText(answers, "country", 80);
  const phone =
    phoneInput && country
      ? normalizeWhatsAppNumber(phoneInput, country)
      : null;
  const location = readRequiredText(answers, "location", 120);
  const employmentStatus = readRequiredText(answers, "status", 120);
  const educationLevel = readRequiredText(answers, "education", 120);
  const courseName = readRequiredText(answers, "course", 120);
  const techExperience = readRequiredText(answers, "experience", 120);
  const supportType = readRequiredText(answers, "supportType", 80);
  const scholarshipName =
    supportType === "I'm here for the free tech bootcamp"
      ? readRequiredText(answers, "scholarship", 200)
      : null;
  const specializedFocus =
    supportType === "I want specialized training and mentorship"
      ? readRequiredText(answers, "specializedFocus", 500)
      : null;
  const specializedGoal =
    supportType === "I want specialized training and mentorship"
      ? readRequiredText(answers, "specializedGoal", 1000)
      : null;
  const mentorSupport =
    supportType === "I want specialized training and mentorship"
      ? readRequiredText(answers, "mentorSupport", 120)
      : null;
  const learningMode = isLearningMode(answers.learningMode)
    ? learningModes[answers.learningMode]
    : null;
  const cohortId = readRequiredText(answers, "startDate", 36);

  if (
    !firstName ||
    !lastName ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !phoneInput ||
    !gender ||
    !country ||
    (country === "Other" && !readRequiredText(answers, "otherCountry", 80)) ||
    !location ||
    !employmentStatus ||
    !educationLevel ||
    !courseName ||
    !techExperience ||
    !supportType ||
    ![
      "I'm here for the free tech bootcamp",
      "I want specialized training and mentorship",
    ].includes(
      supportType,
    ) ||
    (supportType === "I'm here for the free tech bootcamp" &&
      !scholarshipName) ||
    (supportType === "I want specialized training and mentorship" &&
      (!specializedFocus || !specializedGoal || !mentorSupport)) ||
    !learningMode ||
    !cohortId ||
    !["Yes, definitely", "Not at the moment"].includes(answers.jobSupport) ||
    answers.terms !== "accepted"
  ) {
    return {
      success: false,
      message: "Check your answers and accept the terms before submitting.",
    };
  }

  if (!phone) {
    return {
      success: false,
      message:
        country === "Other"
          ? "Enter your WhatsApp number with its country code, such as +1234567890."
          : "Enter a valid WhatsApp number for your selected country.",
    };
  }

  const course = await getPrismaClient().course.findFirst({
    where: {
      title: { equals: courseName, mode: "insensitive" },
      status: CourseStatus.PUBLISHED,
    },
    select: { id: true },
  });
  if (!course) {
    return {
      success: false,
      message: "That course is no longer available. Refresh and choose an active course.",
    };
  }

  const cohort = await getPrismaClient().cohort.findFirst({
    where: {
      id: cohortId,
      courseId: course.id,
      status: CohortStatus.OPEN,
      startsAt: { gt: new Date() },
    },
    select: { id: true, startsAt: true },
  });
  if (!cohort) {
    return {
      success: false,
      message: "That cohort is no longer available. Refresh and select an open cohort.",
    };
  }

  const scholarship = scholarshipName
    ? await getPrismaClient().scholarship.findFirst({
        where: {
          name: scholarshipName,
          status: ScholarshipStatus.ACTIVE,
        },
        select: {
          id: true,
          tuitionPercent: true,
          amount: true,
          currency: true,
        },
      })
    : null;
  if (
    supportType === "I'm here for the free tech bootcamp" &&
    !scholarship
  ) {
    return {
      success: false,
      message: "That scholarship is no longer available. Refresh and choose an active offer.",
    };
  }

  try {
    await getPrismaClient().scholarshipApplication.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        gender,
        country,
        otherCountry:
          country === "Other"
            ? readRequiredText(answers, "otherCountry", 80)
            : null,
        location,
        employmentStatus,
        educationLevel,
        scholarshipInterest:
          supportType === "I'm here for the free tech bootcamp",
        supportType:
          supportType === "I'm here for the free tech bootcamp"
            ? ApplicationSupportType.SCHOLARSHIP
            : ApplicationSupportType.SPECIALIZED_MENTORSHIP,
        specializedFocus,
        specializedGoal,
        mentorSupport,
        scholarshipId: scholarship?.id ?? null,
        scholarshipName,
        scholarshipPercent: scholarship?.tuitionPercent ?? null,
        scholarshipAmount: scholarship?.amount ?? null,
        scholarshipCurrency: scholarship?.currency ?? null,
        cohortId: cohort.id,
        courseId: course.id,
        courseName,
        learningMode,
        preferredStartDate: new Date(
          Date.UTC(
            cohort.startsAt.getUTCFullYear(),
            cohort.startsAt.getUTCMonth(),
            cohort.startsAt.getUTCDate(),
          ),
        ),
        techExperience,
        jobPlacementSupport: answers.jobSupport === "Yes, definitely",
        termsAcceptedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error("Scholarship application database connection failed.");
      return {
        success: false,
        message: "Your application was not saved because the database is unavailable.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Scholarship application database request failed.", {
        code: error.code,
      });
      return {
        success: false,
        message:
          "Your application was not saved. Check that the database migrations have been applied.",
      };
    }

    throw error;
  }

  return {
    success: true,
    message: "Your application was submitted successfully.",
  };
}
