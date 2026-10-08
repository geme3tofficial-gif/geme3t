import "server-only";

import { ScholarshipStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export async function getActiveScholarshipOptions() {
  const scholarships = await getPrismaClient().scholarship.findMany({
    where: { status: ScholarshipStatus.ACTIVE },
    orderBy: [{ sponsor: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sponsor: true,
      tuitionPercent: true,
      amount: true,
      currency: true,
    },
  });

  return scholarships.map((scholarship) => ({
    value: scholarship.name,
    label: `${scholarship.name} · ${scholarship.tuitionPercent ?? 0}% off${scholarship.amount ? ` · ${scholarship.currency} ${scholarship.amount.toString()}` : ""}`,
  }));
}
