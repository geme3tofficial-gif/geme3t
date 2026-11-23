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
      description="The admin workspace could not verify your session or load its data. Retry the page. If this keeps happening, check Supabase Auth connectivity and configuration, plus the database connection and DATABASE_URL."
      error={error}
      retry={retry}
      title="Admin workspace unavailable"
    />
  );
}
