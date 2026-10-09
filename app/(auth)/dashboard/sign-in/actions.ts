"use server";

import { headers } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LearnerSignInState = {
  message: string | null;
  error: string | null;
};

export async function requestLearnerSignIn(
  _previousState: LearnerSignInState,
  formData: FormData,
): Promise<LearnerSignInState> {
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { message: null, error: "Enter a valid email address." };
  }
  if (!getSupabasePublicConfig()) {
    return {
      message: null,
      error: "Secure learner sign-in is not configured. Please contact the academy.",
    };
  }

  const application = await getPrismaClient().scholarshipApplication.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  if (application) {
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
    if (!origin) {
      return {
        message: null,
        error: "Could not determine the sign-in link address. Please contact the academy.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error("Learner sign-in link request failed.", error.message);
      return {
        message: null,
        error: "Could not send a sign-in link. Please try again in a moment.",
      };
    }
  }

  return {
    message:
      "If there is an application for that address, a secure sign-in link is on its way.",
    error: null,
  };
}
