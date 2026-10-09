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
import {
  defaultOnboardingFieldSettings,
  isOnboardingAudience,
  isOnboardingFieldKey,
  type OnboardingAudience,
} from "@/lib/onboarding-fields";

const learningModes = {
  Online: "ONLINE",
  "Physical (on-site)": "ONSITE",
  "Physical (private)": "ONSITE",
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

function readOptionalText(
  answers: Record<string, string>,
  key: string,
  maxLength: number,
) {
  const value = answers[key];
  if (value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= maxLength ? trimmed : undefined;
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

  const db = getPrismaClient();
  const config = await db.applicationConfig.findUnique({
    where: { id: 1 },
    select: { scholarshipsEnabled: true },
  });
  const scholarshipsEnabled = config?.scholarshipsEnabled ?? true;
  const storedSettings = await db.onboardingFieldSetting.findMany();
  const fieldSettings = defaultOnboardingFieldSettings().map((setting) => {
    const stored = storedSettings.find((candidate) => candidate.fieldKey === setting.fieldKey);
    return stored
      ? {
          fieldKey: setting.fieldKey,
          audiences: stored.audiences.filter(isOnboardingAudience),
        }
      : setting;
  });
  const requestedSupportType = readRequiredText(answers, "supportType", 80);
  const supportType = scholarshipsEnabled
    ? requestedSupportType ?? ""
    : requestedSupportType === "I have a promo code"
      ? requestedSupportType
      : "SELF_FUNDED";
  const audience: OnboardingAudience =
    supportType === "I'm here for the free tech bootcamp"
      ? "SCHOLARSHIP"
      : supportType === "I have a promo code"
        ? "PROMO"
        : "REGULAR";
  const fieldEnabled = (key: string) =>
    isOnboardingFieldKey(key) &&
    fieldSettings.some(
      (setting) =>
        setting.fieldKey === key && setting.audiences.includes(audience),
    );
  const firstName = readRequiredText(answers, "firstName", 80);
  const lastName = readRequiredText(answers, "lastName", 80);
  const email = readRequiredText(answers, "email", 254)?.toLowerCase();
  const phoneInput = readRequiredText(answers, "phone", 32);
  const phoneCountry = readRequiredText(answers, "phoneCountry", 2);
  const phone =
    phoneInput && phoneCountry
      ? normalizeWhatsAppNumber(phoneInput, phoneCountry)
      : null;
  const gender = fieldEnabled("gender")
    ? readRequiredText(answers, "gender", 80)
    : null;
  const country = fieldEnabled("country")
    ? readRequiredText(answers, "country", 80)
    : null;
  const otherCountry = readRequiredText(answers, "otherCountry", 80);
  const location = fieldEnabled("location")
    ? readRequiredText(answers, "location", 120)
    : null;
  const employmentStatus = fieldEnabled("status")
    ? readRequiredText(answers, "status", 120)
    : null;
  const educationLevel = fieldEnabled("education")
    ? readRequiredText(answers, "education", 120)
    : null;
  const courseName = readRequiredText(answers, "course", 120);
  const techExperience = fieldEnabled("experience")
    ? readRequiredText(answers, "experience", 120)
    : null;
  const scholarshipPath =
    supportType === "I'm here for the free tech bootcamp";
  const mentorshipPath =
    supportType === "I want specialized training and mentorship";
  const promoPath = supportType === "I have a promo code";
  const regularRegistration =
    supportType === "I want to register for a course" ||
    supportType === "SELF_FUNDED" ||
    promoPath;
  const scholarshipName = scholarshipPath
    ? readRequiredText(answers, "scholarship", 200)
    : null;
  const learningModeInput = fieldEnabled("learningMode")
    ? answers.learningMode
    : "Online";
  const learningMode = isLearningMode(learningModeInput)
    ? learningModes[learningModeInput]
    : null;
  const cohortId = fieldEnabled("startDate") || scholarshipPath
    ? readOptionalText(answers, "startDate", 36)
    : null;
  const promoCode = promoPath
    ? readRequiredText(answers, "promoCode", 80)?.toUpperCase()
    : null;
  const completionRequiredFields = fieldSettings
    .filter((setting) => !setting.audiences.includes(audience))
    .map((setting) => setting.fieldKey)
    .filter(
      (key) =>
        !["specializedFocus", "specializedGoal", "mentorSupport"].includes(key) ||
        mentorshipPath,
    )
    .filter((key) => key !== "otherCountry" || country === "Other");

  if (
    !firstName ||
    !lastName ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !phoneInput ||
    !phoneCountry ||
    (fieldEnabled("gender") && !gender) ||
    (fieldEnabled("country") && !country) ||
    (country === "Other" &&
      fieldEnabled("otherCountry") &&
      !otherCountry) ||
    (fieldEnabled("location") && !location) ||
    (fieldEnabled("status") && !employmentStatus) ||
    (fieldEnabled("education") && !educationLevel) ||
    !courseName ||
    (fieldEnabled("experience") && !techExperience) ||
    (fieldEnabled("specializedFocus") &&
      !readRequiredText(answers, "specializedFocus", 300)) ||
    (fieldEnabled("specializedGoal") &&
      !readRequiredText(answers, "specializedGoal", 500)) ||
    (fieldEnabled("mentorSupport") &&
      !readRequiredText(answers, "mentorSupport", 300)) ||
    (scholarshipsEnabled &&
      ![
        "I'm here for the free tech bootcamp",
        "I want to register for a course",
        "I want specialized training and mentorship",
        "I have a promo code",
      ].includes(supportType)) ||
    (!scholarshipsEnabled && promoPath && !promoCode) ||
    (scholarshipPath && (!scholarshipName || !scholarshipsEnabled)) ||
    (mentorshipPath && !scholarshipsEnabled) ||
    (!regularRegistration && !scholarshipPath && !mentorshipPath) ||
    !learningMode ||
    cohortId === undefined ||
    (cohortId !== null && !/^[0-9a-f-]{36}$/i.test(cohortId)) ||
    (scholarshipPath && !cohortId) ||
    (fieldEnabled("jobSupport") &&
      !["Yes, definitely", "Not at the moment"].includes(answers.jobSupport)) ||
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
      message: "Enter a valid WhatsApp number for the selected country calling code.",
    };
  }

  const existingApplication = await db.scholarshipApplication.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingApplication) {
    return {
      success: false,
      message: "An application has already been submitted with this email address.",
    };
  }

  const course = await db.course.findFirst({
    where: {
      title: { equals: courseName, mode: "insensitive" },
      status: CourseStatus.PUBLISHED,
    },
    select: { id: true, freeBootcampEnabled: true },
  });
  if (!course) {
    return {
      success: false,
      message: "That course is no longer available. Refresh and choose an active course.",
    };
  }
  if (scholarshipPath && !course.freeBootcampEnabled) {
    return {
      success: false,
      message: "That course is no longer available for the Free Tech Bootcamp. Refresh and choose an eligible course.",
    };
  }

  const cohort = cohortId
    ? await db.cohort.findFirst({
        where: {
          id: cohortId,
          courseId: course.id,
          status: CohortStatus.OPEN,
          startsAt: { gt: new Date() },
        },
        select: {
          id: true,
          startsAt: true,
          seatLimit: true,
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
      })
    : null;
  if (
    cohortId &&
    (!cohort ||
      (cohort.seatLimit !== null &&
        cohort._count.applications >= cohort.seatLimit))
  ) {
    return {
      success: false,
      message: "That cohort is no longer available or has reached capacity. Refresh and choose another option.",
    };
  }
  if (scholarshipPath && !cohort) {
    return {
      success: false,
      message: "Scholarship applications require an open cohort with seats remaining. Choose an eligible course and cohort.",
    };
  }

  const promo = promoPath && promoCode
    ? await db.promoCampaign.findFirst({
        where: {
          code: { equals: promoCode, mode: "insensitive" },
          status: "ACTIVE",
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
        select: {
          id: true,
          courseId: true,
          redemptionLimit: true,
          _count: { select: { redemptions: true } },
        },
      })
    : null;
  if (
    promoPath &&
    (!promo ||
      (promo.courseId !== null && promo.courseId !== course.id) ||
      (promo.redemptionLimit !== null &&
        promo._count.redemptions >= promo.redemptionLimit))
  ) {
    return {
      success: false,
      message: "That promo code is no longer available for this course. Check the code or choose another course.",
    };
  }

  const scholarship = scholarshipName
    ? await db.scholarship.findFirst({
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
    scholarshipPath && (!scholarshipsEnabled || !scholarship)
  ) {
    return {
      success: false,
      message: "That scholarship is no longer available. Refresh and choose an active offer.",
    };
  }

  try {
    await db.scholarshipApplication.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        gender: gender ?? "Not provided",
        country: country ?? "Not provided",
        otherCountry:
          country === "Other"
            ? otherCountry
            : null,
        location: location ?? "Not provided",
        employmentStatus: employmentStatus ?? "Not provided",
        educationLevel: educationLevel ?? "Not provided",
        scholarshipInterest: scholarshipPath,
        supportType: scholarshipPath
          ? ApplicationSupportType.SCHOLARSHIP
          : mentorshipPath
            ? ApplicationSupportType.SPECIALIZED_MENTORSHIP
            : promoPath
              ? ApplicationSupportType.PROMO
              : ApplicationSupportType.SELF_FUNDED,
        specializedFocus: fieldEnabled("specializedFocus")
          ? readOptionalText(answers, "specializedFocus", 300)
          : null,
        specializedGoal: fieldEnabled("specializedGoal")
          ? readOptionalText(answers, "specializedGoal", 500)
          : null,
        mentorSupport: fieldEnabled("mentorSupport")
          ? readOptionalText(answers, "mentorSupport", 300)
          : null,
        promoCode: promoCode ?? null,
        scholarshipId: scholarship?.id ?? null,
        scholarshipName,
        scholarshipPercent: scholarship?.tuitionPercent ?? null,
        scholarshipAmount: scholarship?.amount ?? null,
        scholarshipCurrency: scholarship?.currency ?? null,
        cohortId: cohort?.id ?? null,
        courseId: course.id,
        courseName,
        learningMode: learningMode ?? "ONLINE",
        preferredStartDate: cohort
          ? new Date(
              Date.UTC(
                cohort.startsAt.getUTCFullYear(),
                cohort.startsAt.getUTCMonth(),
                cohort.startsAt.getUTCDate(),
              ),
            )
          : null,
        techExperience: techExperience ?? "Not provided",
        jobPlacementSupport:
          fieldEnabled("jobSupport") && answers.jobSupport === "Yes, definitely",
        promoCampaignId: promo?.id ?? null,
        completionRequiredFields,
        termsAcceptedAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "An application has already been submitted with this email address.",
      };
    }

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
