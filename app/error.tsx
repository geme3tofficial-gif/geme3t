"use client";

import { AppErrorScreen, type AppError } from "@/components/app-error-screen";

export default function Error({
  error,
  retry,
}: {
  error: AppError;
  retry: () => void;
}) {
  return <AppErrorScreen error={error} retry={retry} />;
}
