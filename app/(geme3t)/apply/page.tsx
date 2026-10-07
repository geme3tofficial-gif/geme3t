import type { Metadata } from "next";
import { ScholarshipApplication } from "@/components/geme3t/scholarship-application";

export const metadata: Metadata = {
  title: "Apply for a 2026 Tech Scholarship",
  description:
    "Apply for a 2026 GEME3T tech scholarship and take your next step towards a job-ready digital career.",
};

export default function ApplyPage() {
  return <ScholarshipApplication />;
}
