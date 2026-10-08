"use server";

import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

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
  const phone = readRequiredText(answers, "phone", 32);
  const gender = readRequiredText(answers, "gender", 80);
  const country = readRequiredText(answers, "country", 80);
  const location = readRequiredText(answers, "location", 120);
  const employmentStatus = readRequiredText(answers, "status", 120);
  const educationLevel = readRequiredText(answers, "education", 120);
  const courseName = readRequiredText(answers, "course", 120);
  const techExperience = readRequiredText(answers, "experience", 120);
  const scholarshipInterest = readRequiredText(
    answers,
    "scholarshipInterest",
    120,
  );
  const scholarshipName =
    scholarshipInterest === "I'm here for the free tech bootcamp"
      ? readRequiredText(answers, "scholarship", 200)
      : null;
  const learningMode = isLearningMode(answers.learningMode)
    ? learningModes[answers.learningMode]
    : null;
  const startDate = readRequiredText(answers, "startDate", 80);
  const preferredStartDate = startDate ? new Date(startDate) : null;
  const hasValidStartDate =
    preferredStartDate !== null &&
    Number.isFinite(preferredStartDate.getTime());

  if (
    !firstName ||
    !lastName ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !phone ||
    !gender ||
    !country ||
    (country === "Other" && !readRequiredText(answers, "otherCountry", 80)) ||
    !location ||
    !employmentStatus ||
    !educationLevel ||
    !courseName ||
    !techExperience ||
    !scholarshipInterest ||
    !["I'm here for the free tech bootcamp", "I want to self-fund my tuition"].includes(
      scholarshipInterest,
    ) ||
    (scholarshipInterest === "I'm here for the free tech bootcamp" &&
      !scholarshipName) ||
    !learningMode ||
    !hasValidStartDate ||
    !["Yes, definitely", "Not at the moment"].includes(answers.jobSupport) ||
    answers.terms !== "accepted"
  ) {
    return {
      success: false,
      message: "Check your answers and accept the terms before submitting.",
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
          scholarshipInterest === "I'm here for the free tech bootcamp",
        scholarshipName,
        courseName,
        learningMode,
        preferredStartDate,
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
