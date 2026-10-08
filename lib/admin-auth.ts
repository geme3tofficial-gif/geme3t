import "server-only";

import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAdmin() {
  if (!getSupabasePublicConfig()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Administrator session validation failed.", error.message);
    throw new Error("Could not verify your administrator session.");
  }
  if (!data.user) return null;

  const profile = await getPrismaClient().userProfile.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });

  return profile?.role === "ADMIN" ? data.user : null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/sign-in?error=admin-required");
  return admin;
}
