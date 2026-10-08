import type { Metadata } from "next";
import { ScholarshipApplication } from "@/components/geme3t/scholarship-application";

export const metadata: Metadata = {
  title: "GEME3T free tech bootcamp",
  description:
    "Apply for the GEME3T free tech bootcamp and be part of the generation that is transforming tomorrow .",
};

export default function ApplyPage() {
  return <ScholarshipApplication />;
}
