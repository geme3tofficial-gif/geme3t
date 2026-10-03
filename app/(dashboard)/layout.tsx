import type { ReactNode } from "react";
import { DashboardShell } from "@/components/geme3t/dashboard-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
