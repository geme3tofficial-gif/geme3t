import "server-only";

import { UserRole } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export async function linkLearnerApplication(userId: string, email: string) {
  const db = getPrismaClient();
  const normalizedEmail = email.toLowerCase();
  const application = await db.scholarshipApplication.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    orderBy: { submittedAt: "desc" },
  });

  if (
    !application ||
    (application.applicantId && application.applicantId !== userId)
  ) {
    return false;
  }

  const profile = await db.userProfile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (profile && profile.role !== UserRole.STUDENT) return false;

  await db.$transaction([
    db.userProfile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: normalizedEmail,
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone,
        role: UserRole.STUDENT,
      },
      update: {
        email: normalizedEmail,
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone,
      },
    }),
    db.scholarshipApplication.update({
      where: { id: application.id },
      data: { applicantId: userId },
    }),
  ]);

  return true;
}
