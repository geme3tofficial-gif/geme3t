"use server";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getLearnerSession } from "@/lib/learner-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordUpdateState = {
  error: string | null;
};

export async function updateLearnerPassword(
  _previousState: PasswordUpdateState,
  formData: FormData,
): Promise<PasswordUpdateState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  if (
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    password.length < 12
  ) {
    return { error: "Choose a password that is at least 12 characters long." };
  }
  if (password !== confirmPassword) {
    return { error: "The passwords do not match." };
  }

  const session = await getLearnerSession();
  if (
    !session?.user ||
    session.profile?.role !== UserRole.STUDENT ||
    !session.profile.applications.some(
      (application) => application.email.toLowerCase() === session.user.email?.toLowerCase(),
    )
  ) {
    redirect("/dashboard/sign-in?error=application-required");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Student password update failed.", error.message);
    return {
      error: "Could not update your password. Request a new password link and try again.",
    };
  }

  redirect("/dashboard");
}
