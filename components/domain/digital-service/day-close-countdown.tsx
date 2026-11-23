"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { closeDigitalServiceDay } from "@/app/(digital-service)/digital-service/sales-reports/actions";

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function DayCloseCountdown() {
  const [now, setNow] = useState(() => new Date());
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();
  const closingDate = useRef<string | null>(null);
  const lastAttemptAt = useRef(0);

  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
  );
  const remaining = Math.max(0, nextMidnight.getTime() - now.getTime());

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = new Date();
      setNow(current);
      const previousBusinessDate = localDateString(
        new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1),
      );

      if (
        closingDate.current !== previousBusinessDate &&
        Date.now() - lastAttemptAt.current >= 60_000
      ) {
        closingDate.current = previousBusinessDate;
        lastAttemptAt.current = Date.now();
        setIsClosing(true);
        const formData = new FormData();
        formData.set("date", previousBusinessDate);
        formData.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
        closeDigitalServiceDay(formData)
          .then((result) => {
            if (result.pendingCount > 0) {
              toast.success(
                `Day closed. ${result.pendingCount} pending service${result.pendingCount === 1 ? "" : "s"} carried to ${result.nextDate}.`,
              );
              router.refresh();
            }
          })
          .catch((error: unknown) => {
            closingDate.current = null;
            toast.error(error instanceof Error ? error.message : "Automatic day close failed.");
          })
          .finally(() => setIsClosing(false));
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <section className="card digital-service-day-close">
      <div>
        <strong>Automatic day close</strong>
        <br />
        <small>
          Pending services are carried to the next day at midnight. Completed services remain unchanged.
        </small>
        <p className="digital-service-day-close-status" aria-live="polite">
          {isClosing ? "Closing the previous business day…" : "Time remaining until close"}
        </p>
      </div>
      <strong className="digital-service-day-close-countdown" aria-label="Time remaining until day close">
        {formatCountdown(remaining)}
      </strong>
    </section>
  );
}
