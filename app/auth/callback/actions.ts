"use server";

import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function clearLearnerSession(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Invalid learner session cleanup failed.", error.message);
    throw new Error("Could not clear the invalid learner session.");
  }
}

export async function completeLearnerSignIn(formData: FormData) {
  const codeValue = formData.get("code");
  if (typeof codeValue !== "string" || !codeValue) {
    redirect("/dashboard/sign-in?error=link-invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codeValue);
  if (error || !data.user?.email) {
    if (error) console.error("Learner authentication callback failed.", error.message);
    redirect("/dashboard/sign-in?error=link-invalid");
  }

  const email = data.user.email.toLowerCase();
  const db = getPrismaClient();
  const application = await db.scholarshipApplication.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { submittedAt: "desc" },
  });

  if (!application || (application.applicantId && application.applicantId !== data.user.id)) {
    await clearLearnerSession(supabase);
    redirect("/dashboard/sign-in?error=application-required");
  }

  try {
    await db.$transaction([
      db.userProfile.upsert({
        where: { id: data.user.id },
        create: {
          id: data.user.id,
          email,
          firstName: application.firstName,
          lastName: application.lastName,
          phone: application.phone,
        },
        update: {
          email,
          firstName: application.firstName,
          lastName: application.lastName,
          phone: application.phone,
        },
      }),
      db.scholarshipApplication.update({
        where: { id: application.id },
        data: { applicantId: data.user.id },
      }),
    ]);
  } catch (linkError) {
    console.error("Learner application account linking failed.", linkError);
    await clearLearnerSession(supabase);
    redirect("/dashboard/sign-in?error=link-failed");
  }

  redirect("/dashboard");
}
