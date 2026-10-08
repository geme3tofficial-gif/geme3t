import type { ReactNode } from "react";
import { DashboardNavigation } from "./dashboard-navigation";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="student-layout">
      <DashboardNavigation role="Student" />
      <div className="student-main">
        <header className="student-topbar">
          <span className="student-topbar-label">Student workspace</span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
