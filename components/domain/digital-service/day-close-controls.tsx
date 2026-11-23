"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { closeDigitalServiceDay } from "@/app/(digital-service)/digital-service/sales-reports/actions";

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DayCloseControls() {
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  async function closeCurrentDay() {
    if (isClosing) return;
    if (!window.confirm("Close the current day and carry unfinished services to the next business day?")) return;

    setIsClosing(true);
    try {
      const formData = new FormData();
      formData.set("date", localDateString(new Date()));
      formData.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      const result = await closeDigitalServiceDay(formData);
      toast.success(
        `Day closed. ${result.pendingCount} pending service${result.pendingCount === 1 ? "" : "s"} carried to ${result.nextDate}.`,
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not close the day.");
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <div className="digital-service-report-actions">
      <form action="/digital-service/sales-reports/export" method="get">
        <input type="hidden" name="format" value="csv" />
        <button className="btn btn-gray" type="submit">Export CSV</button>
      </form>
      <form action="/digital-service/sales-reports/export" method="get">
        <input type="hidden" name="format" value="xlsx" />
        <button className="btn btn-gray" type="submit">Export Excel</button>
      </form>
      <form action="/digital-service/sales-reports/export" method="get">
        <input type="hidden" name="format" value="docx" />
        <button className="btn btn-gray" type="submit">Export Word</button>
      </form>
      <form action="/digital-service/sales-reports/export" method="get">
        <input type="hidden" name="format" value="pdf" />
        <button className="btn btn-gray" type="submit">Export PDF</button>
      </form>
      <button className="btn btn-primary" type="button" onClick={closeCurrentDay} disabled={isClosing}>
        {isClosing ? "Closing…" : "Close Current Day"}
      </button>
    </div>
  );
}
