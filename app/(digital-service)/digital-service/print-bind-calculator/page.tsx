import type { Metadata } from "next";
import { PrintBindCalculator } from "@/components/domain/digital-service/print-bind-calculator";
export const metadata: Metadata = { title: "Print and bind calculator" };
export default function PrintBindCalculatorPage() {
  return <><div className="dashboard-welcome"><div><span className="eyebrow">Print & bind</span><h1>Quote calculator</h1><p>Live calculation for page jobs, binding, affiliates, and discounts.</p></div></div>
    <PrintBindCalculator /></>;
}
