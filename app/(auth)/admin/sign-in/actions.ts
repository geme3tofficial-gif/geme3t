"use server";

import { getPrismaClient } from "@/lib/prisma";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AdminSignInState = {
  error: string | null;
};

export async function signInAdmin(
  _previousState: AdminSignInState,
  formData: FormData,
): Promise<AdminSignInState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length === 0
  ) {
    return { error: "Enter a valid email address and password." };
  }

  if (!getSupabasePublicConfig()) {
    return {
      error:
        "Admin sign-in is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env, then restart the app.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return { error: "Those sign-in details could not be verified." };
  }

  const profile = await getPrismaClient().userProfile.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });

  if (profile?.role !== "ADMIN") {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error(
        "Non-administrator session cleanup failed.",
        signOutError.message,
      );
      throw new Error("Could not clear the unauthorized sign-in session.");
    }
    return {
      error: "This account is not assigned the administrator role.",
    };
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Administrator sign-out failed.", error.message);
    throw new Error("Could not sign out. Please try again.");
  }
  redirect("/admin/sign-in");
}
