import "server-only";

import { getPrismaClient } from "@/lib/prisma";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getLearnerSession() {
  if (!getSupabasePublicConfig()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Learner session validation failed.", error.message);
    throw new Error("Could not verify your learner session.");
  }
  if (!data.user) return null;

  const profile = await getPrismaClient().userProfile.findUnique({
    where: { id: data.user.id },
    select: {
      id: true,
      role: true,
      applications: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          gender: true,
          country: true,
          otherCountry: true,
          location: true,
          employmentStatus: true,
          educationLevel: true,
          learningMode: true,
          cohortId: true,
          courseId: true,
          course: { select: { imageUrl: true } },
          courseName: true,
          preferredStartDate: true,
          techExperience: true,
          jobPlacementSupport: true,
          specializedFocus: true,
          specializedGoal: true,
          mentorSupport: true,
          completionRequiredFields: true,
        },
      },
    },
  });

  return { user: data.user, profile };
}
