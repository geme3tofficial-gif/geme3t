"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateMissingCustomerPerformanceLinks } from "@/app/(digital-service)/digital-service/customers/actions";

export function GenerateCustomerPerformanceLinksButton({ missingCount }: { missingCount: number }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function generateLinks() {
    if (isLoading || missingCount === 0) return;
    if (
      !window.confirm(
        `Generate public tracking links for ${missingCount} customer${missingCount === 1 ? "" : "s"} without a visible link? Any older hash-only link for those customers will stop working.`,
      )
    ) return;

    setIsLoading(true);
    try {
      const generatedCount = await generateMissingCustomerPerformanceLinks();
      toast.success(
        generatedCount === 0
          ? "All customers already have a visible tracking link."
          : `Generated tracking links for ${generatedCount} customer${generatedCount === 1 ? "" : "s"}.`,
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate customer tracking links.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      className="button button--small"
      disabled={isLoading || missingCount === 0}
      onClick={() => void generateLinks()}
      type="button"
    >
      {isLoading
        ? "Generating links..."
        : missingCount === 0
          ? "All links generated"
          : `Generate links for ${missingCount} existing customer${missingCount === 1 ? "" : "s"}`}
    </button>
  );
}
