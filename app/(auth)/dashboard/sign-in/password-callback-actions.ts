"use server";

import { redirect } from "next/navigation";
import { linkLearnerApplication } from "@/lib/learner-account";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function completeLearnerPasswordReset(formData: FormData) {
  const codeValue = formData.get("code");
  if (typeof codeValue !== "string" || !codeValue) {
    redirect("/dashboard/sign-in?error=link-invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codeValue);
  if (error || !data.user?.email) {
    if (error) {
      console.error("Student password link verification failed.", error.message);
    }
    redirect("/dashboard/sign-in?error=link-invalid");
  }

  const linked = await linkLearnerApplication(data.user.id, data.user.email);
  if (!linked) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error(
        "Invalid student password session cleanup failed.",
        signOutError.message,
      );
      throw new Error("Could not clear the invalid student session.");
    }
    redirect("/dashboard/sign-in?error=application-required");
  }

  redirect("/dashboard/reset-password/update");
}
