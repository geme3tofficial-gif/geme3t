"use client";

import { clearDigitalServiceTestData } from "@/app/(digital-service)/digital-service/sales/actions";

export function ClearTestDataButton() {
  async function clearData() {
    if (!window.confirm("Permanently clear all sales, customers, customer coupons, finance entries, and day-close records?")) {
      return;
    }
    await clearDigitalServiceTestData();
  }

  return (
    <form action={clearData} style={{ marginTop: 12 }}>
      <button className="button button--small" style={{ background: "#dc2626", color: "#fff" }} type="submit">
        Clear all sales and customer test data
      </button>
    </form>
  );
}
