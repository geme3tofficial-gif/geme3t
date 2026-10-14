"use server";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TeacherSignInState = {
  error: string | null;
};

export async function signInTeacher(
  _previousState: TeacherSignInState,
  formData: FormData,
): Promise<TeacherSignInState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length === 0
  ) {
    return { error: "Enter a valid email address and password." };
  }
  if (!getSupabasePublicConfig()) {
    return {
      error: "Teacher sign-in is not configured. Please contact the academy.",
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
  if (profile?.role !== UserRole.TEACHER) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error(
        "Non-teacher session cleanup failed.",
        signOutError.message,
      );
      throw new Error("Could not clear the unauthorized sign-in session.");
    }
    return {
      error: "This account is not assigned the teacher role.",
    };
  }

  redirect("/teacher");
}

export async function signOutTeacher() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Teacher sign-out failed.", error.message);
    throw new Error("Could not sign out. Please try again.");
  }
  redirect("/teacher/sign-in");
}
