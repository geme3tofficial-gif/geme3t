"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { linkLearnerApplication } from "@/lib/learner-account";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LearnerSignInState = {
  message: string | null;
  error: string | null;
};

function readEmail(formData: FormData) {
  const value = formData.get("email");
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

async function getAuthRedirectUrl(path: string) {
  const requestHeaders = await headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin =
    configuredOrigin ??
    (host ? new URL(`${protocol}://${host}`).origin : null);
  return origin ? `${origin}${path}` : null;
}

export async function signInLearner(
  _previousState: LearnerSignInState,
  formData: FormData,
): Promise<LearnerSignInState> {
  const email = readEmail(formData);
  const passwordValue = formData.get("password");
  if (
    !email ||
    typeof passwordValue !== "string" ||
    !passwordValue
  ) {
    return {
      message: null,
      error: "Enter a valid application email and password.",
    };
  }
  if (!getSupabasePublicConfig()) {
    return {
      message: null,
      error: "Student sign-in is not configured. Please contact the academy.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: passwordValue,
  });
  if (error || !data.user?.email) {
    return {
      message: null,
      error: "Those sign-in details could not be verified.",
    };
  }

  const linked = await linkLearnerApplication(data.user.id, data.user.email);
  if (!linked) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Invalid student session cleanup failed.", signOutError.message);
      throw new Error("Could not clear the invalid student session.");
    }
    return {
      message: null,
      error: "This account could not be linked to a student application.",
    };
  }

  redirect("/dashboard");
}

export async function requestLearnerPasswordReset(
  _previousState: LearnerSignInState,
  formData: FormData,
): Promise<LearnerSignInState> {
  const email = readEmail(formData);
  if (!email) return { message: null, error: "Enter a valid email address." };
  if (!getSupabasePublicConfig()) {
    return {
      message: null,
      error: "Student sign-in is not configured. Please contact the academy.",
    };
  }

  const application = await getPrismaClient().scholarshipApplication.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (application) {
    const redirectTo = await getAuthRedirectUrl("/auth/reset-password");
    if (!redirectTo) {
      return {
        message: null,
        error: "Could not determine the password reset address. Please contact the academy.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      console.error("Student password reset request failed.", error.message);
      return {
        message: null,
        error: "Could not send a password reset email. Please try again.",
      };
    }
  }

  return {
    message:
      "If there is a student account for that application email, a password reset link is on its way.",
    error: null,
  };
}

export async function requestLearnerPasswordSetup(
  _previousState: LearnerSignInState,
  formData: FormData,
): Promise<LearnerSignInState> {
  const email = readEmail(formData);
  if (!email) return { message: null, error: "Enter a valid email address." };
  if (!getSupabasePublicConfig()) {
    return {
      message: null,
      error: "Student sign-in is not configured. Please contact the academy.",
    };
  }

  const application = await getPrismaClient().scholarshipApplication.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (application) {
    const emailRedirectTo = await getAuthRedirectUrl("/auth/reset-password");
    if (!emailRedirectTo) {
      return {
        message: null,
        error: "Could not determine the account setup address. Please contact the academy.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo, shouldCreateUser: true },
    });
    if (error) {
      console.error("Student password setup request failed.", error.message);
      return {
        message: null,
        error: "Could not send an account setup email. Please try again.",
      };
    }
  }

  return {
    message:
      "If there is an application for that address, an account setup link is on its way.",
    error: null,
  };
}
