"use client";

import { AppErrorScreen, type AppError } from "@/components/app-error-screen";

export default function AdminError({
  error,
  retry,
}: {
  error: AppError;
  retry: () => void;
}) {
  return (
    <AppErrorScreen
      description="The admin workspace could not load its data. Retry the page. If this keeps happening, check that the Supabase database is reachable and the deployment has the correct DATABASE_URL."
      error={error}
      retry={retry}
      title="Admin workspace unavailable"
    />
  );
}
