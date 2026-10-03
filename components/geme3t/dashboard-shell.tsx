import type { ReactNode } from "react";
import { DashboardNavigation } from "./dashboard-navigation";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="student-layout">
      <DashboardNavigation role="Student" />
      <div className="student-main">
        <header className="student-topbar">
          <span className="student-topbar-label">Preview student dashboard</span>
          <div className="student-user">
            <span className="avatar" aria-hidden="true">JD</span>
            <strong>Jordan</strong>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
