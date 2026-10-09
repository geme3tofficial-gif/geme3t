"use server";

import { LearningMode, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getLearnerSession } from "@/lib/learner-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  isOnboardingFieldKey,
  onboardingFieldDefinitions,
} from "@/lib/onboarding-fields";

export type CompletionState = {
  error: string | null;
  message: string | null;
};

const learningModes: Record<string, LearningMode> = {
  Online: "ONLINE",
  "Physical (on-site)": "ONSITE",
  "Physical (private)": "ONSITE",
  "Hybrid (both online & physical)": "HYBRID",
};

export async function completeLearnerProfile(
  _previousState: CompletionState,
  formData: FormData,
): Promise<CompletionState> {
  const session = await getLearnerSession();
  const application = session?.profile?.applications[0];
  if (!session || !application) {
    return {
      error: "Sign in with the email address used for your application.",
      message: null,
    };
  }

  const remaining = application.completionRequiredFields.filter(
    (key): key is (typeof onboardingFieldDefinitions)[number]["key"] =>
      isOnboardingFieldKey(key),
  );
  if (remaining.length === 0) {
    return { error: null, message: "Your profile is already complete." };
  }

  const submittedValues = new Map<string, string>();
  for (const key of remaining) {
    const value = formData.get(key);
    if (typeof value === "string") submittedValues.set(key, value.trim());
  }

  const countryValue = submittedValues.get("country") ?? application.country;
  const requiredKeys = new Set(remaining);
  if (countryValue === "Other") {
    requiredKeys.add("otherCountry");
    if (!submittedValues.has("otherCountry")) {
      const otherCountry = formData.get("otherCountry");
      if (typeof otherCountry === "string") {
        submittedValues.set("otherCountry", otherCountry.trim());
      }
    }
  }
  else requiredKeys.delete("otherCountry");

  const validatedValues = new Map<string, string>();
  for (const key of requiredKeys) {
    const value = submittedValues.get(key);
    if (!value) {
      return { error: "Complete each required profile field to continue.", message: null };
    }
    if (key === "startDate") {
      validatedValues.set(key, value);
      continue;
    }

    const definition = onboardingFieldDefinitions.find(
      (field) => field.key === key,
    );
    if (!definition || value.length > 1000) {
      return { error: "One of the submitted profile fields is invalid.", message: null };
    }
    if (definition.kind === "choice" && "options" in definition) {
      const allowed: readonly string[] = definition.options.map((option) =>
        typeof option === "string" ? option : option.value,
      );
      if (!allowed.includes(value)) {
        return { error: "Choose a valid option for each selection.", message: null };
      }
    }
    validatedValues.set(key, value);
  }

  const updateData: Prisma.ScholarshipApplicationUpdateInput = {};
  for (const [key, value] of validatedValues) {
    switch (key) {
      case "gender":
        updateData.gender = value;
        break;
      case "country":
        updateData.country = value;
        break;
      case "otherCountry":
        updateData.otherCountry = value;
        break;
      case "location":
        updateData.location = value;
        break;
      case "status":
        updateData.employmentStatus = value;
        break;
      case "education":
        updateData.educationLevel = value;
        break;
      case "learningMode":
        updateData.learningMode = learningModes[value];
        break;
      case "experience":
        updateData.techExperience = value;
        break;
      case "jobSupport":
        updateData.jobPlacementSupport = value === "Yes, definitely";
        break;
      case "specializedFocus":
        updateData.specializedFocus = value;
        break;
      case "specializedGoal":
        updateData.specializedGoal = value;
        break;
      case "mentorSupport":
        updateData.mentorSupport = value;
        break;
    }
  }

  if (validatedValues.has("country")) {
    updateData.otherCountry =
      countryValue === "Other"
        ? validatedValues.get("otherCountry") ?? application.otherCountry
        : null;
  }

  const unresolved = application.completionRequiredFields.filter(
    (key) =>
      !validatedValues.has(key) &&
      !(key === "otherCountry" && countryValue !== "Other"),
  );
  if (countryValue === "Other" && !validatedValues.has("otherCountry")) {
    unresolved.push("otherCountry");
  }

  const db = getPrismaClient();
  const cohortId = validatedValues.get("startDate");
  if (cohortId) {
    const cohort = await db.cohort.findFirst({
      where: {
        id: cohortId,
        courseId: application.courseId ?? undefined,
        status: "OPEN",
        startsAt: { gt: new Date() },
      },
      select: {
        id: true,
        startsAt: true,
        seatLimit: true,
        _count: {
          select: {
            applications: {
              where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED"] } },
            },
          },
        },
      },
    });
    if (
      !cohort ||
      (cohort.seatLimit !== null &&
        cohort._count.applications >= cohort.seatLimit)
    ) {
      return {
        error: "That cohort is no longer available. Choose an open option.",
        message: null,
      };
    }
    updateData.cohort = { connect: { id: cohort.id } };
    updateData.preferredStartDate = new Date(
      Date.UTC(
        cohort.startsAt.getUTCFullYear(),
        cohort.startsAt.getUTCMonth(),
        cohort.startsAt.getUTCDate(),
      ),
    );
  }

  await db.scholarshipApplication.update({
    where: { id: application.id, applicantId: session.user.id },
    data: {
      ...updateData,
      completionRequiredFields: Array.from(new Set(unresolved)),
    },
  });

  revalidatePath("/dashboard");
  return {
    error: null,
    message:
      unresolved.length === 0
        ? "Your profile is complete. Learning-portal access is now available."
        : "Your saved profile details have been updated.",
  };
}
