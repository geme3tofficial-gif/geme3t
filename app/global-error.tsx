"use client";

import { AppErrorScreen, type AppError } from "@/components/app-error-screen";
import { AppToaster } from "@/components/app-toaster";

export default function GlobalError({
  error,
  retry,
}: {
  error: AppError;
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <AppToaster />
        <AppErrorScreen error={error} retry={retry} />
      </body>
    </html>
  );
}
