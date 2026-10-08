"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";

const unexpectedErrorMessage =
  "Something went wrong. Please try again. If the problem continues, contact support.";

export function AppToaster() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      console.error("Unhandled client-side error.", event.error ?? event.message);
      toast.error(unexpectedErrorMessage, { id: "unhandled-client-error" });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      console.error("Unhandled client-side promise rejection.", event.reason);
      toast.error(unexpectedErrorMessage, { id: "unhandled-client-error" });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return <Toaster closeButton position="top-right" richColors />;
}
